/**
 * story-viewer 0.6.0 — slice A: state & data.
 *
 *  SV16  controlled `stories` + `onStoriesChange`, cursor anchored to ids
 *  RM    removal repair through every path + the removal notice (`pendingRemoval`)
 *  OV    `onItemViewed(…, cause)`
 *  MU    muted groups (both directions, swipe preview, direct open)
 *  SV4   pause reasons (built-ins, controlled `pauseReasons`)
 */
import { createRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import { DEFAULT_STORY_VIEWER_LABELS, type Story, type StoryViewerHandle } from "../types";

const item = (id: string) => ({ id, type: "image" as const, src: `${id}.jpg` });
const story = (id: string, itemIds: string[], extra: Partial<Story> = {}): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items: itemIds.map(item),
  createdAt: "2026-01-01T00:00:00Z",
  ...extra,
});

// jsdom never loads images; the 0.5.4 ready gate needs `complete`.
const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => true,
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  }
});

type Props = Record<string, unknown>;

function mount(stories: Story[], extra: Props = {}) {
  const ref = createRef<StoryViewerHandle>();
  const onClose = vi.fn();
  const utils = render(
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
  const rerenderStories = (next: Story[], more: Props = {}) =>
    utils.rerender(
      <StoryViewer
        ref={ref}
        stories={next}
        isOpen
        initialStoryIndex={0}
        onClose={onClose}
        disableStoryTransition
        {...extra}
        {...more}
      />,
    );
  return { ref, onClose, rerenderStories };
}

const shown = () =>
  Array.from(document.querySelectorAll("img")).map((i) => i.getAttribute("src") ?? "");
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const isPausedUi = () => !!document.querySelector('[aria-label="Play"]');
const maxProgress = () =>
  Math.max(
    0,
    ...screen
      .queryAllByRole("progressbar")
      .map((p) => Number(p.getAttribute("aria-valuenow"))),
  );
const marker = () => document.querySelector('[data-story-unavailable="removed"]');
const zones = () =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      "div[aria-hidden='true'].absolute.inset-0.z-10 > button",
    ),
  );
const pointer = (type: string, target: Element, init: Record<string, unknown> = {}) =>
  fireEvent(
    target,
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      ...init,
    }),
  );
const nextStoryBtn = () => screen.getByLabelText(DEFAULT_STORY_VIEWER_LABELS.nextStory);
const prevStoryBtn = () => screen.getByLabelText(DEFAULT_STORY_VIEWER_LABELS.prevStory);

const viewer = {
  viewerMode: "viewer" as const,
  currentUser: { id: "me", name: "Me" },
  onReport: () => {},
};

// ─── SV16 — controlled stories ──────────────────────────────────────────────

