/**
 * story-viewer 0.7.0 - slice N (navigation / chrome).
 *
 *  A1   initialItemIndex: the cursor is right on the first render of an open (also on reopen)
 *  A2   onItemViewed info.direction, handle + close + end-of-run events, exactly once per visit
 *  A3   onItemReady
 *  A4   returnFocusTo
 *  A5   storySwipe (hard-cut swipe with the cube off; no swipe with the cube on)
 *  A6   extraKebabActions + `hidden`
 *  A7   --story-viewer-progress-height
 *  A8   removal notice vs other pause reasons (no wall-clock leak)
 *  A9   no Play/Pause for a stay-until-closed notice
 *  A10  link opener accessible name contains its visible text
 *  A11  sheet focus return (Escape and the close button)
 *
 * jsdom note: A5 (pointer sequences, no layout: widths are 0), A4 / A11 (no real focus fix-up after
 * `inert`) and A7 (class string only, no CSS) only approximate the browser; the browser pass
 * replays them.
 */
import { createRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import type { Story, StoryItem, StoryViewerHandle } from "../types";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";

const img = (id: string, extra: Partial<StoryItem> = {}): StoryItem => ({
  id,
  type: "image",
  src: `${id}.jpg`,
  ...extra,
});
const lazy = (id: string): StoryItem => ({ id, type: "image" });
const story = (id: string, items: StoryItem[]): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items,
  createdAt: "2026-01-01T00:00:00Z",
});
const A3 = story("A", [img("a1"), img("a2"), img("a3")]);
const B3 = story("B", [img("b1"), img("b2"), img("b3")]);

const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(HTMLImageElement.prototype, "complete", { configurable: true, get: () => true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.body.removeAttribute("dir");
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  }
});

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};
const pointer = (type: string, target: Element | Window, init: Record<string, unknown> = {}) =>
  fireEvent(
    target,
    new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: "mouse", button: 0, ...init }),
  );
const root = () => document.querySelector<HTMLElement>(".touch-pan-y")!;
const zones = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("div[aria-hidden='true'].absolute.inset-0.z-10 > button"));
const notice = () => document.querySelector<HTMLElement>("[data-story-unavailable]");

type Props = Record<string, unknown>;

function mount(stories: Story[], extra: Props = {}) {
  const ref = createRef<StoryViewerHandle>();
  const onClose = vi.fn();
  const props = {
    ref,
    stories,
    isOpen: true,
    initialStoryIndex: 0,
    onClose,
    disableStoryTransition: true,
    ...extra,
  };
  const view = render(<StoryViewer {...props} />);
  return { ref, onClose, view, props };
}

/** Closes itself on `onClose` like a real host. */
function Host(props: Props & { onClose?: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <StoryViewer
      stories={[]}
      initialStoryIndex={0}
      disableStoryTransition
      {...(props as object)}
      isOpen={open}
      onClose={() => {
        props.onClose?.();
        setOpen(false);
      }}
    />
  );
}

// ─── A1 ──────────────────────────────────────────────────────────────────
describe("A1 initialItemIndex", () => {
  it("opens on that item; resolveMedia never sees the story's other leading items", async () => {
    const resolveMedia = vi.fn(async (item: StoryItem) => ({ src: `${item.id}.r.jpg` }));
    const { ref } = mount(
      [story("A", [lazy("a1"), lazy("a2")]), story("B", [lazy("b1"), lazy("b2"), lazy("b3")])],
      { resolveMedia, initialStoryIndex: 1, initialItemIndex: 2 },
    );
    await flush();
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 1, itemIndex: 2 });
    const ids = resolveMedia.mock.calls.map((c) => c[0].id);
    expect(ids).toContain("b3");
    expect(ids).not.toContain("b1");
    expect(ids).not.toContain("b2");
    expect(ids).not.toContain("a1");
  });

  it("clamps an out-of-range index (high and negative)", () => {
    const hi = mount([A3], { initialItemIndex: 99 });
    expect(hi.ref.current!.getCursor().itemIndex).toBe(2);
    cleanup();
    const lo = mount([A3], { initialItemIndex: -4 });
    expect(lo.ref.current!.getCursor().itemIndex).toBe(0);
  });

  it("a reopen renders the new cursor first (no render of the previous cursor)", () => {
    const seen: string[] = [];
    const renderItem = (item: StoryItem) => {
      seen.push(item.id);
      return <div data-frame={item.id} />;
    };
    const { view, props } = mount([A3, B3], { renderItem, initialStoryIndex: 1, initialItemIndex: 2 });
    expect(seen[0]).toBe("b3");
    view.rerender(<StoryViewer {...props} isOpen={false} />);
    tick(500);
    seen.length = 0;
    view.rerender(<StoryViewer {...props} isOpen initialStoryIndex={0} initialItemIndex={0} />);
    expect(seen[0]).toBe("a1");
    expect(seen).not.toContain("b3");
  });

  it("opened before the data arrives: the seed lands with the first stories", () => {
    const onStoriesChange = vi.fn();
    const { ref, view, props } = mount([], { onStoriesChange, initialStoryIndex: 1, initialItemIndex: 2 });
    view.rerender(<StoryViewer {...props} stories={[A3, B3]} />);
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 1, itemIndex: 2 });
  });
});

