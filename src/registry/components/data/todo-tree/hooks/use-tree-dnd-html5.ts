"use client";

import { useCallback } from "react";
import type { DragEvent as ReactDragEvent } from "react";
import type { TodoItem } from "../../todo-rich-card/types";
import type { TodoTreeAction } from "../types";
import { findItemById } from "./../lib/tree-walker";
import {
  TODO_TREE_MIME,
  parseFromDataTransfer,
  serializeForDataTransfer,
} from "../lib/dnd-payload";

export interface UseTreeDndHtml5Args {
  /** Live items snapshot — needed to detect same-tree drops (which become noops). */
  items: TodoItem[];
  dispatch: (action: TodoTreeAction) => void;
  fireDropped?: (args: {
    item: TodoItem;
    from: "internal" | "external";
    targetParentId: string | null;
    targetIndex: number;
  }) => void;
  fireAdded?: (args: {
    item: TodoItem;
    parentId: string | null;
    index: number;
    via: "imperative" | "drop-from-external";
  }) => void;
  isInternalDragRef: React.MutableRefObject<boolean>;
}

export interface RowDragHandlers {
  draggable: boolean;
  onDragStart: (e: ReactDragEvent<HTMLDivElement>) => void;
  onDragOver: (e: ReactDragEvent<HTMLDivElement>) => void;
  onDrop: (e: ReactDragEvent<HTMLDivElement>) => void;
}

export interface UseTreeDndHtml5Result {
  /** Factory: per-row HTML5 drag handler set. */
  getRowHandlers: (item: TodoItem) => RowDragHandlers;
}

/**
 * Native HTML5 dataTransfer drag wiring for cross-procomp drags between
 * todo-tree and todo-rich-card (or any procomp that speaks the shared
 * `application/x-ilinxa-todo+json` MIME).
 *
 * Each row is BOTH source AND target:
 *   - As source: dragstart serializes the item; bails if the grip already
 *     activated @dnd-kit drag (`isInternalDragRef.current === true`).
 *   - As target: dragover preventDefault when the MIME matches so the
 *     browser allows the drop; drop parses the payload and dispatches
 *     ADD_ITEM as a child of the over row.
 *
 * For v0.1, external HTML5 drops always land as the LAST child of the over
 * row (middle-zone semantics). Edge-zone HTML5 drops (top/bottom sibling)
 * are a future refinement — the v0.1 contract is "internal drag = full
 * top/middle/bottom zones; external drag = always reparent."
 */
export function useTreeDndHtml5(
  args: UseTreeDndHtml5Args,
): UseTreeDndHtml5Result {
  const { items, dispatch, fireDropped, fireAdded, isInternalDragRef } = args;

  const getRowHandlers = useCallback(
    (item: TodoItem): RowDragHandlers => ({
      draggable: true,
      onDragStart: (e) => {
        if (isInternalDragRef.current) {
          // @dnd-kit drag took over via the grip; suppress native drag so
          // the browser doesn't fire a ghost-image alongside the overlay.
          e.preventDefault();
          return;
        }
        try {
          const payload = serializeForDataTransfer(item);
          e.dataTransfer.setData(TODO_TREE_MIME, payload);
          e.dataTransfer.setData("text/plain", payload);
          e.dataTransfer.effectAllowed = "copy";
        } catch {
          // setData can throw in restricted contexts (sandboxed iframes);
          // swallow — the drag will simply fail to populate the payload.
        }
      },
      onDragOver: (e) => {
        if (!e.dataTransfer.types.includes(TODO_TREE_MIME)) return;
        if (isInternalDragRef.current) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      },
      onDrop: (e) => {
        if (isInternalDragRef.current) return;
        const parsed = parseFromDataTransfer(e.dataTransfer);
        if (!parsed) return;
        if (parsed.id === item.id) return; // self-drop noop
        // Same-tree native drop (rare — typically the grip routes through
        // @dnd-kit, not native HTML5). Skip silently to avoid creating a
        // duplicate row; internal moves come through MOVE_ITEM, not
        // ADD_ITEM. External drops are detected by parsed.id NOT existing
        // in our items.
        if (findItemById(items, parsed.id)) return;
        e.preventDefault();
        const targetParentId = item.id;
        const targetIndex = item.children?.length ?? 0;
        dispatch({
          type: "ADD_ITEM",
          item: parsed,
          parentId: targetParentId,
          index: targetIndex,
          via: "drop-from-external",
        });
        fireAdded?.({
          item: parsed,
          parentId: targetParentId,
          index: targetIndex,
          via: "drop-from-external",
        });
        fireDropped?.({
          item: parsed,
          from: "external",
          targetParentId,
          targetIndex,
        });
      },
    }),
    [items, dispatch, fireAdded, fireDropped, isInternalDragRef],
  );

  return { getRowHandlers };
}