describe("SV16 — controlled stories", () => {
  it("reports local mutations through onStoriesChange and does not apply them", () => {
    const onStoriesChange = vi.fn();
    const base = [story("A", ["a1"]), story("B", ["b1"])];
    const { ref } = mount(base, { onStoriesChange });
    const extra = story("Z", ["z1"]);
    act(() => ref.current!.dispatch({ kind: "add-story", story: extra }));
    expect(onStoriesChange).toHaveBeenCalledTimes(1);
    const [next, change] = onStoriesChange.mock.calls[0];
    expect(next.map((s: Story) => s.id)).toEqual(["A", "B", "Z"]);
    expect(change).toMatchObject({ kind: "add-story" });
    // not applied: the prop wins
    expect(ref.current!.getCurrentStories().map((s) => s.id)).toEqual(["A", "B"]);

    act(() => ref.current!.reset([story("Q", ["q1"])]));
    expect(onStoriesChange.mock.calls[1][1]).toMatchObject({ kind: "reset" });
    expect(ref.current!.getCurrentStories().map((s) => s.id)).toEqual(["A", "B"]);
  });

  it("reports subscribe deltas the same way", () => {
    const onStoriesChange = vi.fn();
    let push: (d: unknown) => void = () => {};
    const subscribe = (h: (d: never) => void) => {
      push = h as (d: unknown) => void;
      return () => {};
    };
    mount([story("A", ["a1"])], { onStoriesChange, subscribe });
    act(() => push({ kind: "story-added", story: story("N", ["n1"]) }));
    expect(onStoriesChange).toHaveBeenCalledTimes(1);
    expect(onStoriesChange.mock.calls[0][1]).toMatchObject({
      kind: "subscribe-delta",
      delta: { kind: "story-added" },
    });
  });

  it("the prop wins on every render (a later prop replaces the list)", () => {
    const { ref, rerenderStories } = mount([story("A", ["a1"])], { onStoriesChange: vi.fn() });
    rerenderStories([story("A", ["a1"]), story("B", ["b1"])]);
    expect(ref.current!.getCurrentStories().map((s) => s.id)).toEqual(["A", "B"]);
  });

  it("uncontrolled keeps the mount-only behaviour", () => {
    const { ref, rerenderStories } = mount([story("A", ["a1"])]);
    rerenderStories([story("A", ["a1"]), story("B", ["b1"])]);
    expect(ref.current!.getCurrentStories().map((s) => s.id)).toEqual(["A"]);
  });

  it("an insert before the current group keeps the same item on screen (no cube)", () => {
    const onStoriesChange = vi.fn();
    const { ref, rerenderStories } = mount(
      [story("A", ["a1"]), story("B", ["b1"])],
      { onStoriesChange, disableStoryTransition: false },
    );
    act(() => ref.current!.goToStory(1));
    act(() => void vi.advanceTimersByTime(600));
    expect(shown()).toContain("b1.jpg");
    rerenderStories(
      [story("Z", ["z1"]), story("A", ["a1"]), story("B", ["b1"])],
      { disableStoryTransition: false },
    );
    expect(shown()).toContain("b1.jpg");
    expect(shown()).not.toContain("z1.jpg");
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 2, itemIndex: 0 });
    expect(document.querySelector(".touch-pan-y")!.className).not.toContain("perspective-distant");
  });

  it("parked case: removing an EARLIER non-current group keeps the item and plays no cube", () => {
    const onStoriesChange = vi.fn();
    const all = [story("A", ["a1"]), story("B", ["b1"]), story("C", ["c1"])];
    const { ref, rerenderStories } = mount(all, { onStoriesChange, disableStoryTransition: false });
    act(() => ref.current!.goToStory(2));
    act(() => void vi.advanceTimersByTime(600));
    expect(shown()).toContain("c1.jpg");
    rerenderStories([all[1], all[2]], { disableStoryTransition: false });
    expect(shown()).toContain("c1.jpg");
    expect(document.querySelector(".touch-pan-y")!.className).not.toContain("perspective-distant");
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 1, itemIndex: 0 });
  });

  it("the cursor follows an item-id when earlier items are added", () => {
    const { ref, rerenderStories } = mount([story("A", ["a1", "a2"])], { onStoriesChange: vi.fn() });
    act(() => ref.current!.goToItem(1));
    rerenderStories([story("A", ["a0", "a1", "a2"])]);
    expect(shown()).toContain("a2.jpg");
    expect(ref.current!.getCursor().itemIndex).toBe(2);
  });
});

// ─── Removal repair + notice ────────────────────────────────────────────────

