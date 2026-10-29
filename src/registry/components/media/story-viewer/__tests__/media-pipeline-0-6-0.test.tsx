/**
 * story-viewer 0.6.0 — media pipeline (SV1, unavailable path, F-04, pinned fetch guarantees).
 *
 *  M1  resolveMedia: current + next only, never previous; not ready while resolving
 *  M2  resolve null / rejection -> notice, onItemUnavailable once, then moves on; standalone stays
 *  M3  onMediaError: image + video retry once; no new src -> unavailable "media"
 *  M4  loadTimeoutMs -> unavailable "timeout"
 *  M5  custom frame callbacks (onReady / onEnded / onProgress / onError, ctx.src)
 *  M6  a video that errors mid-play is unavailable (no timer fallback)
 *  M8  an unavailable item is never "viewed"
 *  M7  pinned: no second media element for the swipe preview, no storage / URL writes
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import type { RenderItemContext, Story, StoryItem, StoryViewerHandle } from "../types";

const lazyImg = (id: string): StoryItem => ({ id, type: "image" });
const img = (id: string): StoryItem => ({ id, type: "image", src: `${id}.jpg` });
const vid = (id: string): StoryItem => ({ id, type: "video", src: `${id}.mp4` });
const story = (id: string, items: StoryItem[]): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items,
  createdAt: "2026-01-01T00:00:00Z",
});

const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
beforeEach(() => {
  vi.useFakeTimers();
  // jsdom never loads images: model a not-yet-loaded one.
  Object.defineProperty(HTMLImageElement.prototype, "complete", { configurable: true, get: () => false });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  } else {
    delete (HTMLImageElement.prototype as unknown as Record<string, unknown>).complete;
  }
});

function mount(stories: Story[], extra: Record<string, unknown> = {}) {
  const ref = createRef<StoryViewerHandle>();
  const onClose = vi.fn();
  render(
    <StoryViewer
      ref={ref}
      stories={stories}
      isOpen
      initialStoryIndex={0}
      onClose={onClose}
      disableStoryTransition
      {...extra}
    />,
  );
  return { ref, onClose };
}

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
/** Flush promise continuations (resolveMedia / onMediaError answers). */
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};
const bar = (i = 0) =>
  Number(screen.queryAllByRole("progressbar")[i]?.getAttribute("aria-valuenow") ?? NaN);
const theImage = () => document.querySelector("img") as HTMLImageElement | null;
const theVideo = () => document.querySelector("video") as HTMLVideoElement;
const notice = () => document.querySelector<HTMLElement>("[data-story-unavailable]");
const cursorOf = (ref: React.RefObject<StoryViewerHandle | null>) => ref.current!.getCursor();

describe("M1 resolveMedia", () => {
  it("is called for the current and the next item only, and the item is not ready while resolving", async () => {
    let release!: (v: { src: string }) => void;
    const resolveMedia = vi.fn((item: StoryItem) =>
      item.id === "a1"
        ? new Promise<{ src: string }>((r) => (release = r))
        : Promise.resolve({ src: `${item.id}.resolved.jpg` }),
    );
    mount([story("A", [lazyImg("a1"), lazyImg("a2"), lazyImg("a3")])], { resolveMedia });
    await flush();
    expect(resolveMedia.mock.calls.map((c) => c[0].id)).toEqual(["a1", "a2"]);
    // resolving: no media element, the bar waits
    expect(theImage()).toBeNull();
    tick(7000);
    expect(bar(0)).toBe(0);

    release({ src: "a1.resolved.jpg" });
    await flush();
    expect(theImage()!.getAttribute("src")).toBe("a1.resolved.jpg");
    tick(2000);
    expect(bar(0)).toBe(0); // still waiting for the image to load
    fireEvent.load(theImage()!);
    tick(2500);
    expect(bar(0)).toBeGreaterThan(30);
  });

  it("never resolves the previous item or story (a previous item is skipped over, then walked back to)", async () => {
    const resolveMedia = vi.fn(async (item: StoryItem) => ({ src: `${item.id}.r.jpg` }));
    const { ref } = mount(
      [
        story("A", [lazyImg("a1"), lazyImg("a2")]),
        story("B", [lazyImg("b1"), lazyImg("b2"), lazyImg("b3"), lazyImg("b4")]),
      ],
      { resolveMedia, initialStoryIndex: 1 },
    );
    await flush();
    const ids = () => resolveMedia.mock.calls.map((c) => c[0].id);
    expect(ids()).toEqual(["b1", "b2"]); // the previous story is never asked for
    act(() => ref.current!.goToItem(3)); // b4: b3 (its previous item) was skipped over
    await flush();
    expect(ids()).toEqual(["b1", "b2", "b4"]);
    expect(ids()).not.toContain("b3");
    expect(ids().some((id) => id.startsWith("a"))).toBe(false);
    act(() => ref.current!.goToItem(2)); // walking back: b3 is current NOW, so it is asked
    await flush();
    expect(ids()).toEqual(["b1", "b2", "b4", "b3"]);
    expect(ids().some((id) => id.startsWith("a"))).toBe(false);
  });

  it("an item that already has a src is never passed to resolveMedia", async () => {
    const resolveMedia = vi.fn(async () => ({ src: "x.jpg" }));
    mount([story("A", [img("a1"), img("a2")])], { resolveMedia });
    await flush();
    expect(resolveMedia).not.toHaveBeenCalled();
    expect(theImage()!.getAttribute("src")).toBe("a1.jpg");
  });
});

