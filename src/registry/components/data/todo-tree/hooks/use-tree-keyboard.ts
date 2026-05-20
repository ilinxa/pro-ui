"use client";

import { useCallback } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { TodoTreeStateValue } from "../types";

export interface UseTreeKeyboardArgs {
  state: TodoTreeStateValue;
}

export interface UseTreeKeyboardResult {
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Keyboard navigation per plan §16.3. Reads visibleItems + focusedItemId
 * from state; routes to the appropriate handle method.
 *
 * Implemented map:
 *   ArrowDown / ArrowUp   — next / prev visible row
 *   ArrowRight            — expand collapsed; else move to first visible child
 *   ArrowLeft             — collapse expanded; else move to parent
 *   Home / End            — first / last visible row
 *   Space                 — toggle the focused row's active state
 *   Enter                 — select + fire onItemClick on the focused row
 *   Delete / Backspace    — remove the focused row
 *   Cmd/Ctrl + A          — select all visible
 *   Escape                — clear selection
 *
 * Bail-out rule: the handler is attached at the tree root and events bubble
 * from interactive descendants (chevron buttons, checkboxes, grip, slot
 * inputs). When the target is a form input or button, we bail so the
 * native handler runs without double-handling (e.g., Space toggling the
 * checkbox AND firing toggleActive a second time; Backspace deleting a
 * character in a slot input AND removing the row).
 */
export function useTreeKeyboard(
  args: UseTreeKeyboardArgs,
): UseTreeKeyboardResult {
  const { state } = args;

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches(
          "input, textarea, select, button, [role='button'], [contenteditable='true']",
        )
      ) {
        return;
      }

      const visible = state.visibleItems;
      if (visible.length === 0) return;

      // Resolve the active row from focusedItemId; fall back to first
      // visible when nothing is focused yet.
      const focusIdx = state.focusedItemId
        ? visible.findIndex((r) => r.item.id === state.focusedItemId)
        : -1;
      const idx = focusIdx === -1 ? 0 : focusIdx;
      const current = visible[idx];

      const moveTo = (nextIdx: number) => {
        const clamped = Math.max(0, Math.min(visible.length - 1, nextIdx));
        const next = visible[clamped];
        if (!next) return;
        state.focusItem(next.item.id);
      };

      const meta = event.metaKey || event.ctrlKey;
      const key = event.key;

      // Cmd/Ctrl-A — select all visible.
      if (meta && (key === "a" || key === "A")) {
        event.preventDefault();
        state.selectAll();
        return;
      }

      switch (key) {
        case "ArrowDown":
          event.preventDefault();
          moveTo(idx + 1);
          return;
        case "ArrowUp":
          event.preventDefault();
          moveTo(idx - 1);
          return;
        case "Home":
          event.preventDefault();
          moveTo(0);
          return;
        case "End":
          event.preventDefault();
          moveTo(visible.length - 1);
          return;
        case "ArrowRight": {
          event.preventDefault();
          if (!current) return;
          const hasChildren =
            !!current.item.children && current.item.children.length > 0;
          if (!hasChildren) return;
          if (state.collapsedIds.has(current.item.id)) {
            state.expandItem(current.item.id);
            return;
          }
          // Move to first visible child (the next row whose parentId matches).
          const child = visible[idx + 1];
          if (child && child.parentId === current.item.id) {
            state.focusItem(child.item.id);
          }
          return;
        }
        case "ArrowLeft": {
          event.preventDefault();
          if (!current) return;
          const hasChildren =
            !!current.item.children && current.item.children.length > 0;
          if (hasChildren && !state.collapsedIds.has(current.item.id)) {
            state.collapseItem(current.item.id);
            return;
          }
          // Move to parent if any.
          if (current.parentId !== null) {
            state.focusItem(current.parentId);
          }
          return;
        }
        case " ":
        case "Spacebar": {
          event.preventDefault();
          if (!current) return;
          state.toggleActive(current.item.id, !current.item.active);
          return;
        }
        case "Enter": {
          event.preventDefault();
          if (!current) return;
          // Route through handleRowClick so selection-mode resolution +
          // onItemClick firing match the click path. TodoTreeItemEvent.event
          // accepts MouseEvent | KeyboardEvent, so the KeyboardEvent passes
          // through to the consumer's onItemClick handler.
          state.handleRowClick(current.item, current.level, event);
          return;
        }
        case "Delete":
        case "Backspace": {
          event.preventDefault();
          if (!current) return;
          // Move focus to the next row BEFORE removal so the user keeps a
          // sensible focus target. Fall back to previous if at the end.
          const nextFocus =
            visible[idx + 1]?.item.id ?? visible[idx - 1]?.item.id ?? null;
          state.removeItem(current.item.id);
          if (nextFocus) state.focusItem(nextFocus);
          return;
        }
        case "Escape": {
          event.preventDefault();
          state.clearSelection();
          return;
        }
      }
    },
    [state],
  );

  return { onKeyDown };
}
