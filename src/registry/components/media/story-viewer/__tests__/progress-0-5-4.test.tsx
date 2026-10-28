/**
 * story-viewer 0.5.4 — progress (SV2 / SV3).
 *
 *  P1  image progress waits for `load`
 *  P2  cached image / custom renderItem frame count as ready (0.6.0: an image ERROR is unavailable "media")
 *  P3  video without `duration` follows media time; hook banks elapsed time on a duration change
 *  P4  `ended` + timer completion advance exactly once
 */
import { createRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import { useStoryProgress } from "../hooks/use-story-progress";
import type { Story, StoryItem, StoryViewerHandle } from "../types";

const img = (id: string): StoryItem => ({ id, type: "image", src: `${id}.jpg` });
const vid = (id: string, duration?: number): StoryItem => ({
  id,
  type: "video",
  src: `${id}.mp4`,
  ...(duration != null ? { duration } : {}),
});
const story = (id: string, items: StoryItem[]): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items,
  createdAt: "2026-01-01T00:00:00Z",
});

const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
function setImageComplete(value: boolean) {
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => value,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  setImageComplete(false); // jsdom never fires `load`; model a not-yet-loaded image
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
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

const maxProgress = () =>
  Math.max(
    0,
    ...screen
      .queryAllByRole("progressbar")
      .map((p) => Number(p.getAttribute("aria-valuenow"))),
  );
const barValues = () =>
  screen.queryAllByRole("progressbar").map((p) => Number(p.getAttribute("aria-valuenow")));
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const theImage = () => document.querySelector("img[src$='.jpg']") as HTMLImageElement;

describe("P1 image progress waits for load", () => {
  it("stays at 0 until the image loads, then runs the full duration", () => {
    const { ref } = mount([story("A", [img("a1"), img("a2")])]);
    tick(6000);
    expect(maxProgress()).toBe(0);
    expect(ref.current!.getCursor().itemIndex).toBe(0);

    fireEvent.load(theImage());
    tick(2500);
    const mid = maxProgress();
    expect(mid).toBeGreaterThan(30);
    expect(mid).toBeLessThan(80);
    expect(ref.current!.getCursor().itemIndex).toBe(0);
    tick(3000);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
  });

  it("the ready flag resets per item (next image waits for its own load)", () => {
    const { ref } = mount([story("A", [img("a1"), img("a2")])]);
    fireEvent.load(theImage());
    tick(5200);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
    tick(6000);
    expect(ref.current!.getCursor().itemIndex).toBe(1); // a2 not loaded yet
    expect(barValues()).toEqual([0]); // 0.6.2: only the current segment is a progressbar (a2, at 0)
  });
});

describe("P2 failure / cached / custom frame count as ready", () => {
  it("image error -> unavailable notice (0.6.0), no timer; then the next item", () => {
    const { ref } = mount([story("A", [img("a1"), img("a2")])]);
    tick(1000);
    expect(maxProgress()).toBe(0);
    fireEvent.error(theImage());
    expect(document.querySelector('[data-story-unavailable="media"]')).not.toBeNull();
    tick(1000);
    expect(maxProgress()).toBe(0); // the item never counts down
    expect(ref.current!.getCursor().itemIndex).toBe(0);
    tick(600);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
  });

  it("image already complete at mount -> timer runs", () => {
    setImageComplete(true);
    const { ref } = mount([story("A", [img("a1"), img("a2")])]);
    tick(5200);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
  });

  it("custom renderItem frame -> timer runs immediately", () => {
    const { ref } = mount([story("A", [img("a1"), img("a2")])], {
      renderItem: () => <div data-testid="custom-frame" />,
    });
    tick(5200);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
  });
});

function setMedia(video: HTMLVideoElement, currentTime: number, duration: number) {
  Object.defineProperty(video, "currentTime", { configurable: true, writable: true, value: currentTime });
  Object.defineProperty(video, "duration", { configurable: true, value: duration });
}
function emitTime(video: HTMLVideoElement, currentTime: number, duration = 10) {
  setMedia(video, currentTime, duration);
  fireEvent.timeUpdate(video);
  tick(40); // VideoPlayer throttles onTimeUpdate through requestAnimationFrame
}
const theVideo = () => document.querySelector("video") as HTMLVideoElement;

describe("P3 video progress follows media time", () => {
  it("bar follows currentTime / duration, never moves back, timer does not drive it", () => {
    const onItemViewed = vi.fn();
    const { ref } = mount([story("A", [vid("v1"), img("a2")])], { onItemViewed });
    const v = theVideo();
    setMedia(v, 0, 10);
    fireEvent.loadedMetadata(v);
    emitTime(v, 3);
    expect(barValues()[0]).toBe(30);

    tick(8000); // wall clock must not complete the item
    expect(ref.current!.getCursor().itemIndex).toBe(0);
    expect(barValues()[0]).toBe(30);

    emitTime(v, 2.9); // a late/stale update must not move the bar back
    expect(barValues()[0]).toBe(30);
    emitTime(v, 6);
    expect(barValues()[0]).toBe(60);

    fireEvent.ended(v);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
    expect(onItemViewed).toHaveBeenCalledTimes(1);
  });

  it("a failing video is unavailable (0.6.0) and moves on after the notice instead of freezing", () => {
    const { ref } = mount([story("A", [vid("v1"), img("a2")])]);
    fireEvent.error(theVideo());
    expect(document.querySelector('[data-story-unavailable="media"]')).not.toBeNull();
    expect(ref.current!.getCursor().itemIndex).toBe(0);
    tick(1600);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
  });

  it("useStoryProgress banks elapsed time when itemDurationMs changes mid-item", () => {
    function Harness() {
      const [d, setD] = useState(10_000);
      const p = useStoryProgress({
        isOpen: true,
        isPaused: false,
        itemKey: "k",
        itemDurationMs: d,
        onComplete: () => {},
      });
      return (
        <button data-testid="p" data-p={p} onClick={() => setD(20_000)}>
          x
        </button>
      );
    }
    render(<Harness />);
    tick(5000);
    expect(Number(screen.getByTestId("p").dataset.p)).toBeGreaterThan(45);
    fireEvent.click(screen.getByTestId("p"));
    tick(100);
    // 5100 ms of 20000 ms ~ 25 %; without banking it restarts at ~0 %.
    expect(Number(screen.getByTestId("p").dataset.p)).toBeGreaterThan(20);
  });
});

function mountRerenderable(stories: Story[]) {
  const ref = createRef<StoryViewerHandle>();
  const make = (isOpen: boolean) => (
    <StoryViewer
      ref={ref}
      stories={stories}
      isOpen={isOpen}
      initialStoryIndex={0}
      onClose={() => {}}
      disableStoryTransition
    />
  );
  const view = render(make(true));
  return { ref, setOpen: (o: boolean) => view.rerender(make(o)) };
}

describe("U4 revisit / reopen / live video / reused item ids", () => {
  it("revisiting a video starts its bar from the new playback position", () => {
    const { ref } = mountRerenderable([story("A", [vid("v1"), img("a2")])]);
    let v = theVideo();
    setMedia(v, 0, 10);
    fireEvent.loadedMetadata(v);
    emitTime(v, 6);
    expect(barValues()[0]).toBe(60);
    act(() => ref.current!.goToItem(1));
    act(() => ref.current!.goToItem(0));
    v = theVideo();
    setMedia(v, 0, 10);
    fireEvent.loadedMetadata(v);
    emitTime(v, 1);
    expect(barValues()[0]).toBe(10);
  });

  it("close then reopen starts the video bar from the new position", () => {
    const { setOpen } = mountRerenderable([story("A", [vid("v1"), img("a2")])]);
    let v = theVideo();
    setMedia(v, 0, 10);
    emitTime(v, 6);
    expect(barValues()[0]).toBe(60);
    act(() => setOpen(false));
    act(() => setOpen(true));
    v = theVideo();
    setMedia(v, 0, 10);
    emitTime(v, 1);
    expect(barValues()[0]).toBe(10);
  });

  it("a live video (Infinity duration) falls back to the timer and advances", () => {
    const { ref } = mount([story("A", [vid("v1"), img("a2")])]);
    const v = theVideo();
    setMedia(v, 0, Infinity);
    fireEvent.loadedMetadata(v);
    fireEvent.play(v);
    tick(5200);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
  });

  it("a zero-duration timeupdate also falls back to the timer", () => {
    const { ref } = mount([story("A", [vid("v1"), img("a2")])]);
    const v = theVideo();
    emitTime(v, 1, 0);
    tick(5200);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
  });

  it("two stories reusing item ids: the second image waits for its own load", () => {
    const loaded = new WeakSet<Element>();
    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      configurable: true,
      get(this: HTMLImageElement) {
        return loaded.has(this);
      },
    });
    const a: StoryItem = { id: "1", type: "image", src: "x.jpg" };
    const b: StoryItem = { id: "1", type: "image", src: "y.jpg" };
    const { ref } = mount([story("A", [a]), story("B", [b])]);
    const first = theImage();
    loaded.add(first);
    fireEvent.load(first);
    tick(5200);
    expect(ref.current!.getCursor().storyIndex).toBe(1);
    tick(6000);
    expect(ref.current!.getCursor().storyIndex).toBe(1);
    expect(maxProgress()).toBe(0); // B has not loaded
  });

  it("reopening the same item waits for the new image's load", () => {
    const { setOpen } = mountRerenderable([story("A", [img("a1"), img("a2")])]);
    fireEvent.load(theImage());
    tick(2000);
    expect(maxProgress()).toBeGreaterThan(20);
    act(() => setOpen(false));
    act(() => setOpen(true));
    tick(3000);
    expect(maxProgress()).toBe(0);
  });
});

describe("P4 single advance", () => {
  it("timer completion and `ended` in the same moment advance once", () => {
    const onItemViewed = vi.fn();
    const { ref } = mount([story("A", [vid("v1", 2), img("a2"), img("a3")])], { onItemViewed });
    const v = theVideo();
    fireEvent.play(v); // started -> ready
    tick(1000);
    act(() => {
      vi.advanceTimersByTime(1100); // timer completes -> advance
      fireEvent.ended(v); // same batch, before React re-renders
    });
    expect(ref.current!.getCursor().itemIndex).toBe(1);
    expect(onItemViewed).toHaveBeenCalledTimes(1);
  });
});