describe("removal repair through every path", () => {
  const three = () => [story("A", ["a1", "a2"]), story("B", ["b1"])];

  it("controlled prop, notice 0: the removed item stops at once; moves to the next item", () => {
    const onItemUnavailable = vi.fn();
    const { rerenderStories } = mount(three(), {
      onStoriesChange: vi.fn(),
      unavailableNoticeMs: 0,
      onItemUnavailable,
    });
    rerenderStories([story("A", ["a2"]), story("B", ["b1"])], {
      onStoriesChange: vi.fn(),
      unavailableNoticeMs: 0,
      onItemUnavailable,
    });
    expect(shown()).toContain("a2.jpg");
    expect(shown()).not.toContain("a1.jpg");
    expect(marker()).toBeNull();
    expect(onItemUnavailable).toHaveBeenCalledTimes(1);
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "removed");
  });

  it("controlled prop, notice 0: removing the current story moves to the next story's first item", () => {
    const props = { onStoriesChange: vi.fn(), unavailableNoticeMs: 0 };
    const { rerenderStories, ref } = mount(three(), props);
    rerenderStories([story("B", ["b1"])], props);
    expect(shown()).toContain("b1.jpg");
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 0, itemIndex: 0 });
  });

  it("controlled prop: removing the last story closes the viewer", () => {
    const props = { onStoriesChange: vi.fn(), unavailableNoticeMs: 0 };
    const { rerenderStories, onClose } = mount([story("A", ["a1"])], props);
    rerenderStories([], props);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("dispatch, reset and subscribe (uncontrolled) repair the same way", () => {
    let push: (d: unknown) => void = () => {};
    const subscribe = (h: (d: never) => void) => {
      push = h as (d: unknown) => void;
      return () => {};
    };
    const props = { unavailableNoticeMs: 0, subscribe };
    const { ref } = mount(three(), props);
    act(() => ref.current!.dispatch({ kind: "remove-item", storyId: "A", itemId: "a1" }));
    expect(shown()).toContain("a2.jpg");
    act(() => push({ kind: "item-removed", storyId: "A", itemId: "a2" }));
    expect(shown()).toContain("b1.jpg");
    act(() => ref.current!.reset([story("C", ["c1"])]));
    expect(shown()).toContain("c1.jpg");
  });

  it("with the notice: the frame holds, nothing plays, then repairs after unavailableNoticeMs", () => {
    const onItemUnavailable = vi.fn();
    const props = { onStoriesChange: vi.fn(), unavailableNoticeMs: 2000, onItemUnavailable };
    const { rerenderStories, ref } = mount(three(), props);
    tick(1000);
    rerenderStories([story("A", ["a2"]), story("B", ["b1"])], props);
    expect(marker()).not.toBeNull();
    expect(shown()).toEqual([]); // no media mounted — nothing can play
    expect(isPausedUi()).toBe(true);
    expect(onItemUnavailable).toHaveBeenCalledTimes(1);
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "removed");
    const p = maxProgress();
    tick(1500);
    expect(maxProgress()).toBe(p);
    expect(marker()).not.toBeNull();
    tick(600);
    expect(marker()).toBeNull();
    expect(shown()).toContain("a2.jpg");
    expect(isPausedUi()).toBe(false);
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 0, itemIndex: 0 });
    expect(onItemUnavailable).toHaveBeenCalledTimes(1);
  });

  it("the default notice is 1500 ms", () => {
    const props = { onStoriesChange: vi.fn() };
    const { rerenderStories } = mount(three(), props);
    rerenderStories([story("A", ["a2"]), story("B", ["b1"])], props);
    tick(1400);
    expect(marker()).not.toBeNull();
    tick(200);
    expect(marker()).toBeNull();
  });

  it("the unavailable pause reason is reported while the notice shows", () => {
    const onPauseReasonsChange = vi.fn();
    const props = { onStoriesChange: vi.fn(), onPauseReasonsChange };
    const { rerenderStories } = mount(three(), props);
    rerenderStories([story("A", ["a2"]), story("B", ["b1"])], props);
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["unavailable"]);
    tick(1600);
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith([]);
  });

  it("a tap during the notice ends it early", () => {
    const props = { onStoriesChange: vi.fn(), unavailableNoticeMs: 5000 };
    const { rerenderStories } = mount(three(), props);
    rerenderStories([story("A", ["a2"]), story("B", ["b1"])], props);
    expect(marker()).not.toBeNull();
    fireEvent.click(zones()[2]);
    expect(marker()).toBeNull();
    expect(shown()).toContain("a2.jpg");
  });

  it("standalone + single-item story: the notice stays until the viewer closes", () => {
    const onItemUnavailable = vi.fn();
    const props = {
      onStoriesChange: vi.fn(),
      standalone: true,
      unavailableNoticeMs: 1000,
      onItemUnavailable,
    };
    const { rerenderStories, onClose } = mount([story("A", ["a1"]), story("B", ["b1"])], props);
    rerenderStories([story("B", ["b1"])], props);
    tick(10000);
    expect(marker()).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(zones()[2]); // navigation does not move on either
    expect(marker()).not.toBeNull();
    expect(onItemUnavailable).toHaveBeenCalledTimes(1);
  });

  it("standalone with a multi-item story still moves on", () => {
    const props = { onStoriesChange: vi.fn(), standalone: true, unavailableNoticeMs: 1000 };
    const { rerenderStories } = mount([story("A", ["a1", "a2"])], props);
    rerenderStories([story("A", ["a2"])], props);
    tick(1100);
    expect(marker()).toBeNull();
    expect(shown()).toContain("a2.jpg");
  });

  it("the last story removed: notice, then the viewer closes", () => {
    const props = { onStoriesChange: vi.fn(), unavailableNoticeMs: 1000 };
    const { rerenderStories, onClose } = mount([story("A", ["a1"])], props);
    rerenderStories([], props);
    expect(marker()).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    tick(1100);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── onItemViewed cause ─────────────────────────────────────────────────────

describe("onItemViewed(storyId, itemId, itemIndex, cause)", () => {
  it('"completed" after playing to the end (first three args unchanged)', () => {
    const onItemViewed = vi.fn();
    mount([story("A", ["a1", "a2"])], { onItemViewed });
    tick(5100);
    expect(onItemViewed).toHaveBeenCalledTimes(1);
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "completed", { direction: "forward" });
  });

  it('"left" for next story, previous story and goToStory', () => {
    const onItemViewed = vi.fn();
    const { ref } = mount(
      [story("A", ["a1", "a2"]), story("B", ["b1"]), story("C", ["c1"])],
      { onItemViewed },
    );
    fireEvent.click(nextStoryBtn());
    expect(onItemViewed).toHaveBeenLastCalledWith("A", "a1", 0, "left", { direction: "forward" });
    fireEvent.click(prevStoryBtn());
    expect(onItemViewed).toHaveBeenLastCalledWith("B", "b1", 0, "left", { direction: "backward" });
    act(() => ref.current!.goToStory(2));
    expect(onItemViewed).toHaveBeenLastCalledWith("A", "a1", 0, "left", { direction: "forward" });
    expect(onItemViewed).toHaveBeenCalledTimes(3);
  });

  it("goToStory to the current story fires nothing", () => {
    const onItemViewed = vi.fn();
    const { ref } = mount([story("A", ["a1"]), story("B", ["b1"])], { onItemViewed });
    act(() => ref.current!.goToStory(0));
    expect(onItemViewed).not.toHaveBeenCalled();
  });

  it("a swipe commit leaves the item", () => {
    const onItemViewed = vi.fn();
    mount([story("A", ["a1"]), story("B", ["b1"])], { onItemViewed, disableStoryTransition: false });
    const z = zones()[1];
    pointer("pointerdown", z, { clientX: 300, clientY: 100 });
    pointer("pointermove", z, { clientX: 100, clientY: 100 });
    pointer("pointerup", document.querySelector(".touch-pan-y")!, { clientX: 100, clientY: 100 });
    tick(600);
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "left", { direction: "forward" });
  });

  it('tapping past an item inside the story is "left" (it did not play to the end)', () => {
    const onItemViewed = vi.fn();
    mount([story("A", ["a1", "a2"])], { onItemViewed });
    fireEvent.click(zones()[2]);
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "left", { direction: "forward" });
  });
});

