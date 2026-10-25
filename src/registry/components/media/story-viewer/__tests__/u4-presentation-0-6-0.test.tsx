/**
 * story-viewer 0.6.0 - U4 presentation fixes (adversarial-review slice Y).
 *
 *  1 failed <img> is never "ready"     2 reaction picker outside press only dismisses
 *  3 owner chip time fallback          4 logical (RTL-safe) chip edge
 *  5 reduced-motion story fade         6 SrNav independent of tap zones
 *  7 picker closes on cursor change    8 ghost face badge
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import { ItemView } from "../parts/item-view";
import type { ResolvedStoryViewer01Labels, Story, StoryItem, StoryViewerHandle } from "../types";

const item = (id: string, extra: Partial<StoryItem> = {}): StoryItem => ({
  id,
  type: "image",
  src: `${id}.jpg`,
  ...extra,
});
const story = (id: string, itemIds: string[], extra: Partial<Story> = {}): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items: itemIds.map((i) => item(i)),
  createdAt: "2026-01-01T00:00:00Z",
  ...extra,
});

const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
const realMatchMedia = window.matchMedia;
const originalRO = globalThis.ResizeObserver;
beforeEach(() => {
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => true,
  });
  class StubResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver;
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.setPointerCapture = () => {};
  proto.releasePointerCapture = () => {};
  proto.hasPointerCapture = () => false;
  proto.scrollIntoView = () => {};
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.matchMedia = realMatchMedia;
  globalThis.ResizeObserver = originalRO;
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  }
});

function reduceMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const flush = () => act(async () => {});
const zones = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("[data-story-tapzone]"));
const pointer = (type: string, target: Element) =>
  fireEvent(
    target,
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      clientX: 300,
      clientY: 100,
    }),
  );

describe("1 - a failed image is never marked ready by a re-render", () => {
  const labels = {
    itemImageAlt: () => "alt",
  } as unknown as ResolvedStoryViewer01Labels;
  const s = story("A", ["a1"]);
  const props = (extra: Record<string, unknown> = {}) => ({
    item: s.items[0],
    story: s,
    totalItems: 1,
    cursor: { storyIndex: 0, itemIndex: 0 },
    isPaused: false,
    isMuted: false,
    src: "a1.jpg",
    onLoadedMetadata: () => {},
    onEnded: () => {},
    labels,
    ...extra,
  });

  it("complete=true + naturalWidth=0 after an error does not call onReady on re-render", () => {
    // The image is still loading at mount, then fails: `complete` flips to true, no size.
    let complete = false;
    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      configurable: true,
      get: () => complete,
    });
    const onReady = vi.fn();
    const onImageError = vi.fn(); // the host is slow to give a new URL: the failure stays pending
    const { rerender } = render(<ItemView {...props({ onReady, onImageError })} />);
    expect(onReady).not.toHaveBeenCalled();
    complete = true;
    fireEvent.error(document.querySelector("img")!);
    expect(onImageError).toHaveBeenCalledTimes(1);
    rerender(<ItemView {...props({ onReady, onImageError })} />);
    rerender(<ItemView {...props({ onReady, onImageError })} />);
    expect(onReady).not.toHaveBeenCalled();
  });

  it("a cached image (complete, with a size) reports ready exactly once across re-renders", () => {
    Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
      configurable: true,
      get: () => 640,
    });
    try {
      const onReady = vi.fn();
      const { rerender } = render(<ItemView {...props({ onReady })} />);
      rerender(<ItemView {...props({ onReady })} />);
      rerender(<ItemView {...props({ onReady })} />);
      expect(onReady).toHaveBeenCalledTimes(1);
    } finally {
      // jsdom defines naturalWidth on the prototype itself; drop the override.
      delete (HTMLImageElement.prototype as unknown as Record<string, unknown>).naturalWidth;
      Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
        configurable: true,
        get: () => 0,
      });
    }
  });
});

describe("2 - the open reaction picker: an outside press only dismisses", () => {
  const kinds = [{ key: "love", icon: "L", label: "Love" }];
  it("pressing the next tap zone closes the picker and does not advance", async () => {
    const ref = createRef<StoryViewerHandle>();
    render(
      <StoryViewer
        ref={ref}
        stories={[story("s1", ["i1", "i2"])]}
        isOpen
        initialStoryIndex={0}
        onClose={() => {}}
        disableStoryTransition
        viewerMode="viewer"
        currentUser={{ id: "me", name: "Me" }}
        reactionKinds={kinds}
      />,
    );
    fireEvent.click(document.querySelector('[aria-label="Show reactions"]')!);
    fireEvent.click(screen.getByRole("button", { name: "React" }));
    await flush();
    expect(screen.getByRole("group", { name: "Pick a reaction" })).toBeInTheDocument();
    const next = zones()[2];
    pointer("pointerdown", next);
    pointer("pointerup", next);
    fireEvent.click(next);
    await flush();
    expect(screen.queryByRole("group", { name: "Pick a reaction" })).toBeNull();
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 0, itemIndex: 0 });
    // The next press is a normal one again.
    fireEvent.click(zones()[2]);
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 0, itemIndex: 1 });
  });
});

describe("3/4 - owner chip", () => {
  const mountOwner = (extra: Record<string, unknown> = {}) =>
    render(
      <StoryViewer
        stories={[
          {
            ...story("s1", []),
            items: [item("i1", { createdAt: "2026-02-02T00:00:00Z", viewerCount: 5 })],
          },
        ]}
        isOpen
        initialStoryIndex={0}
        onClose={() => {}}
        disableStoryTransition
        viewerMode="owner"
        onLoadViewers={async () => ({ items: [], nextCursor: null })}
        labels={{ formatTime: (d: Date) => `T-${d.toISOString().slice(0, 10)}` }}
        {...extra}
      />,
    );
  const chip = () => document.querySelector<HTMLButtonElement>('button[aria-expanded]')!;

  it("the chip time and its aria-label use item.createdAt over story.createdAt", () => {
    mountOwner();
    expect(chip().textContent).toContain("T-2026-02-02");
    expect(chip().getAttribute("aria-label")).toContain("T-2026-02-02");
    expect(chip().getAttribute("aria-label")).not.toContain("T-2026-01-01");
  });

  it("the chip bar spans with inset-x-0, not physical left/right", () => {
    mountOwner();
    const bar = chip().parentElement!;
    expect(bar.className).toContain("inset-x-0");
    expect(bar.className).not.toMatch(/\b(left|right)-0\b/);
  });
});

describe("5 - reduced motion: a story change fades, an item change does not", () => {
  const three = () => [story("A", ["a1", "a2"]), story("B", ["b1", "b2"]), story("C", ["c1"])];
  const stage = () => document.querySelector<HTMLElement>("[data-story-stage]")!;

  it("a story change renders the keyed fade wrapper; an item change keeps it (no re-key)", () => {
    reduceMotion(true);
    const ref = createRef<StoryViewerHandle>();
    render(
      <StoryViewer ref={ref} stories={three()} isOpen initialStoryIndex={0} onClose={() => {}} />,
    );
    // Opening is not a story change: no fade.
    expect(stage().className).not.toContain("fade-in-0");
    const first = stage();
    act(() => ref.current!.goToItem(1));
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 0, itemIndex: 1 });
    expect(stage()).toBe(first);
    expect(stage().className).not.toContain("fade-in-0");

    act(() => ref.current!.goToStory(1));
    const afterStory = stage();
    expect(afterStory.className).toContain("animate-in");
    expect(afterStory.className).toContain("fade-in-0");
    expect(afterStory.className).toContain("duration-200");
    expect(afterStory).not.toBe(first);
    // No second media element: the cube / neighbour is not mounted.
    expect(document.querySelectorAll("img").length).toBe(1);
    expect(document.querySelector(".transform-3d")).toBeNull();

    // An item change inside the new story keeps the same element (hard cut).
    act(() => ref.current!.goToItem(1));
    expect(stage()).toBe(afterStory);
  });

  it("disableStoryTransition stays a hard cut even under reduced motion", () => {
    reduceMotion(true);
    const ref = createRef<StoryViewerHandle>();
    render(
      <StoryViewer
        ref={ref}
        stories={three()}
        isOpen
        initialStoryIndex={0}
        onClose={() => {}}
        disableStoryTransition
      />,
    );
    act(() => ref.current!.goToStory(1));
    expect(stage().className).not.toContain("fade-in-0");
  });

  it("without reduced motion there is no fade wrapper class", () => {
    reduceMotion(false);
    const ref = createRef<StoryViewerHandle>();
    render(
      <StoryViewer ref={ref} stories={three()} isOpen initialStoryIndex={0} onClose={() => {}} />,
    );
    act(() => ref.current!.goToStory(1));
    expect(stage().className).not.toContain("fade-in-0");
  });
});

describe("6 - disableTapZones keeps the assistive item buttons", () => {
  it("SrNav (prev / next buttons + position announcement) mounts without tap zones", () => {
    const ref = createRef<StoryViewerHandle>();
    render(
      <StoryViewer
        ref={ref}
        stories={[story("A", ["a1", "a2"])]}
        isOpen
        initialStoryIndex={0}
        onClose={() => {}}
        disableStoryTransition
        disableTapZones
      />,
    );
    expect(zones().length).toBe(0);
    const next = document.querySelector<HTMLButtonElement>("[data-story-sr-nav-next]")!;
    expect(next).not.toBeNull();
    expect(document.querySelector("[data-story-position]")).not.toBeNull();
    fireEvent.click(next);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
  });
});

describe("7 - the reaction picker closes on a cursor change", () => {
  it("goToItem while the picker is up closes it", async () => {
    const ref = createRef<StoryViewerHandle>();
    render(
      <StoryViewer
        ref={ref}
        stories={[story("s1", ["i1", "i2"])]}
        isOpen
        initialStoryIndex={0}
        onClose={() => {}}
        disableStoryTransition
        viewerMode="viewer"
        currentUser={{ id: "me", name: "Me" }}
        reactionKinds={[{ key: "love", icon: "L", label: "Love" }]}
      />,
    );
    fireEvent.click(document.querySelector('[aria-label="Show reactions"]')!);
    fireEvent.click(screen.getByRole("button", { name: "React" }));
    await flush();
    expect(screen.getByRole("group", { name: "Pick a reaction" })).toBeInTheDocument();
    act(() => ref.current!.goToItem(1));
    await flush();
    expect(ref.current!.getCursor().itemIndex).toBe(1);
    expect(screen.queryByRole("group", { name: "Pick a reaction" })).toBeNull();
  });
});

describe("8 - the cube ghost header carries renderHeaderBadge", () => {
  it("the leaving face's header renders the badge too (no pop-in on landing)", () => {
    vi.useFakeTimers();
    reduceMotion(false);
    const ref = createRef<StoryViewerHandle>();
    render(
      <StoryViewer
        ref={ref}
        stories={[story("A", ["a1"]), story("B", ["b1"])]}
        isOpen
        initialStoryIndex={0}
        onClose={() => {}}
        renderHeaderBadge={(s: Story) => <span data-testid="badge">badge-{s.id}</span>}
      />,
    );
    act(() => ref.current!.goToStory(1));
    expect(document.querySelector(".transform-3d")).not.toBeNull();
    const ghost = document.querySelector('[aria-hidden="true"].backface-hidden')!;
    expect(ghost.textContent).toContain("badge-A");
  });
});