describe("M2 unavailable path", () => {
  it("null: notice (polite status), onItemUnavailable once with 'resolve', then the next item", async () => {
    const onItemUnavailable = vi.fn();
    const onPauseReasonsChange = vi.fn();
    const resolveMedia = vi.fn(async (item: StoryItem) =>
      item.id === "a1" ? null : { src: `${item.id}.jpg` },
    );
    const { ref } = mount([story("A", [lazyImg("a1"), lazyImg("a2")])], {
      resolveMedia,
      onItemUnavailable,
      onPauseReasonsChange,
    });
    await flush();
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("resolve");
    const status = notice()!.querySelector<HTMLElement>("[role=status]")!;
    expect(status.textContent).toBe("This story is no longer available");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(onItemUnavailable).toHaveBeenCalledTimes(1);
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "resolve");
    expect(onPauseReasonsChange).toHaveBeenCalledWith(["unavailable"]);
    expect(theImage()).toBeNull();

    tick(1400);
    expect(cursorOf(ref).itemIndex).toBe(0);
    tick(200);
    expect(cursorOf(ref).itemIndex).toBe(1);
    await flush();
    expect(notice()).toBeNull();
    expect(onItemUnavailable).toHaveBeenCalledTimes(1);
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith([]);
  });

  it("a rejection is the same; labels come from props; unavailableNoticeMs=0 moves on at once", async () => {
    const onItemUnavailable = vi.fn();
    const { ref } = mount([story("A", [lazyImg("a1"), img("a2")])], {
      resolveMedia: vi.fn(() => Promise.reject(new Error("gone"))),
      onItemUnavailable,
      unavailableNoticeMs: 0,
      labels: { unavailable: "Artik yok" },
    });
    await flush();
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "resolve");
    expect(cursorOf(ref).itemIndex).toBe(1);
  });

  it("an item with neither src nor resolveMedia is unavailable ('resolve')", () => {
    const onItemUnavailable = vi.fn();
    mount([story("A", [lazyImg("a1"), img("a2")])], { onItemUnavailable });
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "resolve");
  });

  it("standalone + single item: the notice stays with a close button that closes the viewer", async () => {
    const { ref, onClose } = mount([story("A", [lazyImg("a1")])], {
      resolveMedia: async () => null,
      standalone: true,
      labels: { unavailableClose: "Kapat" },
    });
    await flush();
    tick(10_000);
    expect(notice()).not.toBeNull();
    expect(cursorOf(ref).itemIndex).toBe(0);
    const close = screen.getByText("Kapat");
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("without standalone a single-item story moves on (closes at the end) and shows no close button", async () => {
    const { onClose } = mount([story("A", [lazyImg("a1")])], { resolveMedia: async () => null });
    await flush();
    expect(screen.queryByText("Close", { selector: "button[class*='z-20']" })).toBeNull();
    tick(1600);
    expect(onClose).toHaveBeenCalled();
  });
});