// ─── Muted groups ───────────────────────────────────────────────────────────

describe("muted groups", () => {
  const lineup = () => [
    story("A", ["a1"]),
    story("B", ["b1"], { muted: true }),
    story("C", ["c1"]),
  ];

  it("auto-advance skips a muted group", () => {
    mount(lineup());
    tick(5100);
    expect(shown()).toContain("c1.jpg");
  });

  it("next / previous by arrow skip it, in both directions", () => {
    const { ref } = mount(lineup());
    fireEvent.click(nextStoryBtn());
    expect(shown()).toContain("c1.jpg");
    fireEvent.click(prevStoryBtn());
    expect(shown()).toContain("a1.jpg");
    expect(ref.current!.getCursor().storyIndex).toBe(0);
  });

  it("tapping past the last item / back before the first skips it", () => {
    const { ref } = mount(lineup());
    fireEvent.click(zones()[2]);
    expect(ref.current!.getCursor().storyIndex).toBe(2);
    fireEvent.click(zones()[0]);
    expect(ref.current!.getCursor().storyIndex).toBe(0);
  });

  it("a direct open plays a muted group (initialStoryIndex, goToStory)", () => {
    const { ref } = mount(lineup(), { initialStoryIndex: 1 });
    expect(shown()).toContain("b1.jpg");
    act(() => ref.current!.goToStory(0));
    act(() => ref.current!.goToStory(1));
    expect(shown()).toContain("b1.jpg");
  });

  it("only muted groups ahead: the end of the story closes (or stays with disableAutoClose)", () => {
    const set = () => [story("A", ["a1"]), story("B", ["b1"], { muted: true })];
    const a = mount(set());
    tick(5100);
    expect(a.onClose).toHaveBeenCalledTimes(1);
    cleanup();
    const onAutoCloseAtEnd = vi.fn();
    const b = mount(set(), { disableAutoClose: true, onAutoCloseAtEnd });
    tick(5100);
    expect(onAutoCloseAtEnd).toHaveBeenCalledTimes(1);
    expect(b.onClose).not.toHaveBeenCalled();
  });

  it("the previous arrow is disabled when only muted groups lie before", () => {
    mount([story("A", ["a1"], { muted: true }), story("B", ["b1"])], { initialStoryIndex: 1 });
    expect((prevStoryBtn() as HTMLButtonElement).disabled).toBe(true);
  });

  it("the swipe preview shows the neighbour a swipe would land on", () => {
    mount(lineup(), { disableStoryTransition: false });
    const z = zones()[1];
    pointer("pointerdown", z, { clientX: 300, clientY: 100 });
    pointer("pointermove", z, { clientX: 100, clientY: 100 });
    expect(shown()).toContain("c1.jpg");
    expect(shown()).not.toContain("b1.jpg");
  });
});

