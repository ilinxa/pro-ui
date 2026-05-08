"use client";

import { useEffect } from "react";
import type { ActionsV02 } from "../types";
import type { GraphStore } from "../lib/store/store-creator";

/**
 * Per v0.2 plan §10: canvas-focus-only keyboard shortcuts.
 *
 *   - Cmd/Ctrl+Z → undo
 *   - Cmd/Ctrl+Shift+Z, Cmd/Ctrl+Y → redo
 *   - Esc → exit linking mode (if active)
 *
 * Scope is gated on `canvasRoot.contains(document.activeElement)` so
 * we don't fight panel inputs (text fields, sliders) elsewhere on the
 * page. Hosts wanting broader scope wire their own document listeners
 * that call the same actions.
 *
 * Refs are not used for the action / store handles because the effect
 * re-binds on identity change anyway, and Zustand's store + the memoized
 * actions object are stable across renders.
 */
export function useKeyboardShortcuts(
  canvasRoot: HTMLElement | null,
  store: GraphStore,
  actions: Pick<ActionsV02, "undo" | "redo" | "exitLinkingMode">,
): void {
  useEffect(() => {
    if (!canvasRoot) return;

    const handler = (e: KeyboardEvent): void => {
      if (!canvasRoot.contains(document.activeElement)) return;
      const meta = e.metaKey || e.ctrlKey;

      if (e.key === "z" && meta && !e.shiftKey) {
        e.preventDefault();
        actions.undo();
      } else if ((e.key === "z" && meta && e.shiftKey) || (e.key === "y" && meta)) {
        e.preventDefault();
        actions.redo();
      } else if (e.key === "Escape") {
        if (store.getState().ui.linkingMode.active) {
          e.preventDefault();
          actions.exitLinkingMode();
        }
      }
    };

    canvasRoot.addEventListener("keydown", handler);
    return () => canvasRoot.removeEventListener("keydown", handler);
  }, [canvasRoot, store, actions]);
}