describe("M3 onMediaError", () => {
  it("image: asked once, a new src retries; a second failure is unavailable 'media'", async () => {
    const onItemUnavailable = vi.fn();
    const onMediaError = vi.fn(async () => "fresh.jpg");
    mount([story("A", [img("a1"), img("a2")])], { onMediaError, onItemUnavailable });
    fireEvent.error(theImage()!);
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect((onMediaError.mock.calls[0] as unknown as [StoryItem])[0].id).toBe("a1");
    expect(theImage()!.getAttribute("src")).toBe("fresh.jpg");
    expect(notice()).toBeNull();

    fireEvent.error(theImage()!);
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("media");
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "media");
  });

  it("image: no new src (void) -> unavailable 'media', then moves on", async () => {
    const onItemUnavailable = vi.fn();
    const { ref } = mount([story("A", [img("a1"), img("a2")])], {
      onMediaError: async () => undefined,
      onItemUnavailable,
    });
    fireEvent.error(theImage()!);
    await flush();
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "media");
    tick(1600);
    expect(cursorOf(ref).itemIndex).toBe(1);
  });

  it("without onMediaError a failed image is unavailable 'media' directly", () => {
    const onItemUnavailable = vi.fn();
    const { ref } = mount([story("A", [img("a1"), img("a2")])], { onItemUnavailable });
    fireEvent.error(theImage()!);
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("media");
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "media");
    tick(1600);
    expect(cursorOf(ref).itemIndex).toBe(1);
  });

  it("without onMediaError a failed frame (ctx.onError) is unavailable 'media'", () => {
    let ctx!: RenderItemContext;
    const onItemUnavailable = vi.fn();
    mount([story("A", [img("a1"), img("a2")])], {
      onItemUnavailable,
      renderItem: (_i: StoryItem, c: RenderItemContext) => {
        ctx = c;
        return <div />;
      },
    });
    act(() => ctx.onError());
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "media");
  });

  it("video: the host is asked once, the new src is used and playback resumes at the same time", async () => {
    const onMediaError = vi.fn(async () => "fresh.mp4");
    mount([story("A", [vid("v1"), img("a2")])], { onMediaError });
    const v = theVideo();
    Object.defineProperty(v, "currentTime", { configurable: true, writable: true, value: 7 });
    Object.defineProperty(v, "duration", { configurable: true, value: 20 });
    fireEvent.error(v);
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(theVideo().getAttribute("src")).toBe("fresh.mp4");
    expect(notice()).toBeNull();
    // the player seeks back to where it failed once the new media has metadata
    Object.defineProperty(theVideo(), "currentTime", { configurable: true, writable: true, value: 0 });
    Object.defineProperty(theVideo(), "duration", { configurable: true, value: 20 });
    fireEvent.loadedMetadata(theVideo());
    expect(theVideo().currentTime).toBe(7);
  });

  it("video: void answer -> unavailable 'media'", async () => {
    const onItemUnavailable = vi.fn();
    mount([story("A", [vid("v1"), img("a2")])], {
      onMediaError: async () => undefined,
      onItemUnavailable,
    });
    fireEvent.error(theVideo());
    await flush();
    expect(onItemUnavailable).toHaveBeenCalledTimes(1);
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "v1", "media");
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("media");
  });

  it("video: a second error after the retry is final", async () => {
    const onItemUnavailable = vi.fn();
    const onMediaError = vi.fn(async () => "fresh.mp4");
    mount([story("A", [vid("v1"), img("a2")])], { onMediaError, onItemUnavailable });
    fireEvent.error(theVideo());
    await flush();
    fireEvent.error(theVideo());
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "v1", "media");
  });
});

describe("M4 loadTimeoutMs", () => {
  it("media that is not ready in time -> unavailable 'timeout'", () => {
    const onItemUnavailable = vi.fn();
    mount([story("A", [img("a1"), img("a2")])], { loadTimeoutMs: 3000, onItemUnavailable });
    tick(2900);
    expect(notice()).toBeNull();
    tick(200);
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("timeout");
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "timeout");
  });

  it("media that loads in time never times out; default is off", () => {
    const onItemUnavailable = vi.fn();
    mount([story("A", [img("a1"), img("a2")])], { loadTimeoutMs: 3000, onItemUnavailable });
    tick(1000);
    fireEvent.load(theImage()!);
    tick(2500);
    expect(onItemUnavailable).not.toHaveBeenCalled();
    cleanup();
    mount([story("A", [img("a1"), img("a2")])], { onItemUnavailable });
    tick(60_000);
    expect(onItemUnavailable).not.toHaveBeenCalled();
  });

  it("counts the time spent resolving", async () => {
    const onItemUnavailable = vi.fn();
    mount([story("A", [lazyImg("a1"), img("a2")])], {
      resolveMedia: () => new Promise(() => {}),
      loadTimeoutMs: 2000,
      onItemUnavailable,
    });
    tick(2100);
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "timeout");
  });
});

