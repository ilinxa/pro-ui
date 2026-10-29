/**
 * story-viewer 0.7.1 - the release-9 follow-ups.
 *
 *  FU-9   reopen on an EMPTY list renders nothing of the previous session (no removal notice)
 *  FU-10  owner view-count chip: its visible text IS its accessible name (no `aria-label`)
 *  FU-11  every layer (actions menu, viewers list, sheets) returns focus to an opener that a
 *         Safari-like press did not focus
 *  FU-12  a press released OFF the card leaves no armed swipe behind
 *  FU-13  a cube ghost `<video>` that fails is hidden
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import type { Story, StoryItem, StoryViewerHandle } from "../types";

const img = (id: string, extra: Partial<StoryItem> = {}): StoryItem => ({
  id,
  type: "image",
  src: `${id}.jpg`,
  ...extra,
});
const vid = (id: string): StoryItem => ({ id, type: "video", src: `${id}.mp4` });
const story = (id: string, items: StoryItem[], extra: Partial<Story> = {}): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items,
  createdAt: "2026-01-01T00:00:00Z",
  ...extra,
});
const A = story("A", [img("a1"), img("a2")]);
const B = story("B", [img("b1"), img("b2")]);

const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(HTMLImageElement.prototype, "complete", { configurable: true, get: () => true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  }
});

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const pointer = (type: string, target: Element, init: Record<string, unknown> = {}) =>
  fireEvent(
    target,
    new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: "mouse", button: 0, ...init }),
  );
/** A Safari / macOS Firefox click: the press lands, the button does NOT take focus. */
const safariClick = (el: HTMLElement) => {
  pointer("pointerdown", el);
  pointer("pointerup", el);
  fireEvent.click(el);
};
const stageSrcs = () =>
  Array.from(document.querySelectorAll<HTMLImageElement>("[data-story-stage] img")).map((i) => i.getAttribute("src"));
const zones = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("div[aria-hidden='true'].absolute.inset-0.z-10 > button"));
const gestureRoot = () => document.querySelector<HTMLElement>(".touch-pan-y")!;

function mount(stories: Story[], extra: Record<string, unknown> = {}) {
  const ref = createRef<StoryViewerHandle>();
  const props = {
    ref,
    stories,
    isOpen: true,
    initialStoryIndex: 0,
    onClose: () => {},
    disableStoryTransition: true,
    ...extra,
  };
  const view = render(<StoryViewer {...props} />);
  return { ref, view, props };
}

// ─── FU-9 ────────────────────────────────────────────────────────────────
describe("FU-9 reopen on an empty list", () => {
  it("renders nothing of the previous session, reports nothing, then seeds from the first stories", () => {
    const onItemUnavailable = vi.fn();
    const { view, props } = mount([A, B], {
      onStoriesChange: () => {},
      onItemUnavailable,
      initialStoryIndex: 1,
      initialItemIndex: 1,
    });
    expect(stageSrcs()).toEqual(["b2.jpg"]);
    view.rerender(<StoryViewer {...props} isOpen={false} />);
    tick(500);
    view.rerender(<StoryViewer {...props} isOpen stories={[]} initialStoryIndex={0} initialItemIndex={0} />);
    tick(2000);
    expect(stageSrcs()).toEqual([]);
    expect(document.querySelector("[data-story-unavailable]")).toBeNull();
    expect(onItemUnavailable).not.toHaveBeenCalled();
    view.rerender(<StoryViewer {...props} isOpen stories={[A, B]} initialStoryIndex={0} initialItemIndex={1} />);
    expect(stageSrcs()).toEqual(["a2.jpg"]);
  });
});

// ─── FU-10 ───────────────────────────────────────────────────────────────
describe("FU-10 owner view-count chip", () => {
  const chip = () => document.querySelector<HTMLButtonElement>('button[data-story-layer="viewers"]')!;
  const owner = { viewerMode: "owner" as const, onLoadViewers: async () => ({ items: [], nextCursor: null }) };

  it("shows its label as its text and carries no aria-label", () => {
    mount([story("S", [img("s1", { viewerCount: 47 })])], {
      ...owner,
      labels: { formatTime: () => "2h", viewerCountLabel: (_c: number, t: string, f?: string) => `${f} views · ${t}` },
    });
    expect(chip().hasAttribute("aria-label")).toBe(false);
    expect(chip().textContent).toBe("47 views · 2h");
    expect(screen.getByRole("button", { name: "47 views · 2h" })).toBe(chip());
  });

  it("a withheld count shows the heading and the time, no number", () => {
    mount([story("S", [img("s1", { viewerCount: null })])], {
      ...owner,
      labels: { formatTime: () => "2h", viewersHeading: "Viewers" },
    });
    expect(chip().hasAttribute("aria-label")).toBe(false);
    expect(chip().textContent).toBe("Viewers · 2h");
  });
});