// ─── Pause reasons ──────────────────────────────────────────────────────────

describe("SV4 — pause reasons", () => {
  it("setPaused(true) adds host, setPaused(false) removes host and user", () => {
    const onPauseReasonsChange = vi.fn();
    const { ref } = mount([story("A", ["a1", "a2"])], { onPauseReasonsChange });
    act(() => ref.current!.setPaused(true));
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["host"]);
    expect(isPausedUi()).toBe(true);
    fireEvent.click(zones()[1]); // middle tap: user — already paused, so it resumes
    expect(isPausedUi()).toBe(false);
    act(() => ref.current!.setPaused(true));
    act(() => ref.current!.setPaused(false));
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith([]);
    expect(isPausedUi()).toBe(false);
  });

  it("host persists across items; user (middle tap) clears on item change", () => {
    const onPauseReasonsChange = vi.fn();
    const { ref } = mount([story("A", ["a1", "a2", "a3"])], { onPauseReasonsChange });
    fireEvent.click(zones()[1]);
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["user"]);
    act(() => ref.current!.goToItem(1));
    expect(isPausedUi()).toBe(false);
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith([]);
    act(() => ref.current!.setPaused(true));
    act(() => ref.current!.goToItem(2));
    expect(isPausedUi()).toBe(true);
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["host"]);
  });

  it("a sheet adds `sheet` and never resumes a host pause (F-02)", () => {
    const onPauseReasonsChange = vi.fn();
    const { ref } = mount([story("A", ["a1"])], { ...viewer, onPauseReasonsChange });
    act(() => ref.current!.setPaused(true));
    fireEvent.click(screen.getByLabelText("Story actions"));
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["host", "sheet"]);
    fireEvent.click(document.querySelector('[role="menu"] [aria-label="Close"]')!);
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["host"]);
    expect(isPausedUi()).toBe(true);
  });

  it("long press adds hold and a release removes only hold", () => {
    const onPauseReasonsChange = vi.fn();
    const { ref } = mount([story("A", ["a1", "a2"])], { onPauseReasonsChange });
    act(() => ref.current!.setPaused(true));
    const right = zones()[2];
    pointer("pointerdown", right);
    tick(300);
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["host", "hold"]);
    pointer("pointerup", right);
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["host"]);
    expect(isPausedUi()).toBe(true);
  });

  it("the reply composer holds reply-focus while focused or holding a draft", () => {
    const onPauseReasonsChange = vi.fn();
    mount([story("A", ["a1"])], { ...viewer, onPauseReasonsChange });
    const input = screen.getByLabelText("Reply to A") as HTMLTextAreaElement;
    act(() => input.focus());
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["reply-focus"]);
    expect(isPausedUi()).toBe(true);
    fireEvent.change(input, { target: { value: "hi" } });
    act(() => input.blur());
    expect(isPausedUi()).toBe(true); // a draft keeps it
    fireEvent.change(input, { target: { value: "" } });
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith([]);
    expect(isPausedUi()).toBe(false);
  });

  it("a hidden tab pauses and a visible one resumes", () => {
    const onPauseReasonsChange = vi.fn();
    mount([story("A", ["a1"])], { onPauseReasonsChange });
    const setVisibility = (v: "hidden" | "visible") => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => v });
      document.dispatchEvent(new Event("visibilitychange"));
    };
    try {
      act(() => setVisibility("hidden"));
      expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["hidden-tab"]);
      expect(isPausedUi()).toBe(true);
      act(() => setVisibility("visible"));
      expect(isPausedUi()).toBe(false);
    } finally {
      delete (document as unknown as Record<string, unknown>).visibilityState;
    }
  });

  it("controlled pauseReasons wins every render; changes are reported, not applied", () => {
    const onPauseReasonsChange = vi.fn();
    const { ref, rerenderStories } = mount([story("A", ["a1"])], {
      pauseReasons: [],
      onPauseReasonsChange,
    });
    act(() => ref.current!.setPaused(true));
    expect(onPauseReasonsChange).toHaveBeenLastCalledWith(["host"]);
    expect(isPausedUi()).toBe(false); // the host did not accept it
    rerenderStories([story("A", ["a1"])], { pauseReasons: ["my-own"], onPauseReasonsChange });
    expect(isPausedUi()).toBe(true); // host-defined strings pause too
    rerenderStories([story("A", ["a1"])], { pauseReasons: [], onPauseReasonsChange });
    expect(isPausedUi()).toBe(false);
  });

  it("a stateful controlled host round-trips the built-in reasons", () => {
    function Host() {
      const [reasons, setReasons] = useState<string[]>([]);
      return (
        <div>
          <span data-testid="reasons">{reasons.join(",")}</span>
          <StoryViewer
            stories={[story("A", ["a1", "a2"])]}
            isOpen
            initialStoryIndex={0}
            onClose={() => {}}
            disableStoryTransition
            pauseReasons={reasons}
            onPauseReasonsChange={setReasons}
          />
        </div>
      );
    }
    render(<Host />);
    fireEvent.click(zones()[1]);
    expect(screen.getByTestId("reasons").textContent).toBe("user");
    expect(isPausedUi()).toBe(true);
    fireEvent.click(zones()[1]);
    expect(screen.getByTestId("reasons").textContent).toBe("");
    expect(isPausedUi()).toBe(false);
  });
});
