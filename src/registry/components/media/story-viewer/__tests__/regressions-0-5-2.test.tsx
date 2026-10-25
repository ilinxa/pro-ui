/**
 * story-viewer 0.5.2 regressions (batch B1).
 *
 *  (a) removing the current item / group never leaves a cursor naming a removed id
 *  (b) the global keydown listener stands down for editable targets + buttons
 *  (c) triggerReply(content) pre-fills the reply composer
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import { isEditableTarget } from "../lib/is-editable-target";
import type { Story, StoryViewerHandle } from "../types";

const item = (id: string) => ({ id, type: "image" as const, src: `${id}.jpg` });
const story = (id: string, itemIds: string[]): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items: itemIds.map(item),
  createdAt: "2026-01-01T00:00:00Z",
});

// 0.5.4 ready gate: progress waits for the image to load. jsdom never loads
// images (`complete` is false), so model already-loaded images here.
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

const shownSrc = () =>
  Array.from(document.querySelectorAll("img"))
    .map((i) => i.getAttribute("src"))
    .filter((s): s is string => !!s && /^[a-z0-9]+\.jpg$/.test(s));
const maxProgress = () =>
  Math.max(
    0,
    ...screen
      .queryAllByRole("progressbar")
      .map((p) => Number(p.getAttribute("aria-valuenow"))),
  );
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

// 0.6.0: removing the on-screen item holds a 1500 ms notice by default; these
// regressions are about the repair itself, so they opt into the immediate move.
const immediate = { unavailableNoticeMs: 0 };

describe("(a) removal keeps the cursor valid", () => {
  it("removing the current item shows the next item and progress restarts + advances", () => {
    const { ref } = mount([story("A", ["a1", "a2"]), story("B", ["b1"])], immediate);
    tick(4000); // a1 nearly done (5s default)
    expect(maxProgress()).toBeGreaterThanOrEqual(70);

    act(() => ref.current!.dispatch({ kind: "remove-item", storyId: "A", itemId: "a1" }));

    expect(shownSrc()).toContain("a2.jpg");
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 0, itemIndex: 0 });
    expect(maxProgress()).toBeLessThan(10); // restarted, not frozen at 100
    tick(2500);
    const mid = maxProgress();
    expect(mid).toBeGreaterThan(30);
    expect(mid).toBeLessThan(80);
    tick(3000); // a2 completes -> next story
    expect(shownSrc()).toContain("b1.jpg");
  });

  it("removing the current group moves to the next group's first item and navigation still works", () => {
    const { ref } = mount([story("A", ["a1"]), story("B", ["b1", "b2"])], immediate);
    act(() => ref.current!.dispatch({ kind: "remove-story", storyId: "A" }));
    expect(shownSrc()).toContain("b1.jpg");
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 0, itemIndex: 0 });
    tick(5100);
    expect(shownSrc()).toContain("b2.jpg"); // navigation not dead
  });

  it("removing the last remaining group closes the viewer", () => {
    const { ref, onClose } = mount([story("A", ["a1"])], immediate);
    expect(onClose).not.toHaveBeenCalled();
    act(() => ref.current!.dispatch({ kind: "remove-story", storyId: "A" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opened with stories=[] then a story arrives: it shows and progress advances", () => {
    const { ref } = mount([]);
    act(() => ref.current!.dispatch({ kind: "add-story", story: story("A", ["a1"]) }));
    expect(shownSrc()).toContain("a1.jpg");
    tick(2500);
    expect(maxProgress()).toBeGreaterThan(30);
  });
});

describe("(b) keyboard guard", () => {
  const composerProps = {
    viewerMode: "viewer",
    currentUser: { id: "me", name: "Me" },
    onAddReply: vi.fn(),
  };

  it("Space / ArrowRight typed in the reply textarea change neither pause nor item", () => {
    const { ref } = mount([story("A", ["a1", "a2"])], composerProps);
    const ta = screen.getByRole("textbox");
    expect(fireEvent.keyDown(ta, { key: " " })).toBe(true); // not preventDefault'd
    fireEvent.keyDown(ta, { key: "ArrowRight" });
    expect(ref.current!.getCursor().itemIndex).toBe(0);
    tick(2000);
    expect(maxProgress()).toBeGreaterThan(25); // still playing -> not paused
  });

  it("positive control: Space on the body still toggles pause", () => {
    mount([story("A", ["a1", "a2"])]);
    fireEvent.keyDown(document.body, { key: " " });
    const before = maxProgress();
    tick(2000);
    expect(maxProgress()).toBe(before); // paused
  });

  it("Space on a focused button is left to the button", () => {
    mount([story("A", ["a1", "a2"])]);
    const btn = document.createElement("button");
    document.body.appendChild(btn);
    expect(fireEvent.keyDown(btn, { key: " " })).toBe(true);
    tick(2000);
    expect(maxProgress()).toBeGreaterThan(25);
    btn.remove();
  });

  it("ignores IME composition", () => {
    const { ref } = mount([story("A", ["a1", "a2"])]);
    fireEvent.keyDown(document.body, { key: "ArrowRight", isComposing: true });
    expect(ref.current!.getCursor().itemIndex).toBe(0);
  });

  it("isEditableTarget recognises the documented targets", () => {
    const mk = (html: string) => {
      const d = document.createElement("div");
      d.innerHTML = html;
      return d.firstElementChild as HTMLElement;
    };
    expect(isEditableTarget(mk("<input />"))).toBe(true);
    expect(isEditableTarget(mk("<textarea></textarea>"))).toBe(true);
    expect(isEditableTarget(mk("<select></select>"))).toBe(true);
    expect(isEditableTarget(mk('<div role="textbox"></div>'))).toBe(true);
    expect(isEditableTarget(mk('<div data-keyboard-ignore><span id="x"></span></div>').querySelector("#x"))).toBe(true);
    expect(isEditableTarget(mk("<div></div>"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe("(c) triggerReply(content)", () => {
  it("pre-fills the reply composer", () => {
    const { ref } = mount([story("A", ["a1"])], {
      viewerMode: "viewer",
      currentUser: { id: "me", name: "Me" },
      onAddReply: vi.fn(),
    });
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("");
    act(() => ref.current!.triggerReply("hi"));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("hi");
    act(() => ref.current!.triggerReply("again"));
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("again");
  });
});

describe("U4 review fixes", () => {
  const replyProps = {
    viewerMode: "viewer",
    currentUser: { id: "me", name: "Me" },
    onAddReply: vi.fn(),
  };
  const textbox = () => screen.getByRole("textbox") as HTMLTextAreaElement;

  it("an unsent draft is discarded when the item changes (never sent to another item)", () => {
    const { ref } = mount([story("A", ["a1", "a2"])], replyProps);
    fireEvent.change(textbox(), { target: { value: "draft for a1" } });
    expect(textbox().value).toBe("draft for a1");
    act(() => ref.current!.goToItem(1));
    expect(ref.current!.getCursor().itemIndex).toBe(1);
    expect(textbox().value).toBe("");
  });

  it("a pre-fill after an abandoned draft still pauses the story", () => {
    const { ref } = mount([story("A", ["a1", "a2"])], replyProps);
    fireEvent.change(textbox(), { target: { value: "abandoned" } });
    act(() => ref.current!.goToItem(1));
    act(() => ref.current!.triggerReply("x"));
    const before = maxProgress();
    tick(2000);
    expect(maxProgress()).toBe(before); // paused by the pre-fill
  });

  it("a group inserted BEFORE the current one keeps the same item on screen", () => {
    const { ref } = mount([story("A", ["a1"]), story("B", ["b1"])]);
    act(() => ref.current!.goToStory(1));
    expect(shownSrc()).toContain("b1.jpg");
    act(() => ref.current!.dispatch({ kind: "add-story", story: story("Z", ["z1"]), position: "start" }));
    expect(shownSrc()).toContain("b1.jpg");
    expect(ref.current!.getCursor()).toEqual({ storyIndex: 2, itemIndex: 0 });
  });

  it("widgets that own the arrow keys are treated as editable targets", () => {
    for (const role of ["slider", "spinbutton", "combobox", "listbox"]) {
      const d = document.createElement("div");
      d.setAttribute("role", role);
      expect(isEditableTarget(d)).toBe(true);
    }
  });
});