// ─── FU-11 ───────────────────────────────────────────────────────────────
describe("FU-11 layers return focus to an opener the press did not focus", () => {
  it("actions menu: closed by its close button", () => {
    mount([A], { extraKebabActions: () => [{ label: "Download", onClick: () => {} }] });
    tick(300);
    const trigger = screen.getByLabelText("Story actions");
    safariClick(trigger);
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    const close = document.querySelector<HTMLButtonElement>('[role="menu"] button[aria-label="Close"]')!;
    act(() => close.focus());
    fireEvent.click(close);
    tick(100);
    expect(document.activeElement).toBe(trigger);
  });

  it("actions menu: closed by choosing an item", () => {
    const onDownload = vi.fn();
    mount([A], { extraKebabActions: () => [{ label: "Download", onClick: onDownload }] });
    tick(300);
    const trigger = screen.getByLabelText("Story actions");
    safariClick(trigger);
    const itemButton = screen.getByRole("menuitem", { name: "Download" });
    act(() => itemButton.focus());
    fireEvent.click(itemButton);
    tick(100);
    expect(onDownload).toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
  });

  it("viewers list: closed by its close button", () => {
    mount([story("S", [img("s1", { viewerCount: 3 })])], {
      viewerMode: "owner",
      onLoadViewers: async () => ({ items: [], nextCursor: null }),
    });
    tick(300);
    const chip = document.querySelector<HTMLButtonElement>('button[data-story-layer="viewers"]')!;
    safariClick(chip);
    const close = document.querySelector<HTMLButtonElement>('div[data-story-layer="viewers"] button[aria-label="Close"]')!;
    expect(close).not.toBeNull();
    act(() => close.focus());
    fireEvent.click(close);
    tick(100);
    expect(document.activeElement).toBe(chip);
  });
});

// ─── FU-12 ───────────────────────────────────────────────────────────────
describe("FU-12 a press released off the card", () => {
  it("leaves no armed swipe: a later button-less hover does not drag", () => {
    const { ref } = mount([A, B], { storySwipe: true });
    const root = gestureRoot();
    pointer("pointerdown", root, { clientX: 300, clientY: 300 });
    pointer("pointerup", document.body, { clientX: 900, clientY: 300 }); // released outside the card
    // Hover back across the card with no button pressed, then let go of nothing.
    pointer("pointermove", root, { clientX: 100, clientY: 300, buttons: 0 });
    pointer("pointerup", root, { clientX: 50, clientY: 300 });
    expect(ref.current!.getCursor().storyIndex).toBe(0);
  });

  it("a real swipe still moves (the release inside the card is the card's own)", () => {
    const { ref } = mount([A, B], { storySwipe: true });
    const root = gestureRoot();
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({ width: 400, height: 700 } as DOMRect);
    pointer("pointerdown", root, { clientX: 300, clientY: 300 });
    pointer("pointermove", root, { clientX: 100, clientY: 300 });
    pointer("pointerup", root, { clientX: 50, clientY: 300 });
    expect(ref.current!.getCursor().storyIndex).toBe(1);
  });
});

// ─── FU-13 ───────────────────────────────────────────────────────────────
describe("FU-13 cube ghost video", () => {
  it("a ghost video that fails is hidden", () => {
    mount([story("A", [img("a1")]), story("B", [vid("b1")])], { disableStoryTransition: false });
    pointer("pointerdown", zones()[1], { clientX: 300, clientY: 100 });
    pointer("pointermove", zones()[1], { clientX: 200, clientY: 100 });
    const ghostVideo = document.querySelector<HTMLVideoElement>(".backface-hidden[aria-hidden='true'] video");
    expect(ghostVideo).not.toBeNull();
    expect(ghostVideo!.style.visibility).toBe("");
    fireEvent.error(ghostVideo!);
    expect(ghostVideo!.style.visibility).toBe("hidden");
  });
});
