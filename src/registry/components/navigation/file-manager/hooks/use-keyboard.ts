"use client";

import { useCallback, useRef } from "react";
import type { KeyboardEvent } from "react";
import type {
  FileManagerActions,
  FileManagerItem,
  FileManagerOpenArgs,
  FileManagerViewMode,
} from "../types";

interface UseKeyboardArgs {
  items: FileManagerItem[];
  focusedId: string | null;
  renamingId: string | null;
  selectedIds: ReadonlySet<string>;
  viewMode: FileManagerViewMode;
  /** Live ref to the current column count in grid mode (computed by content-pane). */
  columnsRef: React.MutableRefObject<number>;
  actions: FileManagerActions;
  onOpen?: (args: FileManagerOpenArgs) => void;
}

const SUPPRESS_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

export interface UseKeyboardResult {
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

export function useKeyboard(args: UseKeyboardArgs): UseKeyboardResult {
  const {
    items,
    focusedId,
    renamingId,
    selectedIds,
    viewMode,
    columnsRef,
    actions,
    onOpen,
  } = args;

  // Type-ahead state
  const typeAheadRef = useRef<{ prefix: string; timer: number | null }>({
    prefix: "",
    timer: null,
  });

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      if (target && SUPPRESS_TAGS.includes(target.tagName)) return;
      if (renamingId) return;

      const isMod = e.metaKey || e.ctrlKey;
      const idx = items.findIndex((item) => item.node.id === focusedId);
      const noFocus = idx === -1;
      const cols = Math.max(1, columnsRef.current || 1);

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (noFocus) {
            if (items[0]) actions.focusNode(items[0].node.id);
            return;
          }
          const step = viewMode === "grid" ? cols : 1;
          const next = Math.min(items.length - 1, idx + step);
          if (items[next]) actions.focusNode(items[next].node.id);
          return;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (noFocus) {
            if (items[0]) actions.focusNode(items[0].node.id);
            return;
          }
          const step = viewMode === "grid" ? cols : 1;
          const next = Math.max(0, idx - step);
          if (items[next]) actions.focusNode(items[next].node.id);
          return;
        }
        case "ArrowRight": {
          if (viewMode !== "grid") return;
          e.preventDefault();
          if (noFocus) {
            if (items[0]) actions.focusNode(items[0].node.id);
            return;
          }
          const next = Math.min(items.length - 1, idx + 1);
          if (items[next]) actions.focusNode(items[next].node.id);
          return;
        }
        case "ArrowLeft": {
          if (viewMode !== "grid") return;
          e.preventDefault();
          if (noFocus) {
            if (items[0]) actions.focusNode(items[0].node.id);
            return;
          }
          const next = Math.max(0, idx - 1);
          if (items[next]) actions.focusNode(items[next].node.id);
          return;
        }
        case "Home": {
          e.preventDefault();
          if (items[0]) actions.focusNode(items[0].node.id);
          return;
        }
        case "End": {
          e.preventDefault();
          const last = items[items.length - 1];
          if (last) actions.focusNode(last.node.id);
          return;
        }
        case "Enter": {
          if (noFocus) return;
          e.preventDefault();
          const item = items[idx];
          if (item.node.type === "folder") {
            actions.navigateTo(item.node.id);
          } else {
            onOpen?.({ node: item.node });
          }
          return;
        }
        case " ":
        case "Spacebar": {
          if (noFocus) return;
          e.preventDefault();
          actions.toggleSelection(items[idx].node.id);
          return;
        }
        case "F2": {
          if (noFocus) return;
          e.preventDefault();
          actions.startRename(items[idx].node.id);
          return;
        }
        case "Delete": {
          if (selectedIds.size === 0) return;
          e.preventDefault();
          actions.triggerDelete(Array.from(selectedIds));
          return;
        }
        case "Backspace": {
          if (selectedIds.size > 0) {
            e.preventDefault();
            actions.triggerDelete(Array.from(selectedIds));
          } else {
            e.preventDefault();
            actions.navigateUp();
          }
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
          if (!isMod) break;
          e.preventDefault();
          actions.selectAll();
          return;
        }
        case "x":
        case "X": {
          if (!isMod) break;
          if (selectedIds.size === 0) return;
          e.preventDefault();
          actions.cut(Array.from(selectedIds));
          return;
        }
        case "c":
        case "C": {
          if (!isMod) break;
          if (selectedIds.size === 0) return;
          e.preventDefault();
          actions.copy(Array.from(selectedIds));
          return;
        }
        case "v":
        case "V": {
          if (!isMod) break;
          e.preventDefault();
          actions.paste();
          return;
        }
        case "[": {
          if (!isMod) break;
          e.preventDefault();
          actions.navigateBack();
          return;
        }
        case "]": {
          if (!isMod) break;
          e.preventDefault();
          actions.navigateForward();
          return;
        }
      }

      // Type-ahead: a single printable character (no modifier)
      if (!isMod && e.key.length === 1 && /\S/.test(e.key)) {
        const ta = typeAheadRef.current;
        ta.prefix += e.key.toLowerCase();
        if (ta.timer !== null) window.clearTimeout(ta.timer);
        ta.timer = window.setTimeout(() => {
          ta.prefix = "";
          ta.timer = null;
        }, 800);
        const match = items.find((item) =>
          item.node.name.toLowerCase().startsWith(ta.prefix),
        );
        if (match) {
          e.preventDefault();
          actions.focusNode(match.node.id);
        }
      }
    },
    [
      items,
      focusedId,
      renamingId,
      selectedIds,
      viewMode,
      columnsRef,
      actions,
      onOpen,
    ],
  );

  return { onKeyDown };
}
