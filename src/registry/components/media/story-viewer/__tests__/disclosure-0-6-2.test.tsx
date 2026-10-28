/**
 * story-viewer 0.6.2 - the comment / share actions carry engagement-bar 0.7.0 disclosure state
 * for the sheets they open (platform request EB-1).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import type { Story, StoryItem } from "../types";

const item = (id: string): StoryItem => ({ id, type: "image", src: `${id}.jpg` });
const story = (id: string, items: StoryItem[]): Story => ({
  id,
  userId: `u-${id}`,
  username: id,
  items,
  createdAt: "2026-01-01T00:00:00Z",
});

const completeDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "complete");
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
  globalThis.ResizeObserver = originalRO;
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  }
});

function mountViewer(extra: Record<string, unknown> = {}) {
  return render(
    <StoryViewer
      stories={[story("s1", [item("i1")])]}
      isOpen
      initialStoryIndex={0}
      onClose={() => {}}
      disableStoryTransition
      viewerMode="viewer"
      currentUser={{ id: "me", name: "Me" }}
      {...extra}
    />,
  );
}
const expand = () => fireEvent.click(document.querySelector('[aria-label="Show reactions"]')!);
const button = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}`) });

describe("comment / share disclosure state", () => {
  it.each([
    ["Comment", "comments"],
    ["Share", "share"],
  ])("%s reports its sheet: collapsed, then expanded with aria-controls on the sheet", (name) => {
    mountViewer();
    expand();
    const btn = button(name);
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.hasAttribute("aria-controls")).toBe(false);
    fireEvent.click(btn);
    const open = button(name);
    expect(open.getAttribute("aria-expanded")).toBe("true");
    const id = open.getAttribute("aria-controls")!;
    expect(id).toBeTruthy();
    expect(document.getElementById(id)?.getAttribute("role")).toBe("dialog");
  });

  it("without a sheet (disableComments / disableSharePanel) the actions carry no disclosure state", () => {
    mountViewer({ disableComments: true, disableSharePanel: true });
    expand();
    expect(button("Comment").hasAttribute("aria-expanded")).toBe(false);
    expect(button("Share").hasAttribute("aria-expanded")).toBe(false);
  });
});
