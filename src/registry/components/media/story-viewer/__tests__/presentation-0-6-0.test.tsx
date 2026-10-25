/**
 * story-viewer 0.6.0 presentation & a11y (slice D).
 *
 *  SV18 progress ticks never re-render the root
 *  SV12 caption / item time / locale   SV13 reduced motion   SV14 card size + arrows placement
 *  SV15 AT item buttons + live region  SV19 RTL               renderHeaderBadge   F-03 late inert
 */
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { StoryViewer } from "../story-viewer";
import type { Story, StoryViewerHandle, StoryViewerProps } from "../types";

const item = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: "image" as const,
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
  document.documentElement.removeAttribute("dir");
  window.matchMedia = realMatchMedia;
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, "complete", completeDescriptor);
  }
});

function mount(stories: Story[], extra: Partial<StoryViewerProps> = {}) {
  const ref = createRef<StoryViewerHandle>();
  const onClose = vi.fn();
  const utils = render(
    <StoryViewer
      ref={ref}
      stories={stories}
      isOpen
      initialStoryIndex={0}
      onClose={onClose}
      {...extra}
    />,
  );
  return { ref, onClose, ...utils };
}
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("SV18 — progress ticks do not re-render the root", () => {
  it("renderHeader (called by the root's render) runs once per root render, not per 50 ms tick", () => {
    const renderHeader = vi.fn(() => <div data-testid="hdr" />);
    mount([story("A", ["a1", "a2"])], { disableStoryTransition: true, renderHeader });
    const before = renderHeader.mock.calls.length;
    tick(2000); // 40 ticks
    expect(renderHeader.mock.calls.length).toBe(before);
    // ...and the bars still advance
    const pct = Math.max(
      ...screen.getAllByRole("progressbar").map((p) => Number(p.getAttribute("aria-valuenow"))),
    );
    expect(pct).toBeGreaterThan(20);
  });

  it("renderProgress still receives live values", () => {
    const seen: number[] = [];
    mount([story("A", ["a1"])], {
      disableStoryTransition: true,
      renderProgress: (_items, _idx, progress) => {
        seen.push(progress);
        return <div />;
      },
    });
    tick(2000);
    expect(Math.max(...seen)).toBeGreaterThan(20);
  });
});
