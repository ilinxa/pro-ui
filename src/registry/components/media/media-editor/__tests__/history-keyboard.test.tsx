/**
 * R8 — Ctrl/Cmd+Z undo is window-level; it must leave typing targets alone (their own
 * native undo applies) — including a <select>, which the old ad-hoc check missed.
 */
import { fireEvent, render, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useHistory } from "../hooks/use-history";

function setup() {
  const undo = vi.fn();
  const { result } = renderHook(() => useHistory());
  result.current.execute({ do: () => {}, undo });
  return undo;
}

describe("media-editor history shortcut (R8)", () => {
  it("Ctrl+Z on the page undoes", () => {
    const undo = setup();
    fireEvent.keyDown(document.body, { key: "z", ctrlKey: true });
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it("Ctrl+Z typed into a textarea, a select or contentEditable does not", () => {
    const undo = setup();
    const { container } = render(
      <div>
        <textarea aria-label="caption" />
        <select aria-label="font">
          <option>a</option>
        </select>
        <div contentEditable suppressContentEditableWarning aria-label="text" />
      </div>,
    );
    for (const el of container.querySelectorAll("textarea, select, [contenteditable]")) {
      fireEvent.keyDown(el, { key: "z", ctrlKey: true });
    }
    expect(undo).not.toHaveBeenCalled();
  });

  it("bindKeyboard=false detaches the shortcut", () => {
    const undo = vi.fn();
    const { result } = renderHook(() => useHistory({ bindKeyboard: false }));
    result.current.execute({ do: () => {}, undo });
    fireEvent.keyDown(document.body, { key: "z", ctrlKey: true });
    expect(undo).not.toHaveBeenCalled();
  });
});
