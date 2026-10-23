/**
 * R8 — Alt+Shift+Arrow resizes the focused pane from a window listener. Before 0.2.1 it had
 * no typing guard: the same chord (extend selection by word on some platforms) typed in an
 * input resized the pane.
 */
import { fireEvent, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useResizeKeyboard } from "../hooks/use-keyboard-actions";
import type { AreaTree } from "../types";

const leaf = (id: string): AreaTree => ({ kind: "leaf", id, componentId: "c" });

function setup() {
  const dispatch = vi.fn();
  renderHook(() =>
    useResizeKeyboard({
      enabled: true,
      focusedAreaId: "a",
      leaves: [
        { areaId: "a", componentId: "c", depth: 1, x: 0, y: 0, width: 50, height: 100 },
        { areaId: "b", componentId: "c", depth: 1, x: 50, y: 0, width: 50, height: 100 },
      ],
      dividers: [{ splitPath: [], orientation: "vertical", x: 50, y: 0, length: 100 }],
      renderedTree: { kind: "split", orientation: "horizontal", ratio: 0.5, a: leaf("a"), b: leaf("b") },
      dispatch,
    }),
  );
  return dispatch;
}

describe("split-workspace Alt+Shift+Arrow (R8)", () => {
  it("resizes from the page", () => {
    const dispatch = setup();
    fireEvent.keyDown(document.body, { key: "ArrowRight", altKey: true, shiftKey: true });
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "resize", splitPath: [] }));
  });

  it("does nothing while the user types in an input", () => {
    const dispatch = setup();
    const { getByLabelText } = render(<input aria-label="name" />);
    fireEvent.keyDown(getByLabelText("name"), { key: "ArrowRight", altKey: true, shiftKey: true });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
