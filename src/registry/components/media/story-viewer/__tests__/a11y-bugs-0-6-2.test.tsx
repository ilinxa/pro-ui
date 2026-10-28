/**
 * story-viewer 0.6.2 — a11y / bug patch (R1–R8). No API change.
 *
 *  R1  focus returns to the opener on close
 *  R2  only the current progress segment is a named progressbar
 *  R3  bars sit above the header scrim and carry a shadow
 *  R4  cube ghost faces are inert
 *  R5  notice timers wait while another pause reason holds
 *  R6  a long press ends on window pointerup / pointercancel / blur
 *  R7  Play / Space ends a notice early
 *  R8  onItemViewed JSDoc matches behaviour
 */
import { readFileSync } from "node:fs";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import type { Story, StoryItem, StoryViewerHandle } from "../types";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";

const img = (id: string): StoryItem => ({ id, type: "image", src: `${id}.jpg` });
const lazy = (id: string): StoryItem => ({ id, type: "image" });
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
  Object.defineProperty(HTMLImageElement.prototype, "complete", { configurable: true, get: () => true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
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
const isPausedUi = () => !!document.querySelector('[aria-label="Play"]');
const notice = () => document.querySelector<HTMLElement>("[data-story-unavailable]");

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

describe("R1 focus on close", () => {
  it("returns focus to the element that was focused when the viewer opened", () => {
    const opener = document.createElement("button");
    opener.textContent = "Open";
    document.body.appendChild(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const { view, props } = mount([story("A", [img("a1")])]);
    tick(200);
    expect(document.activeElement).not.toBe(opener); // focus moved into the viewer

    view.rerender(<StoryViewer {...props} isOpen={false} />);
    tick(500);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("Safari-like open (the pressed button never takes focus): focus still returns to it", () => {
    const { view, props } = mount([story("A", [img("a1")])]);
    view.rerender(<StoryViewer {...props} isOpen={false} />);
    tick(500);
    const opener = document.createElement("button");
    opener.textContent = "Open";
    document.body.appendChild(opener);
    (document.activeElement as HTMLElement | null)?.blur();
    opener.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(document.activeElement).toBe(document.body);
    view.rerender(<StoryViewer {...props} isOpen />);
    tick(200);
    view.rerender(<StoryViewer {...props} isOpen={false} />);
    tick(500);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("does not steal focus when the host moved it elsewhere", () => {
    const opener = document.createElement("button");
    const other = document.createElement("button");
    document.body.append(opener, other);
    opener.focus();
    const { view, props } = mount([story("A", [img("a1")])]);
    tick(200);
    view.rerender(<StoryViewer {...props} isOpen={false} />);
    other.focus();
    tick(500);
    expect(document.activeElement).toBe(other);
    opener.remove();
    other.remove();
  });
});

describe("R2 progress bars a11y", () => {
  it("only the current segment is a progressbar, named by labels.position; the rest are aria-hidden", async () => {
    mount([story("A", [img("a1"), img("a2"), img("a3")])]);
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(1);
    expect(bars[0].getAttribute("aria-label")).toBe("A, 1 of 3");
    const strip = document.querySelector("[data-story-progress]")!;
    expect(strip.querySelectorAll("[aria-hidden='true']")).toHaveLength(2);
    vi.useRealTimers(); // axe schedules with real timers
    await expectNoAxeViolations(document.querySelector("[role='dialog']")!);
  });

  it("a custom labels.position names the bar", () => {
    mount([story("A", [img("a1"), img("a2")])], { labels: { position: (a: string, i: number, n: number) => `${a} #${i}/${n}` } });
    expect(screen.getByRole("progressbar").getAttribute("aria-label")).toBe("A #0/2");
  });
});

describe("R3 bar contrast", () => {
  it("the bars stack above the header (and its scrim) and carry a token-coloured shadow", () => {
    mount([story("A", [img("a1"), img("a2")])]);
    const strip = document.querySelector<HTMLElement>("[data-story-progress]")!;
    const header = document.querySelector("[data-story-header-scrim]")!.parentElement!;
    const z = (el: Element) => Number(/(?:^|\s)z-(\d+)(?:\s|$)/.exec(el.className)?.[1] ?? 0);
    expect(z(strip)).toBeGreaterThan(z(header));
    expect(strip.firstElementChild!.className).toContain("shadow-[0_0_3px] shadow-media-overlay");
  });
});

describe("R4 cube ghost faces", () => {
  it("every ghost wrapper is inert, so none of its buttons can take focus", () => {
    mount([story("A", [img("a1")]), story("B", [img("b1")])], { disableStoryTransition: false });
    pointer("pointerdown", zones()[1], { clientX: 100, clientY: 100 });
    pointer("pointermove", zones()[1], { clientX: 180, clientY: 100 });
    const ghosts = Array.from(document.querySelectorAll<HTMLElement>(".backface-hidden[aria-hidden='true']"));
    expect(ghosts.length).toBeGreaterThan(0);
    for (const g of ghosts) {
      expect(g.hasAttribute("inert")).toBe(true);
      for (const b of Array.from(g.querySelectorAll("button"))) expect(b.closest("[inert]")).not.toBeNull();
    }
  });
});

describe("R5 notice timers vs other pause reasons", () => {
  it("the unavailable notice waits while a hold pauses, then runs the remaining time", async () => {
    const { ref } = mount([story("A", [lazy("a1"), lazy("a2")])], {
      resolveMedia: async (item: StoryItem) => (item.id === "a1" ? null : { src: `${item.id}.jpg` }),
    });
    await flush();
    expect(notice()).not.toBeNull();
    tick(1000);
    pointer("pointerdown", root());
    tick(300); // hold fires at 200ms; ~1200ms of the notice has run
    tick(5000);
    expect(ref.current!.getCursor().itemIndex).toBe(0); // still showing the notice
    pointer("pointerup", root());
    tick(100);
    expect(ref.current!.getCursor().itemIndex).toBe(0);
    tick(400);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
  });

  it("the removal notice waits while a hold pauses, then releases", () => {
    const stories = [story("A", [img("a1"), img("a2")])];
    const { view, props } = mount(stories, { onStoriesChange: () => {} });
    const without = [story("A", [img("a2")])];
    view.rerender(<StoryViewer {...props} stories={without} />);
    expect(notice()).not.toBeNull();
    tick(1000);
    pointer("pointerdown", root());
    tick(300);
    tick(5000);
    expect(notice()).not.toBeNull();
    pointer("pointerup", root());
    tick(100);
    expect(notice()).not.toBeNull();
    tick(400);
    expect(notice()).toBeNull();
  });
});

describe("R6 stuck hold", () => {
  for (const [name, fire] of [
    ["window pointerup", () => pointer("pointerup", window)],
    ["window pointercancel", () => pointer("pointercancel", window)],
    ["window blur", () => fireEvent.blur(window)],
  ] as const) {
    it(`a hold ends on ${name}`, () => {
      mount([story("A", [img("a1"), img("a2")])]);
      pointer("pointerdown", zones()[1]);
      tick(300);
      expect(isPausedUi()).toBe(true);
      act(() => void fire());
      expect(isPausedUi()).toBe(false);
    });
  }

  it("the listeners are gone once the hold ended", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    mount([story("A", [img("a1"), img("a2")])]);
    pointer("pointerdown", zones()[1]);
    tick(300);
    pointer("pointerup", zones()[1]);
    expect(remove.mock.calls.map((c) => c[0])).toEqual(expect.arrayContaining(["pointerup", "pointercancel", "blur"]));
    remove.mockRestore();
  });
});

describe("R7 Play during a notice", () => {
  it("Play ends the unavailable notice early", async () => {
    const { ref } = mount([story("A", [lazy("a1"), lazy("a2")])], {
      resolveMedia: async (item: StoryItem) => (item.id === "a1" ? null : { src: `${item.id}.jpg` }),
    });
    await flush();
    expect(notice()).not.toBeNull();
    fireEvent.click(document.querySelector('[aria-label="Play"]')!);
    expect(ref.current!.getCursor().itemIndex).toBe(1);
  });

  it("Space ends the removal notice early", () => {
    const { view, props } = mount([story("A", [img("a1"), img("a2")])], { onStoriesChange: () => {} });
    view.rerender(<StoryViewer {...props} stories={[story("A", [img("a2")])]} />);
    expect(notice()).not.toBeNull();
    fireEvent.keyDown(document.body, { key: " " });
    expect(notice()).toBeNull();
  });

  it("with no notice, Play still toggles the pause", () => {
    mount([story("A", [img("a1"), img("a2")])]);
    fireEvent.click(document.querySelector('[aria-label="Pause"]')!);
    expect(isPausedUi()).toBe(true);
    fireEvent.click(document.querySelector('[aria-label="Play"]')!);
    expect(isPausedUi()).toBe(false);
  });
});

describe("R8 onItemViewed JSDoc", () => {
  it("says taps report 'left', not 'completed'", () => {
    const types = readFileSync(`${process.cwd()}/src/registry/components/media/story-viewer/types.ts`, "utf8");
    expect(types).not.toContain("played to the end or was tapped past");
    expect(types).toContain("`\"completed\"` only when the");
  });
});