// ─── A2 ──────────────────────────────────────────────────────────────────
describe("A2 onItemViewed direction", () => {
  const dir = (call: unknown[]) => (call[4] as { direction: string }).direction;

  it("a back tap leaves the item 'left' / 'backward'", () => {
    const onItemViewed = vi.fn();
    const { ref } = mount([A3], { onItemViewed });
    act(() => ref.current!.goToItem(1));
    onItemViewed.mockClear();
    fireEvent.click(zones()[0]);
    expect(onItemViewed).toHaveBeenCalledTimes(1);
    expect(onItemViewed).toHaveBeenCalledWith("A", "a2", 1, "left", { direction: "backward" });
  });

  it("goToItem fires by index; the same index fires nothing", () => {
    const onItemViewed = vi.fn();
    const { ref } = mount([A3], { onItemViewed });
    act(() => ref.current!.goToItem(2));
    expect(onItemViewed).toHaveBeenLastCalledWith("A", "a1", 0, "left", { direction: "forward" });
    act(() => ref.current!.goToItem(2));
    expect(onItemViewed).toHaveBeenCalledTimes(1);
    act(() => ref.current!.goToItem(0));
    expect(onItemViewed).toHaveBeenLastCalledWith("A", "a3", 2, "left", { direction: "backward" });
    expect(onItemViewed).toHaveBeenCalledTimes(2);
  });

  it("goToStory fires by story index (backward too)", () => {
    const onItemViewed = vi.fn();
    const { ref } = mount([A3, B3], { onItemViewed });
    act(() => ref.current!.goToStory(1));
    expect(dir(onItemViewed.mock.calls.at(-1)!)).toBe("forward");
    act(() => ref.current!.goToStory(0));
    expect(onItemViewed).toHaveBeenLastCalledWith("B", "b1", 0, "left", { direction: "backward" });
  });

  it("a backward move to the previous author is 'backward'", () => {
    const onItemViewed = vi.fn();
    const { ref } = mount([A3, B3], { onItemViewed, initialStoryIndex: 1 });
    fireEvent.click(zones()[0]);
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 0, itemIndex: 2 });
    expect(onItemViewed).toHaveBeenCalledWith("B", "b1", 0, "left", { direction: "backward" });
  });

  it("closing the viewer on an item fires left / close once (X button)", () => {
    const onItemViewed = vi.fn();
    render(<Host stories={[A3]} onItemViewed={onItemViewed} />);
    tick(300);
    fireEvent.click(screen.getByLabelText("Close"));
    tick(500);
    expect(onItemViewed).toHaveBeenCalledTimes(1);
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "left", { direction: "close" });
  });

  it("Escape and isOpen=false close the same way", () => {
    const onItemViewed = vi.fn();
    render(<Host stories={[A3]} onItemViewed={onItemViewed} />);
    tick(300);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "left", { direction: "close" });
    cleanup();
    onItemViewed.mockClear();
    const { view, props } = mount([A3], { onItemViewed });
    view.rerender(<StoryViewer {...props} isOpen={false} />);
    expect(onItemViewed).toHaveBeenCalledTimes(1);
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "left", { direction: "close" });
  });

  it("play-through of the last item: completed/forward, then onAutoCloseAtEnd(sid, iid), then onClose; nothing more on close", () => {
    const order: string[] = [];
    render(
      <Host
        stories={[story("A", [img("a1")])]}
        onItemViewed={(s: string, i: string, _n: number, cause: string, info: { direction: string }) =>
          order.push(`viewed:${s}:${i}:${cause}:${info.direction}`)
        }
        onAutoCloseAtEnd={(s: string, i: string) => order.push(`auto:${s}:${i}`)}
        onClose={() => order.push("close")}
      />,
    );
    tick(5200);
    tick(500);
    expect(order).toEqual(["viewed:A:a1:completed:forward", "auto:A:a1", "close"]);
  });

  it("a forward tap on the last item of the last author: left/forward, then the same end", () => {
    const order: string[] = [];
    render(
      <Host
        stories={[story("A", [img("a1")])]}
        onItemViewed={(s: string, i: string, _n: number, cause: string, info: { direction: string }) =>
          order.push(`viewed:${s}:${i}:${cause}:${info.direction}`)
        }
        onAutoCloseAtEnd={(s: string, i: string) => order.push(`auto:${s}:${i}`)}
        onClose={() => order.push("close")}
      />,
    );
    tick(300);
    fireEvent.click(zones()[2]);
    tick(500);
    expect(order).toEqual(["viewed:A:a1:left:forward", "auto:A:a1", "close"]);
  });

  it("disableAutoClose: the last item still reports once; the viewer stays open", () => {
    const onItemViewed = vi.fn();
    const onAutoCloseAtEnd = vi.fn();
    const { onClose } = mount([story("A", [img("a1")])], { onItemViewed, onAutoCloseAtEnd, disableAutoClose: true });
    tick(5200);
    expect(onItemViewed).toHaveBeenCalledTimes(1);
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "completed", { direction: "forward" });
    expect(onAutoCloseAtEnd).toHaveBeenCalledWith("A", "a1");
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ─── A3 ──────────────────────────────────────────────────────────────────
describe("A3 onItemReady", () => {
  it("not while paused; once on the clear; again on a revisit", () => {
    const onItemReady = vi.fn();
    const { view, props, ref } = mount([A3], { onItemReady, pauseReasons: ["host"] });
    tick(1000);
    expect(onItemReady).not.toHaveBeenCalled();
    view.rerender(<StoryViewer {...props} pauseReasons={[]} />);
    expect(onItemReady).toHaveBeenCalledTimes(1);
    expect(onItemReady).toHaveBeenCalledWith("A", "a1");
    tick(1000);
    expect(onItemReady).toHaveBeenCalledTimes(1);
    act(() => ref.current!.goToItem(1));
    expect(onItemReady).toHaveBeenLastCalledWith("A", "a2");
    act(() => ref.current!.goToItem(0));
    expect(onItemReady).toHaveBeenLastCalledWith("A", "a1");
    expect(onItemReady).toHaveBeenCalledTimes(3);
  });

  it("again when the viewer is closed and reopened on the same item", () => {
    const onItemReady = vi.fn();
    const { view, props } = mount([A3], { onItemReady });
    expect(onItemReady).toHaveBeenCalledTimes(1);
    view.rerender(<StoryViewer {...props} isOpen={false} />);
    tick(500);
    view.rerender(<StoryViewer {...props} isOpen />);
    expect(onItemReady).toHaveBeenCalledTimes(2);
    expect(onItemReady).toHaveBeenLastCalledWith("A", "a1");
  });

  it("never for an unavailable item", async () => {
    const onItemReady = vi.fn();
    mount([story("A", [lazy("a1"), img("a2")])], {
      onItemReady,
      resolveMedia: async (item: StoryItem) => (item.id === "a1" ? null : { src: `${item.id}.jpg` }),
    });
    await flush();
    expect(notice()).not.toBeNull();
    tick(1000);
    expect(onItemReady).not.toHaveBeenCalled();
    tick(800); // the notice ends, a2 plays
    expect(onItemReady).toHaveBeenCalledTimes(1);
    expect(onItemReady).toHaveBeenCalledWith("A", "a2");
  });

  it("never for a removal notice frame", () => {
    const onItemReady = vi.fn();
    const { view, props } = mount([story("A", [img("a1"), img("a2")])], { onItemReady, onStoriesChange: () => {} });
    expect(onItemReady).toHaveBeenCalledTimes(1);
    view.rerender(<StoryViewer {...props} stories={[story("A", [img("a2")])]} />);
    expect(notice()).not.toBeNull();
    tick(1000);
    expect(onItemReady).toHaveBeenCalledTimes(1);
    tick(1000);
    expect(onItemReady).toHaveBeenLastCalledWith("A", "a2");
  });
});

// ─── A4 ──────────────────────────────────────────────────────────────────
describe("A4 returnFocusTo", () => {
  function openFrom(extra: Props) {
    const opener = document.createElement("button");
    const target = document.createElement("button");
    document.body.append(opener, target);
    opener.focus();
    const m = mount([A3], extra.make ? (extra.make as (t: HTMLElement) => Props)(target) : extra);
    tick(200);
    m.view.rerender(<StoryViewer {...m.props} isOpen={false} />);
    tick(1500);
    const done = () => {
      opener.remove();
      target.remove();
    };
    return { opener, target, done };
  }

  it("an element wins over the opener", () => {
    const { target, done } = openFrom({ make: (t: HTMLElement) => ({ returnFocusTo: t }) });
    expect(document.activeElement).toBe(target);
    done();
  });

  it("a function is read at close time; null falls back to the opener", () => {
    const fn = vi.fn(() => null);
    const { opener, done } = openFrom({ returnFocusTo: fn });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
    done();
    cleanup();
    const second = openFrom({ make: (t: HTMLElement) => ({ returnFocusTo: () => t }) });
    expect(document.activeElement).toBe(second.target);
    second.done();
  });

  it("false: the viewer moves no focus", () => {
    const { opener, target, done } = openFrom({ returnFocusTo: false });
    expect(document.activeElement).not.toBe(opener);
    expect(document.activeElement).not.toBe(target);
    done();
  });
});

// ─── A5 ──────────────────────────────────────────────────────────────────
describe("A5 storySwipe", () => {
  const swipeLeft = (from: Element = zones()[1]) => {
    pointer("pointerdown", from, { clientX: 300, clientY: 100 });
    pointer("pointermove", from, { clientX: 100, clientY: 100 });
    return () => {
      pointer("pointerup", root(), { clientX: 100, clientY: 100 });
      tick(600);
    };
  };
  const swipeRight = () => {
    const z = zones()[1];
    pointer("pointerdown", z, { clientX: 100, clientY: 100 });
    pointer("pointermove", z, { clientX: 300, clientY: 100 });
    pointer("pointerup", root(), { clientX: 300, clientY: 100 });
    tick(600);
  };
  const ghosts = () => document.querySelectorAll("div.backface-hidden.pointer-events-none[inert]");

  it("disableStoryTransition alone: no swipe (0.6 behaviour)", () => {
    const { ref } = mount([A3, B3]);
    swipeLeft()();
    expect(ref.current!.getCursor().storyIndex).toBe(0);
  });

  it("disableStoryTransition + storySwipe: a hard cut, no ghost faces, no neighbour media", () => {
    const { ref } = mount([A3, B3], { storySwipe: true });
    const release = swipeLeft();
    expect(ghosts()).toHaveLength(0);
    expect(Array.from(document.querySelectorAll("img")).map((i) => i.getAttribute("src"))).toEqual(["a1.jpg"]);
    release();
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 1, itemIndex: 0 });
    swipeRight();
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 0, itemIndex: 0 });
  });

  it("is mirrored in RTL", () => {
    document.body.setAttribute("dir", "rtl");
    const { ref } = mount([A3, B3], { storySwipe: true, initialStoryIndex: 1 });
    swipeLeft()();
    expect(ref.current!.getCursor().storyIndex).toBe(0);
  });

  it("a swipe that starts on a control is ignored", () => {
    const { ref } = mount([A3, B3], { storySwipe: true });
    swipeLeft(screen.getByLabelText("Close"))();
    expect(ref.current!.getCursor().storyIndex).toBe(0);
  });

  it("a long press still pauses and a window release ends it (0.6.2 R6)", () => {
    mount([A3, B3], { storySwipe: true });
    pointer("pointerdown", zones()[1], { clientX: 200, clientY: 100 });
    tick(300);
    expect(document.querySelector('[aria-label="Play"]')).not.toBeNull();
    act(() => void pointer("pointerup", window));
    expect(document.querySelector('[aria-label="Play"]')).toBeNull();
  });

  it("the cube on + storySwipe={false}: no drag gesture, arrows still use the cube", () => {
    const { ref } = mount([A3, B3], { disableStoryTransition: false, storySwipe: false });
    const release = swipeLeft();
    expect(root().className).not.toContain("perspective-distant");
    release();
    expect(ref.current!.getCursor().storyIndex).toBe(0);
    fireEvent.click(screen.getByLabelText("Next story"));
    expect(ref.current!.getCursor().storyIndex).toBe(1);
    expect(root().className).toContain("perspective-distant");
  });

  it("the cube on, default: the swipe still works", () => {
    const { ref } = mount([A3, B3], { disableStoryTransition: false });
    swipeLeft()();
    expect(ref.current!.getCursor().storyIndex).toBe(1);
  });
});

