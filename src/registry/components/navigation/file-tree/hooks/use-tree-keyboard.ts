"use client";

import { useCallback } from "react";
import type { KeyboardEvent } from "react";
import type {
  FileTreeActions,
  FileTreeOpenArgs,
  FileTreeRow,
  FileTreeSelectionMode,
} from "../types";

interface UseTreeKeyboardArgs {
  rows: FileTreeRow[];
  focusedId: string | null;
  renamingId: string | null;
  selectionMode: FileTreeSelectionMode;
  selectedIds: ReadonlySet<string>;
  actions: FileTreeActions;
  onOpen?: (args: FileTreeOpenArgs) => void;
}

export interface UseTreeKeyboardResult {
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

const META_KEYS = ["INPUT", "TEXTAREA", "SELECT"];

export function useTreeKeyboard(
  args: UseTreeKeyboardArgs,
): UseTreeKeyboardResult {
  const {
    rows,
    focusedId,
    renamingId,
    selectionMode,
    selectedIds,
    actions,
    onOpen,
  } = args;

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // If user is typing in the rename input or any other text field, bail.
      const target = e.target as HTMLElement | null;
      if (target && META_KEYS.includes(target.tagName)) return;
      // If a rename is active anywhere, the rename input intercepts its own keys.
      // Anything else here just passes through.
      if (renamingId) return;

      const isMod = e.metaKey || e.ctrlKey;

      // Find current row index by focusedId
      const idx = rows.findIndex((r) => r.node.id === focusedId);
      const noFocus = idx === -1;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = noFocus ? 0 : Math.min(rows.length - 1, idx + 1);
          if (rows[next]) actions.focusNode(rows[next].node.id);
          return;
        }
        case "ArrowUp": {
          e.preventDefault();
          const next = noFocus ? 0 : Math.max(0, idx - 1);
          if (rows[next]) actions.focusNode(rows[next].node.id);
          return;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (noFocus) {
            if (rows[0]) actions.focusNode(rows[0].node.id);
            return;
          }
          const row = rows[idx];
          if (row.node.type === "folder" && row.hasChildren) {
            if (row.expanded) {
              // move to first child
              const childRow = rows[idx + 1];
              if (childRow && childRow.depth > row.depth) {
                actions.focusNode(childRow.node.id);
              }
            } else {
              actions.expand(row.node.id);
            }
          }
          return;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (noFocus) {
            if (rows[0]) actions.focusNode(rows[0].node.id);
            return;
          }
          const row = rows[idx];
          if (row.node.type === "folder" && row.expanded) {
            actions.collapse(row.node.id);
          } else {
            // move to parent
            for (let i = idx - 1; i >= 0; i--) {
              if (rows[i].depth < row.depth) {
                actions.focusNode(rows[i].node.id);
                break;
              }
            }
          }
          return;
        }
        case "Home": {
          e.preventDefault();
          if (rows[0]) actions.focusNode(rows[0].node.id);
          return;
        }
        case "End": {
          e.preventDefault();
          const last = rows[rows.length - 1];
          if (last) actions.focusNode(last.node.id);
          return;
        }
        case "Enter": {
          if (noFocus) return;
          e.preventDefault();
          const row = rows[idx];
          if (row.node.type === "folder") {
            actions.toggleExpand(row.node.id);
          } else {
            onOpen?.({ node: row.node });
          }
          return;
        }
        case " ": // Space
        case "Spacebar": {
          if (noFocus) return;
          e.preventDefault();
          const row = rows[idx];
          if (selectionMode === "multi") {
            const next = new Set(selectedIds);
            if (next.has(row.node.id)) next.delete(row.node.id);
            else next.add(row.node.id);
            actions.select(Array.from(next));
          } else {
            actions.select(row.node.id);
          }
          return;
        }
        case "F2": {
          if (noFocus) return;
          e.preventDefault();
          actions.startRename(rows[idx].node.id);
          return;
        }
        case "Delete":
        case "Backspace": {
          if (selectedIds.size === 0) return;
          e.preventDefault();
          actions.triggerDelete(Array.from(selectedIds));
          return;
        }
        case "Escape": {
          if (selectedIds.size > 0) {
            e.preventDefault();
            actions.clearSelection();
          }
          return;
        }
        case "a":
        case "A": {
          if (!isMod) return;
          if (selectionMode !== "multi") return;
          e.preventDefault();
          actions.select(rows.map((r) => r.node.id));
          return;
        }
        default:
          return;
      }
    },
    [rows, focusedId, renamingId, selectionMode, selectedIds, actions, onOpen],
  );

  return { onKeyDown };
}
