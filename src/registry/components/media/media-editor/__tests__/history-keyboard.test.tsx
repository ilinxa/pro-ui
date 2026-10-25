/**
 * R8 — Ctrl/Cmd+Z undo is window-level; it must leave typing targets alone (their own
 * native undo applies) — including a <select>, which the old ad-hoc check missed.
 */
import { act, fireEvent, render, renderHook } from "@testing-library/react";
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

describe("media-editor history shortcut claims the key only when it has work (ME3)", () => {
  // fireEvent returns false when a listener called preventDefault()
  const press = (init: KeyboardEventInit) => fireEvent.keyDown(document.body, init);

  it("empty stacks leave Ctrl/Cmd+Z, Shift+Ctrl+Z and Ctrl+Y to the browser", () => {
    renderHook(() => useHistory());
    expect(press({ key: "z", ctrlKey: true })).toBe(true);
    expect(press({ key: "z", metaKey: true })).toBe(true);
    expect(press({ key: "z", ctrlKey: true, shiftKey: true })).toBe(true);
    expect(press({ key: "y", ctrlKey: true })).toBe(true);
  });

  it("a non-empty undo stack claims Ctrl/Cmd+Z", () => {
    const undo = vi.fn();
    const { result } = renderHook(() => useHistory());
    act(() => result.current.execute({ do: () => {}, undo }));
    expect(press({ key: "z", metaKey: true })).toBe(false);
    expect(undo).toHaveBeenCalledTimes(1);
    // the stack is empty again: the next press is the browser's
    expect(press({ key: "z", metaKey: true })).toBe(true);
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it("redo (Shift+Ctrl+Z and Ctrl+Y) is claimed only once something was undone", () => {
    const redoDo = vi.fn();
    const { result } = renderHook(() => useHistory());
    act(() => result.current.execute({ do: redoDo, undo: () => {} }));
    redoDo.mockClear();
    expect(press({ key: "y", ctrlKey: true })).toBe(true); // nothing to redo yet
    expect(press({ key: "z", ctrlKey: true })).toBe(false); // undo
    expect(press({ key: "z", ctrlKey: true, shiftKey: true })).toBe(false); // redo
    expect(redoDo).toHaveBeenCalledTimes(1);
    expect(press({ key: "z", ctrlKey: true })).toBe(false); // undo again
    expect(press({ key: "y", ctrlKey: true })).toBe(false); // Ctrl+Y redo
    expect(redoDo).toHaveBeenCalledTimes(2);
    expect(press({ key: "y", ctrlKey: true })).toBe(true); // redo stack empty again
  });
});
