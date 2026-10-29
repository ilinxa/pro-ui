/**
 * story-viewer 0.7.0 - slice M (media). Rows B1-B6 of the release-9 contract.
 *
 *  B1  SV-6   srcSet / sizes reach the stage <img> and the renderItem context; a retry URL plays alone
 *  B2  SV-4(5) the one-shot onMediaError retry re-arms once the retried media loaded (image + video)
 *  B3  SV-4(8) a failed <img> is hidden at once (stage + cube ghost)
 *  B4  SV-4(9) result expiry, invalidateMedia, negative cache, retry write-back, metadata key
 *  B5  SV-3   preloadNext: off-DOM Image()/video for the NEXT item only
 *  B6  SV-2   ambient / custom desktop backdrop under the dialog overlay
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
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
const OriginalImage = globalThis.Image;
const originalMatchMedia = window.matchMedia;
beforeEach(() => {
  vi.useFakeTimers();
  // jsdom never loads images: model a not-yet-loaded one.
  Object.defineProperty(HTMLImageElement.prototype, "complete", { configurable: true, get: () => false });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  globalThis.Image = OriginalImage;
  window.matchMedia = originalMatchMedia;
  Object.defineProperty(navigator, "connection", { configurable: true, value: undefined });
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  } else {
    delete (HTMLImageElement.prototype as unknown as Record<string, unknown>).complete;
  }
});

function mount(stories: Story[], extra: Record<string, unknown> = {}) {
  const ref = createRef<StoryViewerHandle>();
  const onClose = vi.fn();
  const view = render(
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
  return { ref, onClose, view };
}

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};
const stageImg = () => document.querySelector<HTMLImageElement>("[data-story-stage] img");
const stageVideo = () => document.querySelector<HTMLVideoElement>("video");
const notice = () => document.querySelector<HTMLElement>("[data-story-unavailable]");

// ─── B1 ──────────────────────────────────────────────────────────────────
describe("B1 srcSet / sizes", () => {
  it("resolveMedia srcSet/sizes reach the <img>; an onMediaError retry plays the new src alone", async () => {
    const resolveMedia = vi.fn(async (item: StoryItem) => ({
      src: `${item.id}.jpg`,
      srcSet: `${item.id}-1x.jpg 1x, ${item.id}-2x.jpg 2x`,
      sizes: "(min-width: 768px) 400px, 100vw",
    }));
    const onMediaError = vi.fn(async () => "fresh.jpg");
    mount([story("A", [lazyImg("a1"), img("a2")])], { resolveMedia, onMediaError });
    await flush();
    expect(stageImg()!.getAttribute("srcset")).toBe("a1-1x.jpg 1x, a1-2x.jpg 2x");
    expect(stageImg()!.getAttribute("sizes")).toBe("(min-width: 768px) 400px, 100vw");
    fireEvent.error(stageImg()!);
    await flush();
    expect(stageImg()!.getAttribute("src")).toBe("fresh.jpg");
    expect(stageImg()!.hasAttribute("srcset")).toBe(false);
    expect(stageImg()!.hasAttribute("sizes")).toBe(false);
  });

  it("item.srcSet / sizes (own src) and the renderItem context carry them", () => {
    const seen: RenderItemContext[] = [];
    mount([story("A", [{ id: "a1", type: "image", src: "a1.jpg", srcSet: "a1-2x.jpg 2x", sizes: "50vw" }])], {
      renderItem: (_item: StoryItem, ctx: RenderItemContext) => {
        seen.push(ctx);
        return <span data-testid="frame" />;
      },
    });
    const ctx = seen[seen.length - 1]!;
    expect(ctx.srcSet).toBe("a1-2x.jpg 2x");
    expect(ctx.sizes).toBe("50vw");
  });

  it("a video ignores srcSet", () => {
    mount([story("A", [{ id: "v1", type: "video", src: "v1.mp4", srcSet: "x 2x" }])]);
    expect(stageVideo()!.hasAttribute("srcset")).toBe(false);
  });
});

// ─── B2 ──────────────────────────────────────────────────────────────────
describe("B2 retry re-arms after the retried media loaded", () => {
  it("image: retry loads, later fails -> the host is asked again", async () => {
    const onMediaError = vi.fn(async (item: StoryItem) => (item.src === "a1.jpg" ? "r1.jpg" : "r2.jpg"));
    mount([story("A", [img("a1"), img("a2")])], { onMediaError });
    fireEvent.error(stageImg()!);
    await flush();
    expect(stageImg()!.getAttribute("src")).toBe("r1.jpg");
    fireEvent.load(stageImg()!); // the retried URL loaded
    fireEvent.error(stageImg()!); // ...and failed later
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(2);
    expect(stageImg()!.getAttribute("src")).toBe("r2.jpg");
  });

  it("image: a retry that fails BEFORE it loaded -> unavailable, host asked once", async () => {
    const onMediaError = vi.fn(async () => "r1.jpg");
    mount([story("A", [img("a1"), img("a2")])], { onMediaError });
    fireEvent.error(stageImg()!);
    await flush();
    fireEvent.error(stageImg()!);
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(1);
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("media");
  });

  it("video: retry plays, later fails -> asked again; a retry failing before it played -> not asked twice", async () => {
    const onMediaError = vi.fn(async (item: StoryItem) => (item.src === "v1.mp4" ? "r1.mp4" : "r2.mp4"));
    mount([story("A", [vid("v1"), img("a2")])], { onMediaError });
    fireEvent.error(stageVideo()!);
    await flush();
    expect(stageVideo()!.getAttribute("src")).toBe("r1.mp4");
    fireEvent.play(stageVideo()!); // the retried URL started
    fireEvent.error(stageVideo()!);
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(2);
    expect(stageVideo()!.getAttribute("src")).toBe("r2.mp4");
    fireEvent.error(stageVideo()!); // r2 fails before it ever played
    await flush();
    expect(onMediaError).toHaveBeenCalledTimes(2);
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("media");
  });
});

// ─── B3 ──────────────────────────────────────────────────────────────────
describe("B3 a failed image is hidden at once", () => {
  it("stage <img> gets visibility:hidden while onMediaError is pending, until a new src replaces it", async () => {
    let answer!: (v: string) => void;
    const onMediaError = vi.fn(() => new Promise<string>((r) => (answer = r)));
    mount([story("A", [img("a1"), img("a2")])], { onMediaError });
    expect(stageImg()!.style.visibility).toBe("");
    fireEvent.error(stageImg()!);
    expect(stageImg()!.style.visibility).toBe("hidden");
    answer("fresh.jpg");
    await flush();
    expect(stageImg()!.getAttribute("src")).toBe("fresh.jpg");
    expect(stageImg()!.style.visibility).toBe("");
  });

  it("the cube ghost <img> hides on error too", async () => {
    const { ref } = mount(
      [story("A", [img("a1")]), story("B", [img("b1")])],
      { disableStoryTransition: false, storyTransitionDurationMs: 400 },
    );
    act(() => ref.current!.goToStory(1));
    const ghost = document.querySelector<HTMLImageElement>("[inert] img");
    expect(ghost).not.toBeNull();
    fireEvent.error(ghost!);
    expect(ghost!.style.visibility).toBe("hidden");
  });
});

// ─── B4 ──────────────────────────────────────────────────────────────────
describe("B4 result ageing, invalidateMedia, negative cache, retry write-back", () => {
  it("(a) an aged-out NEXT result is resolved again; the current one is never swapped", async () => {
    const resolveMedia = vi.fn(async (item: StoryItem) => ({
      src: `${item.id}.v${resolveMedia.mock.calls.filter((c) => c[0].id === item.id).length}.jpg`,
      maxAgeMs: 1000,
    }));
    const { ref } = mount([story("A", [lazyImg("a1"), lazyImg("a2"), lazyImg("a3")])], { resolveMedia });
    await flush();
    const calls = (id: string) => resolveMedia.mock.calls.filter((c) => c[0].id === id).length;
    expect(calls("a1")).toBe(1);
    expect(calls("a2")).toBe(1);
    const shown = stageImg()!.getAttribute("src");
    tick(1600);
    await flush();
    expect(calls("a2")).toBeGreaterThanOrEqual(2); // next aged out -> resolved again
    expect(calls("a1")).toBe(1); // the item on screen is never refreshed because it aged out
    expect(stageImg()!.getAttribute("src")).toBe(shown);
    // revisit: leave a1 for a3, come back after a1's result aged out -> resolved again before it plays
    act(() => ref.current!.goToItem(2));
    await flush();
    act(() => ref.current!.goToItem(0));
    await flush();
    expect(calls("a1")).toBeGreaterThanOrEqual(2);
  });

  it("(a) the cube ghost never gets an expired URL", async () => {
    const resolveMedia = vi.fn(async (item: StoryItem) => ({ src: `${item.id}.jpg`, maxAgeMs: 1000 }));
    const { ref } = mount(
      [story("A", [lazyImg("a1")]), story("B", [lazyImg("b1")])],
      { resolveMedia, disableStoryTransition: false },
    );
    await flush();
    // b1 (next story) was resolved with maxAgeMs 1000 - after it aged out, the ghost must not use it.
    vi.setSystemTime(Date.now() + 5000);
    act(() => ref.current!.goToStory(1));
    // b1 is now current and aged out: it was dropped, never shown stale, and is resolved afresh.
    await flush();
    const bCalls = resolveMedia.mock.calls.filter((c) => c[0].id === "b1").length;
    expect(bCalls).toBeGreaterThanOrEqual(2);
  });

  it("(b) invalidateMedia(itemId): next re-resolved at once, current keeps playing what it has", async () => {
    let n = 0;
    const resolveMedia = vi.fn(async (item: StoryItem) => ({ src: `${item.id}.${++n}.jpg` }));
    const { ref } = mount([story("A", [lazyImg("a1"), lazyImg("a2")])], { resolveMedia });
    await flush();
    const calls = (id: string) => resolveMedia.mock.calls.filter((c) => c[0].id === id).length;
    const shown = stageImg()!.getAttribute("src");
    act(() => ref.current!.invalidateMedia("a2"));
    await flush();
    expect(calls("a2")).toBe(2);
    act(() => ref.current!.invalidateMedia("a1"));
    await flush();
    expect(calls("a1")).toBe(2); // fetched at once...
    expect(stageImg()!.getAttribute("src")).toBe(shown); // ...but not swapped on screen
    act(() => ref.current!.goToItem(1));
    await flush();
    act(() => ref.current!.goToItem(0));
    await flush();
    expect(stageImg()!.getAttribute("src")).not.toBe(shown); // its new URL is used from the next visit
  });

  it("(b) invalidateMedia() with no arguments forgets every item", async () => {
    const resolveMedia = vi.fn(async (item: StoryItem) => ({ src: `${item.id}.jpg` }));
    const { ref } = mount([story("A", [lazyImg("a1"), lazyImg("a2")])], { resolveMedia });
    await flush();
    act(() => ref.current!.invalidateMedia());
    await flush();
    expect(resolveMedia.mock.calls.filter((c) => c[0].id === "a2").length).toBe(2);
  });

  it("(c) a resolve failure recorded while 'next' is retried ONCE when the item becomes current", async () => {
    let a2 = 0;
    const resolveMedia = vi.fn(async (item: StoryItem) => {
      if (item.id === "a2") return ++a2 === 1 ? null : { src: "a2.jpg" };
      return { src: `${item.id}.jpg` };
    });
    const { ref } = mount([story("A", [lazyImg("a1"), lazyImg("a2")])], { resolveMedia });
    await flush();
    expect(a2).toBe(1);
    act(() => ref.current!.goToItem(1));
    await flush();
    expect(a2).toBe(2);
    expect(notice()).toBeNull();
    expect(stageImg()!.getAttribute("src")).toBe("a2.jpg");
  });

  it("(c) a failure while current is final (no loop)", async () => {
    const resolveMedia = vi.fn(async (item: StoryItem) => (item.id === "a2" ? null : { src: `${item.id}.jpg` }));
    const { ref } = mount([story("A", [lazyImg("a1"), lazyImg("a2")])], { resolveMedia, standalone: true });
    await flush();
    act(() => ref.current!.goToItem(1));
    await flush();
    tick(5000);
    await flush();
    expect(resolveMedia.mock.calls.filter((c) => c[0].id === "a2").length).toBe(2); // next + one retry as current
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("resolve");
  });

  it("(d) a retry URL is remembered for the item's next visit; dropped on close", async () => {
    const onMediaError = vi.fn(async () => "fresh.jpg");
    const ref = createRef<StoryViewerHandle>();
    const stories = [story("A", [img("a1"), img("a2")])];
    const props = { ref, stories, initialStoryIndex: 0, onClose: vi.fn(), disableStoryTransition: true, onMediaError };
    const view = render(<StoryViewer {...props} isOpen />);
    fireEvent.error(stageImg()!);
    await flush();
    fireEvent.load(stageImg()!);
    expect(stageImg()!.getAttribute("src")).toBe("fresh.jpg");
    act(() => ref.current!.goToItem(1));
    await flush();
    act(() => ref.current!.goToItem(0));
    await flush();
    expect(stageImg()!.getAttribute("src")).toBe("fresh.jpg"); // not the dead original
    expect(onMediaError).toHaveBeenCalledTimes(1);
    view.rerender(<StoryViewer {...props} isOpen={false} />);
    view.rerender(<StoryViewer {...props} isOpen />);
    await flush();
    expect(stageImg()!.getAttribute("src")).toBe("a1.jpg"); // dropped on close
  });

  it("(e) video metadata is kept per story:item - a same-id item in another story is not pre-seeded", () => {
    // Observable pin: both stories play their own `v1` (shared item id) without the viewer misreading it.
    const { ref } = mount([story("A", [vid("v1")]), story("B", [vid("v1")])]);
    const v = stageVideo()!;
    Object.defineProperty(v, "duration", { configurable: true, value: 10 });
    fireEvent.loadedMetadata(v);
    act(() => ref.current!.goToStory(1));
    expect(ref.current!.getCursor().storyIndex).toBe(1);
    expect(stageVideo()).not.toBeNull();
  });
});

// ─── B5 ──────────────────────────────────────────────────────────────────
function stubImage() {
  const made: { src: string; srcset: string; sizes: string; decode: ReturnType<typeof vi.fn> }[] = [];
  class FakeImage {
    src = "";
    srcset = "";
    sizes = "";
    decode = vi.fn(() => Promise.resolve());
    constructor() {
      made.push(this);
    }
  }
  globalThis.Image = FakeImage as unknown as typeof Image;
  return made;
}

describe("B5 preloadNext", () => {
  it("image: Image()+decode() for the next item once its URL is known; no DOM node; never the previous", async () => {
    const made = stubImage();
    let release!: (v: { src: string; srcSet: string; sizes: string }) => void;
    const resolveMedia = vi.fn((item: StoryItem) =>
      item.id === "a2"
        ? new Promise<{ src: string; srcSet: string; sizes: string }>((r) => (release = r))
        : Promise.resolve({ src: `${item.id}.jpg`, srcSet: "", sizes: "" }),
    );
    const { ref } = mount([story("A", [lazyImg("a1"), lazyImg("a2"), lazyImg("a3")])], { resolveMedia });
    await flush();
    expect(made).toHaveLength(0); // a2's URL is not known yet
    release({ src: "a2.jpg", srcSet: "a2-2x.jpg 2x", sizes: "50vw" });
    await flush();
    expect(made).toHaveLength(1);
    expect(made[0]!.src).toBe("a2.jpg");
    expect(made[0]!.srcset).toBe("a2-2x.jpg 2x");
    expect(made[0]!.sizes).toBe("50vw");
    expect(made[0]!.decode).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll("img")).toHaveLength(1); // only the stage image
    act(() => ref.current!.goToItem(1));
    await flush();
    // a3 is the new next; a1 (previous) is never preloaded
    expect(made.map((m) => m.src)).toEqual(["a2.jpg", "a3.jpg"]);
    // once per key: moving back and forth does not repeat a2
    act(() => ref.current!.goToItem(0));
    await flush();
    expect(made.filter((m) => m.src === "a2.jpg")).toHaveLength(1);
  });

  it("an own src is warmed at once; preloadNext={false}, Data Saver and a closed viewer do nothing", async () => {
    const made = stubImage();
    mount([story("A", [img("a1"), img("a2")])]);
    await flush();
    expect(made.map((m) => m.src)).toEqual(["a2.jpg"]);
    cleanup();

    const off = stubImage();
    mount([story("A", [img("a1"), img("a2")])], { preloadNext: false });
    await flush();
    expect(off).toHaveLength(0);
    cleanup();

    Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
    const saver = stubImage();
    mount([story("A", [img("a1"), img("a2")])]);
    await flush();
    expect(saver).toHaveLength(0);
    cleanup();
    Object.defineProperty(navigator, "connection", { configurable: true, value: undefined });

    const closed = stubImage();
    mount([story("A", [img("a1"), img("a2")])], { isOpen: false });
    await flush();
    expect(closed).toHaveLength(0);
  });

  it("video: an off-DOM metadata-only <video> that is torn down when it is no longer next", async () => {
    const created: HTMLVideoElement[] = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tag: string, o?: ElementCreationOptions) => {
      const el = realCreate(tag, o);
      if (tag === "video") created.push(el as HTMLVideoElement);
      return el;
    }) as typeof document.createElement);
    const { ref } = mount([story("A", [img("a1"), vid("v2"), img("a3")])]);
    await flush();
    const offDom = created.filter((v) => !v.isConnected && v.getAttribute("src") === "v2.mp4");
    expect(offDom).toHaveLength(1);
    expect(offDom[0]!.getAttribute("preload")).toBe("metadata");
    expect(document.querySelectorAll("video")).toHaveLength(0);
    act(() => ref.current!.goToItem(2)); // v2 is now previous, no longer next
    await flush();
    expect(offDom[0]!.hasAttribute("src")).toBe(false);
  });
});

// ─── B6 ──────────────────────────────────────────────────────────────────
const backdropEl = () => document.querySelector<HTMLElement>("[data-story-backdrop]");

describe("B6 backdrop", () => {
  it("ambient: portalled under the dialog overlay with the stage's loaded URL; dim before ready", () => {
    mount([story("A", [img("a1"), img("a2")])], { backdrop: "ambient" });
    expect(backdropEl()).toBeNull(); // not ready yet: dim
    fireEvent.load(stageImg()!);
    const layer = backdropEl()!;
    expect(layer).not.toBeNull();
    expect(layer.parentElement).toBe(document.body);
    expect(layer.closest("[role=dialog]")).toBeNull();
    expect(layer.getAttribute("aria-hidden")).toBe("true");
    expect(layer.className).toContain("z-40");
    expect(layer.className).toContain("pointer-events-none");
    expect(layer.className).toContain("hidden");
    expect(layer.className).toContain("md:block");
    const bg = layer.querySelector("img")!;
    expect(bg.getAttribute("src")).toBe(stageImg()!.currentSrc || stageImg()!.src);
    expect(bg.className).toContain("blur");
  });

  it("an item change cross-fades: the shown image holds while the next loads, then both layers for one fade", () => {
    const { ref } = mount([story("A", [img("a1"), img("a2")])], { backdrop: "ambient" });
    fireEvent.load(stageImg()!);
    const layerSrcs = () =>
      Array.from(backdropEl()?.querySelectorAll("img") ?? []).map((i) => i.getAttribute("src"));
    expect(layerSrcs()).toEqual([expect.stringContaining("a1")]);
    act(() => ref.current!.goToItem(1));
    expect(layerSrcs()).toEqual([expect.stringContaining("a1")]); // a2 loading: a1 holds, no dim flash
    fireEvent.load(stageImg()!);
    expect(layerSrcs()).toEqual([expect.stringContaining("a1"), expect.stringContaining("a2")]);
    tick(400);
    expect(layerSrcs()).toEqual([expect.stringContaining("a2")]);
  });

  it("default (dim) renders no backdrop layer", () => {
    mount([story("A", [img("a1"), img("a2")])]);
    fireEvent.load(stageImg()!);
    expect(backdropEl()).toBeNull();
  });

  it("a video without a poster is dim; with a poster the poster is used", async () => {
    mount([story("A", [vid("v1"), img("a2")])], { backdrop: "ambient" });
    fireEvent.play(stageVideo()!);
    expect(backdropEl()).toBeNull();
    cleanup();
    mount([story("A", [lazyImg("x"), img("a2")])], {
      backdrop: "ambient",
      resolveMedia: async () => ({ src: "x.mp4", poster: "x-poster.jpg" }),
    });
    cleanup();
    mount([story("A", [{ id: "v1", type: "video" }, img("a2")])], {
      backdrop: "ambient",
      resolveMedia: async () => ({ src: "v1.mp4", poster: "v1-poster.jpg" }),
    });
    await flush();
    fireEvent.play(stageVideo()!);
    expect(backdropEl()?.querySelector("img")?.getAttribute("src")).toBe("v1-poster.jpg");
  });

  it("reduced motion: ambient is dim; renderBackdrop still renders", () => {
    window.matchMedia = ((q: string) => ({
      matches: true,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    mount([story("A", [img("a1"), img("a2")])], { backdrop: "ambient" });
    fireEvent.load(stageImg()!);
    expect(backdropEl()).toBeNull();
    cleanup();
    mount([story("A", [img("a1"), img("a2")])], {
      backdrop: "ambient",
      renderBackdrop: (_s: Story, _i: StoryItem, ctx: { reducedMotion: boolean }) => (
        <div data-testid="custom-bg">{String(ctx.reducedMotion)}</div>
      ),
    });
    expect(backdropEl()?.querySelector("[data-testid=custom-bg]")?.textContent).toBe("true");
  });

  it("renderBackdrop wins over backdrop and receives the item context", () => {
    const seen: { src?: string; isReady: boolean }[] = [];
    mount([story("A", [img("a1"), img("a2")])], {
      backdrop: "ambient",
      renderBackdrop: (_s: Story, item: StoryItem, ctx: { src?: string; isReady: boolean }) => {
        seen.push(ctx);
        return <div data-testid="custom-bg">{item.id}</div>;
      },
    });
    expect(backdropEl()?.querySelector("[data-testid=custom-bg]")?.textContent).toBe("a1");
    expect(backdropEl()?.querySelector("[data-story-backdrop-image]")).toBeNull();
    expect(seen[0]!.isReady).toBe(false);
    fireEvent.load(stageImg()!);
    const last = seen[seen.length - 1]!;
    expect(last.isReady).toBe(true);
    expect(last.src).toBe(stageImg()!.currentSrc || stageImg()!.src);
  });

  it("closed viewer: no backdrop layer", () => {
    mount([story("A", [img("a1")])], { backdrop: "ambient", isOpen: false });
    expect(backdropEl()).toBeNull();
  });
});

// ─── Browser finding F-1 (pre-existing since 0.4): a paused video never restarted ─────────────
describe("video resumes after a pause", () => {
  const pauseButton = () =>
    document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Pause"]');
  const playButton = () =>
    document.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Play"]');

  it("Pause then Play restarts the video element", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    mount([story("A", [vid("v1"), img("a2")])]);
    fireEvent.play(stageVideo()!);
    const before = play.mock.calls.length;
    act(() => pauseButton()!.click());
    expect(play.mock.calls.length).toBe(before);
    act(() => playButton()!.click());
    expect(play.mock.calls.length).toBe(before + 1);
  });

  it("a paused move onto a video plays it once the move clears the pause", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const { ref } = mount([story("A", [img("a1"), vid("v2")])]);
    fireEvent.load(stageImg()!);
    act(() => pauseButton()!.click());
    act(() => ref.current!.goToItem(1));
    expect(stageVideo()).not.toBeNull();
    expect(pauseButton()).not.toBeNull(); // the move cleared the user pause
    expect(play).toHaveBeenCalled();
  });
});