describe("M5 custom frame callbacks", () => {
  it("renderItem frames stay ready immediately (0.5.4) and receive the callbacks", () => {
    let ctx!: RenderItemContext;
    const { ref } = mount([story("A", [img("a1"), img("a2")])], {
      renderItem: (_item: StoryItem, c: RenderItemContext) => {
        ctx = c;
        return <div data-testid="frame" />;
      },
    });
    expect(typeof ctx.onReady).toBe("function");
    expect(typeof ctx.onEnded).toBe("function");
    expect(typeof ctx.onProgress).toBe("function");
    expect(typeof ctx.onError).toBe("function");
    expect(ctx.src).toBe("a1.jpg");
    act(() => ctx.onReady()); // a no-op-safe signal
    tick(1000);
    expect(bar(0)).toBeGreaterThan(0); // the timer ran without any onReady
    act(() => ctx.onEnded());
    expect(cursorOf(ref).itemIndex).toBe(1);
  });

  it("ctx.onProgress drives the bar by media time (no timer), ctx.onEnded advances once", () => {
    let ctx!: RenderItemContext;
    const onItemViewed = vi.fn();
    const { ref } = mount([story("A", [img("a1"), img("a2")])], {
      onItemViewed,
      renderItem: (_item: StoryItem, c: RenderItemContext) => {
        ctx = c;
        return <div />;
      },
    });
    act(() => ctx.onProgress(3, 10));
    expect(bar(0)).toBe(30);
    tick(9000); // the wall clock must not complete it
    expect(cursorOf(ref).itemIndex).toBe(0);
    expect(bar(0)).toBe(30);
    const frameCtx = ctx; // the SAME callbacks, called twice (a re-render hands the next item its own)
    act(() => {
      frameCtx.onEnded();
      frameCtx.onEnded();
    });
    expect(cursorOf(ref).itemIndex).toBe(1);
    expect(onItemViewed).toHaveBeenCalledTimes(1);
  });

  it("a frame is not ready while its URL resolves and receives ctx.src afterwards", async () => {
    const seen: (string | undefined)[] = [];
    mount([story("A", [lazyImg("a1"), img("a2")])], {
      resolveMedia: async () => ({ src: "r.jpg", poster: "p.jpg" }),
      renderItem: (_i: StoryItem, c: RenderItemContext) => {
        seen.push(c.src);
        return <div />;
      },
    });
    expect(seen[0]).toBeUndefined();
    tick(1000); // resolveMedia still pending: the frame is not ready, so nothing counts
    expect(bar(0)).toBe(0);
    await flush();
    expect(seen[seen.length - 1]).toBe("r.jpg");
    tick(1000);
    expect(bar(0)).toBeGreaterThan(0);
  });

  it("ctx.onError goes through onMediaError and delivers the new src as ctx.src", async () => {
    let ctx!: RenderItemContext;
    const onItemUnavailable = vi.fn();
    mount([story("A", [img("a1"), img("a2")])], {
      onMediaError: async () => "fresh.jpg",
      onItemUnavailable,
      renderItem: (_i: StoryItem, c: RenderItemContext) => {
        ctx = c;
        return <div />;
      },
    });
    act(() => ctx.onError());
    await flush();
    expect(ctx.src).toBe("fresh.jpg");
    act(() => ctx.onError());
    await flush();
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "media");
  });
});

describe("M6 mid-play video error", () => {
  it("is unavailable 'media' (the bar does not restart on a timer), and moves on after the notice", () => {
    const onItemUnavailable = vi.fn();
    const { ref } = mount([story("A", [vid("v1"), img("a2")])], { onItemUnavailable });
    const v = theVideo();
    Object.defineProperty(v, "currentTime", { configurable: true, writable: true, value: 6 });
    Object.defineProperty(v, "duration", { configurable: true, value: 10 });
    fireEvent.loadedMetadata(v);
    fireEvent.timeUpdate(v);
    tick(40);
    expect(bar(0)).toBe(60);
    fireEvent.error(v);
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("media");
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "v1", "media");
    expect(theVideo()).toBeNull();
    tick(1600);
    expect(cursorOf(ref).itemIndex).toBe(1);
  });

  it("a live stream (non-finite duration) still falls back to the timer: not a failure", () => {
    const { ref } = mount([story("A", [vid("v1"), img("a2")])]);
    const v = theVideo();
    Object.defineProperty(v, "duration", { configurable: true, value: Infinity });
    fireEvent.loadedMetadata(v);
    fireEvent.play(v);
    expect(notice()).toBeNull();
    tick(5200);
    expect(cursorOf(ref).itemIndex).toBe(1);
  });
});

