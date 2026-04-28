"use client";

import { useCallback, useEffect, type Dispatch } from "react";
import type { RichCardAction, RichCardState } from "../lib/reducer";

export function useUndo(
  state: RichCardState,
  dispatch: Dispatch<RichCardAction>,
  options: {
    enableShortcuts?: boolean;
    rootRef?: { current: HTMLElement | null };
    onUndo?: () => void;
    onRedo?: () => void;
  } = {},
) {
  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  const undo = useCallback((): boolean => {
    if (state.undoStack.length === 0) return false;
    dispatch({ type: "undo" });
    options.onUndo?.();
    return true;
  }, [state.undoStack.length, dispatch, options]);

  const redo = useCallback((): boolean => {
    if (state.redoStack.length === 0) return false;
    dispatch({ type: "redo" });
    options.onRedo?.();
    return true;
  }, [state.redoStack.length, dispatch, options]);

  const clearHistory = useCallback(() => {
    dispatch({ type: "clear-history" });
  }, [dispatch]);

  // Keyboard shortcuts: Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo), Cmd/Ctrl+Y (redo)
  useEffect(() => {
    if (options.enableShortcuts === false) return;
    const root = options.rootRef?.current;
    if (!root) return;
    const handler = (e: KeyboardEvent) => {
      // Don't intercept if focus is in an input / textarea / contenteditable
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    root.addEventListener("keydown", handler);
    return () => root.removeEventListener("keydown", handler);
  }, [options.enableShortcuts, options.rootRef, undo, redo]);

  return { canUndo, canRedo, undo, redo, clearHistory };
}
