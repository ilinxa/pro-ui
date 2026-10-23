/**
 * R8 (0.5.3) — story-viewer's window shortcuts run through the shared useGlobalKeydown hook,
 * which also skips events another handler already handled (preventDefault). The reply-box
 * cases (SV7) live in regressions-0-5-2.test.tsx.
 */
import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStoryKeyboardNav } from "../hooks/use-story-keyboard-nav";

function setup(isOpen = true) {
  const onNextItem = vi.fn();
  const onTogglePause = vi.fn();
  renderHook(() => useStoryKeyboardNav({ isOpen, onPrevItem: vi.fn(), onNextItem, onTogglePause }));
  return { onNextItem, onTogglePause };
}

describe("story-viewer keyboard hook (R8)", () => {
  it("ArrowRight on the page advances", () => {
    const { onNextItem } = setup();
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(onNextItem).toHaveBeenCalledTimes(1);
  });

  it("an event another handler already prevented is left alone", () => {
    const { onNextItem, onTogglePause } = setup();
    for (const key of ["ArrowRight", " "]) {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      event.preventDefault();
      act(() => {
        document.body.dispatchEvent(event);
      });
    }
    expect(onNextItem).not.toHaveBeenCalled();
    expect(onTogglePause).not.toHaveBeenCalled();
  });

  it("closed: no listener", () => {
    const { onNextItem } = setup(false);
    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(onNextItem).not.toHaveBeenCalled();
  });
});
