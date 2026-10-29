/**
 * story-viewer 0.6.0 — U4 review fixes, slice X (state / media).
 *
 *  F1  onItemViewed cause: "completed" only when the item played to the end
 *  F2  loadTimeoutMs is pause-aware (restarts in full on resume)
 *  F3  removal repair skips muted groups
 *  F4  a removal of an item whose unavailable notice already shows is the same notice
 *  F5  an item without `src` owned by a custom renderItem frame is not unavailable
 *  F6  closing the viewer clears the `host` pause reason (but a pre-open hold survives)
 *  F7  an explicit `canLike` is not overridden by a canPerformAction that only knows `react`
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import {
  canPerformStoryActionInternal,
  resolveStoryPermissions,
} from "../lib/permissions";
import type { Story, StoryItem, StoryViewerHandle } from "../types";

const img = (id: string): StoryItem => ({ id, type: "image", src: `${id}.jpg` });
const vid = (id: string): StoryItem => ({ id, type: "video", src: `${id}.mp4` });
const noSrc = (id: string): StoryItem => ({ id, type: "image" });
const story = (id: string, items: StoryItem[], extra: Partial<Story> = {}): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items,
  createdAt: "2026-01-01T00:00:00Z",
  ...extra,
});

let imagesComplete = true;
const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
beforeEach(() => {
  vi.useFakeTimers();
  imagesComplete = true;
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => imagesComplete,
  });
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

type Props = Record<string, unknown>;

function mount(stories: Story[], extra: Props = {}) {
  const ref = createRef<StoryViewerHandle>();
  const onClose = vi.fn();
  const element = (next: Story[], more: Props = {}) => (
    <StoryViewer
      ref={ref}
      stories={next}
      isOpen
      initialStoryIndex={0}
      onClose={onClose}
      disableStoryTransition
      {...extra}
      {...more}
    />
  );
  const utils = render(element(stories));
  const rerenderWith = (next: Story[], more: Props = {}) => utils.rerender(element(next, more));
  return { ref, onClose, rerenderWith };
}

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};
const zones = () =>
  Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      "div[aria-hidden='true'].absolute.inset-0.z-10 > button",
    ),
  );
const shown = () =>
  Array.from(document.querySelectorAll("img")).map((i) => i.getAttribute("src") ?? "");
const notice = () => document.querySelector<HTMLElement>("[data-story-unavailable]");
const isPausedUi = () => !!document.querySelector('[aria-label="Play"]');
const bar = (i = 0) =>
  Number(screen.queryAllByRole("progressbar")[i]?.getAttribute("aria-valuenow") ?? NaN);

// ─── F1 ─────────────────────────────────────────────────────────────────────

describe("F1 onItemViewed cause", () => {
  it('a next tap mid-item reports "left"', () => {
    const onItemViewed = vi.fn();
    mount([story("A", [img("a1"), img("a2")])], { onItemViewed });
    tick(500);
    fireEvent.click(zones()[2]);
    expect(onItemViewed).toHaveBeenCalledTimes(1);
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "left", { direction: "forward" });
  });

  it('ArrowRight mid-item reports "left"', () => {
    const onItemViewed = vi.fn();
    mount([story("A", [img("a1"), img("a2")])], { onItemViewed });
    tick(500);
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "left", { direction: "forward" });
  });

  it('the handle goToItem leaves with "left"', () => {
    const onItemViewed = vi.fn();
    const { ref } = mount([story("A", [img("a1"), img("a2")])], { onItemViewed });
    tick(500);
    act(() => ref.current!.goToItem(1));
    expect(onItemViewed).not.toHaveBeenCalledWith("A", "a1", 0, "completed", { direction: "forward" });
    // 0.7.0 - the handle reports the item it leaves.
    expect(onItemViewed).toHaveBeenCalledTimes(1);
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "left", { direction: "forward" });
  });

  it('auto-advance after the full duration reports "completed"', () => {
    const onItemViewed = vi.fn();
    mount([story("A", [img("a1"), img("a2")])], { onItemViewed });
    tick(5100);
    expect(onItemViewed).toHaveBeenCalledTimes(1);
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "completed", { direction: "forward" });
  });

  it('tapping past the LAST item reports "left"', () => {
    const onItemViewed = vi.fn();
    const { onClose } = mount([story("A", [img("a1")])], { onItemViewed });
    tick(500);
    fireEvent.click(zones()[2]);
    expect(onClose).toHaveBeenCalled();
    expect(onItemViewed).toHaveBeenCalledWith("A", "a1", 0, "left", { direction: "forward" });
    expect(onItemViewed).not.toHaveBeenCalledWith("A", "a1", 0, "completed", { direction: "forward" });
  });

  it('a video that ends reports "completed"', () => {
    const onItemViewed = vi.fn();
    mount([story("A", [vid("v1"), img("a2")])], { onItemViewed });
    fireEvent.ended(document.querySelector("video")!);
    expect(onItemViewed).toHaveBeenCalledTimes(1);
    expect(onItemViewed).toHaveBeenCalledWith("A", "v1", 0, "completed", { direction: "forward" });
  });
});

// ─── F2 ─────────────────────────────────────────────────────────────────────

describe("F2 loadTimeoutMs is pause-aware", () => {
  it("a host-paused viewer never times out; resume restarts the full timeout", () => {
    imagesComplete = false; // the image never becomes ready
    const onItemUnavailable = vi.fn();
    const { ref } = mount([story("A", [img("a1"), img("a2")])], {
      loadTimeoutMs: 8000,
      onItemUnavailable,
    });
    tick(5000);
    act(() => ref.current!.setPaused(true));
    tick(30_000);
    expect(notice()).toBeNull();
    expect(onItemUnavailable).not.toHaveBeenCalled();
    act(() => ref.current!.setPaused(false));
    tick(7900); // a fresh 8 s, not the 3 s that were left
    expect(notice()).toBeNull();
    tick(200);
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("timeout");
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "timeout");
  });

  it("a hidden tab holds the clock too", () => {
    imagesComplete = false;
    const onItemUnavailable = vi.fn();
    mount([story("A", [img("a1"), img("a2")])], { loadTimeoutMs: 4000, onItemUnavailable });
    const setVisibility = (v: string) => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => v });
      document.dispatchEvent(new Event("visibilitychange"));
    };
    try {
      act(() => setVisibility("hidden"));
      tick(20_000);
      expect(onItemUnavailable).not.toHaveBeenCalled();
      act(() => setVisibility("visible"));
      tick(4100);
      expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "timeout");
    } finally {
      delete (document as unknown as Record<string, unknown>).visibilityState;
    }
  });
});

// ─── F3 ─────────────────────────────────────────────────────────────────────

describe("F3 removal repair skips muted groups", () => {
  const props = { onStoriesChange: vi.fn(), unavailableNoticeMs: 0 };

  it("removing the last item of A while B is muted lands in C", () => {
    const { rerenderWith } = mount(
      [story("A", [img("a1")]), story("B", [img("b1")], { muted: true }), story("C", [img("c1")])],
      props,
    );
    rerenderWith(
      [story("A", []), story("B", [img("b1")], { muted: true }), story("C", [img("c1")])],
      props,
    );
    expect(shown()).toContain("c1.jpg");
    expect(shown()).not.toContain("b1.jpg");
  });

  it("removing story A (group gone) while B is muted lands in C", () => {
    const { rerenderWith } = mount(
      [story("A", [img("a1")]), story("B", [img("b1")], { muted: true }), story("C", [img("c1")])],
      props,
    );
    rerenderWith([story("B", [img("b1")], { muted: true }), story("C", [img("c1")])], props);
    expect(shown()).toContain("c1.jpg");
  });

  it("nothing un-muted ahead: falls back to the nearest earlier un-muted group", () => {
    const { rerenderWith } = mount(
      [story("P", [img("p1")]), story("A", [img("a1")]), story("B", [img("b1")], { muted: true })],
      { ...props, initialStoryIndex: 1 },
    );
    rerenderWith(
      [story("P", [img("p1")]), story("A", []), story("B", [img("b1")], { muted: true })],
      { ...props, initialStoryIndex: 1 },
    );
    expect(shown()).toContain("p1.jpg");
    expect(shown()).not.toContain("b1.jpg");
  });
});

// ─── F4 ─────────────────────────────────────────────────────────────────────

describe("F4 removing an item whose unavailable notice already shows", () => {
  it("no second notice and no second event; moves on when the first notice ends", async () => {
    const onItemUnavailable = vi.fn();
    const resolveMedia = vi.fn(async () => null);
    const props = {
      onStoriesChange: vi.fn(),
      onItemUnavailable,
      resolveMedia,
      unavailableNoticeMs: 1500,
    };
    const first = story("A", [noSrc("a1"), img("a2")]);
    const { rerenderWith } = mount([first], props);
    await flush();
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("resolve");
    expect(onItemUnavailable).toHaveBeenCalledTimes(1);
    tick(600);
    // the host reacts to the event by removing the item
    rerenderWith([story("A", [img("a2")])], props);
    expect(onItemUnavailable).toHaveBeenCalledTimes(1);
    expect(onItemUnavailable).not.toHaveBeenCalledWith("A", "a1", "removed");
    tick(1000); // 1.6 s after the FIRST notice began; a second 1.5 s hold would still be up
    expect(notice()).toBeNull();
    expect(shown()).toContain("a2.jpg");
    expect(onItemUnavailable).toHaveBeenCalledTimes(1);
  });

  it("control: removing an item that was playing still shows the notice and fires 'removed' once", () => {
    const onItemUnavailable = vi.fn();
    const props = { onStoriesChange: vi.fn(), onItemUnavailable, unavailableNoticeMs: 1500 };
    const { rerenderWith } = mount([story("A", [img("a1"), img("a2")])], props);
    rerenderWith([story("A", [img("a2")])], props);
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("removed");
    expect(onItemUnavailable).toHaveBeenCalledTimes(1);
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "a1", "removed");
  });
});

// ─── F5 ─────────────────────────────────────────────────────────────────────

describe("F5 srcless item owned by a custom frame", () => {
  it("renderItem + no resolveMedia: a srcless item is not unavailable and counts down", () => {
    const onItemUnavailable = vi.fn();
    mount([story("A", [noSrc("t1"), img("a2")])], {
      onItemUnavailable,
      renderItem: () => <div data-testid="text-card" />,
    });
    expect(notice()).toBeNull();
    expect(screen.getByTestId("text-card")).toBeTruthy();
    tick(1000);
    expect(bar(0)).toBeGreaterThan(0);
    expect(onItemUnavailable).not.toHaveBeenCalled();
  });

  it('no renderItem and no resolveMedia: still unavailable "resolve"', () => {
    const onItemUnavailable = vi.fn();
    mount([story("A", [noSrc("t1"), img("a2")])], { onItemUnavailable });
    expect(notice()?.getAttribute("data-story-unavailable")).toBe("resolve");
    expect(onItemUnavailable).toHaveBeenCalledWith("A", "t1", "resolve");
  });
});

// ─── F6 ─────────────────────────────────────────────────────────────────────

describe("F6 host pause across close / reopen", () => {
  it("setPaused(true) while open does not survive a close + reopen", () => {
    const ref = createRef<StoryViewerHandle>();
    const stories = [story("A", [img("a1"), img("a2")])];
    const el = (isOpen: boolean) => (
      <StoryViewer
        ref={ref}
        stories={stories}
        isOpen={isOpen}
        initialStoryIndex={0}
        onClose={() => {}}
        disableStoryTransition
      />
    );
    const utils = render(el(true));
    act(() => ref.current!.setPaused(true));
    expect(isPausedUi()).toBe(true);
    utils.rerender(el(false));
    utils.rerender(el(true));
    expect(isPausedUi()).toBe(false);
  });

  it("setPaused(true) made while closed still holds on the next open", () => {
    const ref = createRef<StoryViewerHandle>();
    const stories = [story("A", [img("a1"), img("a2")])];
    const el = (isOpen: boolean) => (
      <StoryViewer
        ref={ref}
        stories={stories}
        isOpen={isOpen}
        initialStoryIndex={0}
        onClose={() => {}}
        disableStoryTransition
      />
    );
    const utils = render(el(false));
    act(() => ref.current!.setPaused(true));
    utils.rerender(el(true));
    expect(isPausedUi()).toBe(true);
  });
});

// ─── F7 ─────────────────────────────────────────────────────────────────────

describe("F7 explicit canLike", () => {
  const s = story("A", [img("a1")]);
  const i = s.items[0];
  const onlyReact = (action: string) => (action === "react" ? false : undefined);

  it("canLike: true wins over a predicate that only denies react (canReact default true)", () => {
    const matrix = resolveStoryPermissions("viewer", { canLike: true });
    expect(canPerformStoryActionInternal("like", s, i, matrix, onlyReact)).toBe(true);
  });

  it("canLike unset still follows the predicate's react answer", () => {
    const matrix = resolveStoryPermissions("viewer", { canReact: true });
    expect(canPerformStoryActionInternal("like", s, i, matrix, onlyReact)).toBe(false);
  });
});