describe("M8 an unavailable item is never viewed", () => {
  const setup = (extra: Record<string, unknown> = {}) => {
    const onItemViewed = vi.fn();
    const m = mount([story("A", [img("a1"), img("a2")])], { onItemViewed, ...extra });
    fireEvent.error(theImage()!);
    return { ...m, onItemViewed };
  };
  it("notice timer moves on without onItemViewed", () => {
    const { ref, onItemViewed } = setup();
    tick(1600);
    expect(cursorOf(ref).itemIndex).toBe(1);
    expect(onItemViewed).not.toHaveBeenCalled();
  });
  it("unavailableNoticeMs=0 moves on without onItemViewed", () => {
    const { ref, onItemViewed } = setup({ unavailableNoticeMs: 0 });
    expect(cursorOf(ref).itemIndex).toBe(1);
    expect(onItemViewed).not.toHaveBeenCalled();
  });
  it("the user skipping the notice (next tap zone) fires nothing for it", () => {
    const { ref, onItemViewed } = setup();
    const zones = document.querySelectorAll<HTMLButtonElement>("div[aria-hidden='true'].absolute.inset-0.z-10 > button");
    fireEvent.click(zones[2]);
    expect(cursorOf(ref).itemIndex).toBe(1);
    expect(onItemViewed).not.toHaveBeenCalled();
  });
  it("a story jump away from an unavailable item fires no 'left'", () => {
    const onItemViewed = vi.fn();
    const { ref } = mount([story("A", [img("a1")]), story("B", [img("b1")])], { onItemViewed });
    fireEvent.error(theImage()!);
    act(() => ref.current!.goToStory(1));
    expect(onItemViewed).not.toHaveBeenCalled();
  });
  it("control: a normal item still reports 'completed'", () => {
    const onItemViewed = vi.fn();
    mount([story("A", [img("a1"), img("a2")])], { onItemViewed });
    fireEvent.load(theImage()!);
    tick(5200);
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "completed", { direction: "forward" });
  });
});

describe("M7 pinned fetch guarantees", () => {
  const drag = (target: Element) => {
    const ev = (type: string, x: number) =>
      fireEvent(
        target,
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: "mouse",
          button: 0,
          clientX: x,
          clientY: 100,
        }),
      );
    ev("pointerdown", 200);
    ev("pointermove", 120);
  };
  const zone = () =>
    document.querySelectorAll<HTMLButtonElement>("div[aria-hidden='true'].absolute.inset-0.z-10 > button")[1];
  const stories2 = () => [story("A", [img("a1"), img("a2")]), story("B", [img("b1")])];
  const mediaCount = () => document.querySelectorAll("img, video").length;

  it("control: with the transition on, the swipe preview mounts a second media element", () => {
    mount(stories2(), { disableStoryTransition: false });
    expect(mediaCount()).toBe(1);
    drag(zone());
    expect(mediaCount()).toBeGreaterThan(1);
  });

  it("disableStoryTransition: dragging mounts no second media element", () => {
    mount(stories2(), { disableStoryTransition: true });
    drag(zone());
    expect(mediaCount()).toBe(1);
  });

  it("reduced motion: dragging mounts no second media element", () => {
    const real = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    try {
      mount(stories2(), { disableStoryTransition: false });
      drag(zone());
      expect(mediaCount()).toBe(1);
    } finally {
      window.matchMedia = real;
    }
  });

  it("src / resolved URLs are never written to storage, history or the location", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const push = vi.spyOn(window.history, "pushState");
    const replace = vi.spyOn(window.history, "replaceState");
    const before = window.location.href;
    const resolveMedia = vi.fn(async (item: StoryItem) => ({ src: `https://cdn.example/${item.id}.jpg` }));
    const { ref } = mount([story("A", [lazyImg("a1"), lazyImg("a2"), img("a3")])], {
      resolveMedia,
      onMediaError: async () => "https://cdn.example/fresh.jpg",
    });
    await flush();
    fireEvent.error(theImage()!);
    await flush();
    act(() => ref.current!.goToItem(1));
    await flush();
    act(() => ref.current!.goToItem(2));
    await flush();
    expect(setItem).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(window.location.href).toBe(before);
    for (const store of [window.localStorage, window.sessionStorage]) {
      expect(store.length).toBe(0);
    }
  });
});