// ─── A6 ──────────────────────────────────────────────────────────────────
describe("A6 extraKebabActions", () => {
  const items = () =>
    Array.from(document.querySelectorAll('[role="menuitem"]')).map((e) => e.textContent?.trim());
  const open = () => fireEvent.click(screen.getByLabelText("Story actions"));

  it("shows the kebab with only extras (no viewerMode); hidden items are left out", () => {
    mount([A3], {
      extraKebabActions: () => [
        { label: "Download", onClick: () => {} },
        { label: "Secret", hidden: true },
      ],
    });
    open();
    expect(items()).toEqual(["Download"]);
  });

  it("the kebab button reports its menu (browser finding F-5)", () => {
    mount([A3], { extraKebabActions: () => [{ label: "Download", onClick: () => {} }] });
    const trigger = screen.getByLabelText("Story actions");
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    open();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("no visible item -> no kebab", () => {
    mount([A3], { extraKebabActions: () => [{ label: "Nope", hidden: true }] });
    expect(screen.queryByLabelText("Story actions")).toBeNull();
  });

  it("extras follow the defaults and the moderator section; hidden defaults/moderator items drop out", () => {
    mount([A3], {
      viewerMode: "viewer",
      currentUser: { id: "me", name: "Me" },
      onCopyLink: () => {},
      onReport: () => {},
      permissions: { canModerate: true },
      moderatorActions: () => [
        { label: "Mod hidden", hidden: true },
        { label: "Mod one" },
        { label: "Mod two" },
      ],
      extraKebabActions: () => [{ label: "Download" }],
    });
    open();
    const got = items();
    expect(got.at(-1)).toBe("Download");
    expect(got).toContain("Mod one");
    expect(got).not.toContain("Mod hidden");
    expect(got.indexOf("Mod one")).toBeLessThan(got.indexOf("Download"));
    // the first VISIBLE moderator item carries the divider
    expect(document.querySelectorAll('[role="separator"]')).toHaveLength(1);
  });

  it("the kebabActions takeover ignores extras and filters hidden", () => {
    mount([A3], {
      kebabActions: () => [{ label: "Mine" }, { label: "Gone", hidden: true }],
      extraKebabActions: () => [{ label: "Download" }],
    });
    open();
    expect(items()).toEqual(["Mine"]);
  });

  it("openKebab opens it", () => {
    const { ref } = mount([A3], { extraKebabActions: () => [{ label: "Download" }] });
    act(() => ref.current!.openKebab());
    expect(items()).toEqual(["Download"]);
  });
});

// ─── A7 ──────────────────────────────────────────────────────────────────
describe("A7 progress height variable", () => {
  it("the default bars read --story-viewer-progress-height (2px fallback)", () => {
    mount([A3]);
    const bar = document.querySelector("[data-story-progress] > div")!;
    expect(bar.className).toContain("h-[var(--story-viewer-progress-height,2px)]");
    expect(bar.className).not.toContain("h-0.5");
  });
});

// ─── A8 ──────────────────────────────────────────────────────────────────
describe("A8 removal notice after a paused media notice", () => {
  it("runs its full remaining time from when nothing else holds", async () => {
    const { view, props, ref } = mount([story("A", [lazy("a1"), img("a2")])], {
      onStoriesChange: () => {},
      unavailableNoticeMs: 1500,
      resolveMedia: async (item: StoryItem) => (item.id === "a1" ? null : { src: `${item.id}.jpg` }),
    });
    await flush();
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("resolve");
    tick(400); // 400 ms of the media notice ran
    act(() => ref.current!.setPaused(true)); // a host pause holds the viewer
    tick(5000); // a long hold: no notice time passes
    view.rerender(<StoryViewer {...props} stories={[story("A", [img("a2")])]} />);
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("removed");
    act(() => ref.current!.setPaused(false));
    tick(500);
    expect(notice()).not.toBeNull(); // 1100 ms are left, not 0
    tick(700);
    expect(notice()).toBeNull();
  });
});

// ─── A9 ──────────────────────────────────────────────────────────────────
describe("A9 stay-until-closed notice", () => {
  const standalone = () =>
    mount([story("A", [lazy("a1")])], {
      standalone: true,
      resolveMedia: async () => null,
    });

  it("offers no Play/Pause; its own Close stays", async () => {
    standalone();
    await flush();
    expect(notice()).not.toBeNull();
    expect(document.querySelector('[aria-label="Play"], [aria-label="Pause"]')).toBeNull();
    expect(notice()!.querySelector("button")).not.toBeNull();
  });

  it("a normal notice still offers Play (0.6.2 R7)", async () => {
    mount([story("A", [lazy("a1"), img("a2")])], { resolveMedia: async (i: StoryItem) => (i.id === "a1" ? null : { src: "x.jpg" }) });
    await flush();
    expect(document.querySelector('[aria-label="Play"]')).not.toBeNull();
  });

  it("middle tap and Space add no user pause, even with another reason holding", async () => {
    const onPauseReasonsChange = vi.fn();
    const { ref } = mount([story("A", [lazy("a1")])], {
      standalone: true,
      resolveMedia: async () => null,
      onPauseReasonsChange,
    });
    await flush();
    act(() => ref.current!.setPaused(true));
    onPauseReasonsChange.mockClear();
    fireEvent.click(zones()[1]);
    fireEvent.keyDown(document.body, { key: " " });
    // no toggle at all: the reason list never changes
    expect(onPauseReasonsChange).not.toHaveBeenCalled();
  });
});

// ─── A10 ─────────────────────────────────────────────────────────────────
describe("A10 link opener name", () => {
  const linked = [story("A", [img("a1", { link: { url: "https://shop.example.com/x", cta: "Shop now" } })])];

  it("the opener's accessible name contains its visible text", () => {
    mount(linked);
    const chip = document.querySelector<HTMLElement>('[data-story-layer="link"] button[aria-expanded]')!;
    expect(chip.hasAttribute("aria-label")).toBe(false);
    expect(screen.getByRole("button", { name: /shop\.example\.com/ })).toBe(chip);
    expect(chip.textContent).toContain("Shop now");
  });

  it("axe is clean with the drawer closed", async () => {
    mount(linked);
    vi.useRealTimers();
    await expectNoAxeViolations(document.querySelector("[role='dialog']")!);
  });
});

// ─── A11 ─────────────────────────────────────────────────────────────────
describe("A11 sheet focus return", () => {
  const viewer = { viewerMode: "viewer" as const, currentUser: { id: "me", name: "Me" } };
  const engagementButtons = () =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-slot="button"][data-size="sm"]'));
  const escape = () => fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
  /** `focused: false` = a browser that does not focus a clicked button (Safari / macOS Firefox). */
  const openComments = (focused: boolean) => {
    tick(300); // let the viewer settle its own open-focus first
    fireEvent.click(document.querySelector('[aria-label="Show reactions"]')!);
    const opener = engagementButtons()[1];
    if (focused) act(() => opener.focus());
    else pointer("pointerdown", opener);
    fireEvent.click(opener);
    return opener;
  };
  const sheetOpen = () =>
    document.querySelector('[role="dialog"][aria-label="Comments"]')!.getAttribute("aria-hidden") !== "true";

  for (const focused of [true, false]) {
    it(`Escape returns focus to the comment button (button ${focused ? "focused" : "not focused"} by the press)`, () => {
      mount([A3], viewer);
      const opener = openComments(focused);
      expect(sheetOpen()).toBe(true);
      escape();
      tick(100);
      expect(sheetOpen()).toBe(false);
      expect(document.activeElement).toBe(opener);
    });
    it(`the close button returns focus to the comment button (button ${focused ? "focused" : "not focused"} by the press)`, () => {
      mount([A3], viewer);
      const opener = openComments(focused);
      const close = document.querySelector<HTMLElement>('[role="dialog"][aria-label="Comments"] [aria-label="Close comments"]')!;
      act(() => close.focus());
      fireEvent.click(close);
      tick(100);
      expect(document.activeElement).toBe(opener);
    });
  }

  // Browser finding F-2: a real mouse press on the close button (pointerdown first) collapsed the
  // reactions rail, so the comment button was `inert` and focus fell to the page.
  it("a mouse press on the sheet's close button keeps the rail open and returns focus", () => {
    mount([A3], viewer);
    const opener = openComments(true);
    const close = document.querySelector<HTMLElement>('[role="dialog"][aria-label="Comments"] [aria-label="Close comments"]')!;
    pointer("pointerdown", close);
    act(() => close.focus());
    pointer("pointerup", close);
    fireEvent.click(close);
    tick(100);
    expect(document.querySelector('[aria-label="Hide reactions"]')).not.toBeNull();
    expect(opener.closest("[inert]")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});
