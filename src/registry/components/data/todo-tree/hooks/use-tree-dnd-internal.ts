"use client";

import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TodoItem } from "../../todo-rich-card/types";
import type {
  TodoTreeAction,
  TodoTreePermissionDeniedEvent,
  TreeLocation,
} from "../types";
import { findItemById, findParentId } from "../lib/tree-walker";
import { isAncestor } from "../lib/circular-drop";
import { computeEdgeZone, type EdgeZone } from "../lib/edge-zone";

export interface UseTreeDndInternalArgs {
  items: TodoItem[];
  dispatch: (action: TodoTreeAction) => void;
  fireMoved: (args: {
    item: TodoItem;
    from: TreeLocation;
    to: TreeLocation;
    via: "drag" | "imperative";
  }) => void;
  firePermissionDenied?: (args: TodoTreePermissionDeniedEvent) => void;
  isDraggingRef: React.MutableRefObject<boolean>;
  /** Mutual-exclusion gate; set by the grip's onDragStart, cleared on end. */
  isInternalDragRef: React.MutableRefObject<boolean>;
  /** Permission predicate for reparent target. Default allow. */
  canDropIntoChildren?: (targetId: string) => boolean;
  /** Permission predicate for sibling adjacency. Default allow. */
  canDropAsSibling?: (targetId: string) => boolean;
}

export interface TreeDndOverInfo {
  overId: string;
  zone: EdgeZone;
  /** True when the current pointer over the row would form a cycle. */
  circular: boolean;
}

export interface UseTreeDndInternalResult {
  sensors: ReturnType<typeof useSensors>;
  activeItem: TodoItem | null;
  activeLevel: number;
  over: TreeDndOverInfo | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: (event: DragCancelEvent) => void;
}

/**
 * @dnd-kit drag wiring for internal (within-tree) drags. The host mounts a
 * `<DndContext>` with these handlers + sensors; rows register as droppables
 * with id = item.id. Edge zone is computed from a globally tracked pointer
 * Y + the over rect's bounding box (the dragOver event doesn't carry the
 * current pointer, only the active's delta).
 *
 * Sensor split (Mouse + Touch separate, not unified Pointer) per L17 +
 * plan §6.1: mouse activates at 5px, touch needs 300ms long-press. Unified
 * PointerSensor can't deliver divergent activation timings.
 */
export function useTreeDndInternal(
  args: UseTreeDndInternalArgs,
): UseTreeDndInternalResult {
  const {
    items,
    dispatch,
    fireMoved,
    firePermissionDenied,
    isDraggingRef,
    isInternalDragRef,
    canDropIntoChildren,
    canDropAsSibling,
  } = args;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const [activeItem, setActiveItem] = useState<TodoItem | null>(null);
  const [activeLevel, setActiveLevel] = useState<number>(0);
  const [over, setOver] = useState<TreeDndOverInfo | null>(null);

  // Pointer tracker — @dnd-kit's onDragOver provides over.rect but not the
  // current pointer; install a global mousemove/touchmove listener while drag
  // is active to read the pointer position (viewport coords).
  const pointerYRef = useRef<number>(0);
  const pointerXRef = useRef<number>(0);

  // Keep activeItem + items reachable from the scroll/wheel listener without
  // re-subscribing on every change. Synced in an effect (refs must not be
  // written during render).
  const activeItemRef = useRef<TodoItem | null>(null);
  const itemsRef = useRef<TodoItem[]>(items);
  useEffect(() => {
    activeItemRef.current = activeItem;
    itemsRef.current = items;
  });

  // Recompute the over-target + zone from a pointer position, using
  // getBoundingClientRect (viewport coords, consistent with clientY). Shared by
  // the scroll/wheel handler so the indicator stays correct when the list
  // scrolls under a stationary pointer (TT7).
  const applyOverAt = useCallback((clientX: number, clientY: number) => {
    const active = activeItemRef.current;
    if (!active) return;
    const el = document.elementFromPoint(clientX, clientY);
    const rowEl = el?.closest<HTMLElement>("[data-todo-tree-row]");
    const targetId = rowEl?.getAttribute("data-todo-tree-row");
    if (!rowEl || !targetId || targetId === active.id) {
      setOver(null);
      return;
    }
    const rect = rowEl.getBoundingClientRect();
    const zone = computeEdgeZone(clientY, rect.top, rect.height);
    const circular =
      zone === "middle" && isAncestor(itemsRef.current, active.id, targetId);
    setOver({ overId: targetId, zone, circular });
  }, []);

  useEffect(() => {
    if (!activeItem) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      if ("clientY" in e) {
        pointerYRef.current = e.clientY;
        pointerXRef.current = e.clientX;
      } else if (e.touches && e.touches.length > 0) {
        pointerYRef.current = e.touches[0].clientY;
        pointerXRef.current = e.touches[0].clientX;
      }
    };
    // On scroll/wheel without pointer movement, a different row sits under the
    // stationary pointer — recompute from the cached pointer so the zone +
    // indicator don't go stale (TT7).
    const onScroll = () => applyOverAt(pointerXRef.current, pointerYRef.current);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("wheel", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("wheel", onScroll);
    };
  }, [activeItem, applyOverAt]);

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      const item = findItemById(items, id);
      if (!item) return;
      const level =
        typeof event.active.data.current?.level === "number"
          ? event.active.data.current.level
          : 0;
      setActiveItem(item);
      setActiveLevel(level);
      isDraggingRef.current = true;
      isInternalDragRef.current = true;
    },
    [items, isDraggingRef, isInternalDragRef],
  );

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      const overObj = event.over;
      if (!overObj || !activeItem) {
        setOver(null);
        return;
      }
      const targetId = String(overObj.id);
      if (targetId === activeItem.id) {
        setOver(null);
        return;
      }
      const rect = overObj.rect;
      const zone = computeEdgeZone(
        pointerYRef.current,
        rect.top,
        rect.height,
      );
      const circular =
        zone === "middle" && isAncestor(items, activeItem.id, targetId);
      setOver({ overId: targetId, zone, circular });
    },
    [activeItem, items],
  );

  const finishDrag = useCallback(() => {
    setActiveItem(null);
    setOver(null);
    isDraggingRef.current = false;
    isInternalDragRef.current = false;
  }, [isDraggingRef, isInternalDragRef]);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const src = activeItem;
      const overInfo = over;
      try {
        if (!src || !overInfo) return;
        const targetId = overInfo.overId;
        if (targetId === src.id) return;

        // Circular ban for reparent.
        if (overInfo.zone === "middle" && overInfo.circular) {
          firePermissionDenied?.({
            action: "dropIntoChildren",
            itemId: targetId,
            reason: "circular-drop",
          });
          return;
        }

        // Permission gates.
        if (
          overInfo.zone === "middle" &&
          canDropIntoChildren &&
          !canDropIntoChildren(targetId)
        ) {
          firePermissionDenied?.({
            action: "dropIntoChildren",
            itemId: targetId,
            reason: "denied-by-rule",
          });
          return;
        }
        if (
          overInfo.zone !== "middle" &&
          canDropAsSibling &&
          !canDropAsSibling(targetId)
        ) {
          firePermissionDenied?.({
            action: "dropAsSibling",
            itemId: targetId,
            reason: "denied-by-rule",
          });
          return;
        }

        // Resolve destination from edge zone.
        const fromParentId = findParentId(items, src.id);
        const fromIndex = siblingIndex(items, fromParentId, src.id);
        const toLoc = resolveDropLocation(items, targetId, overInfo.zone);
        if (!toLoc) return;

        dispatch({
          type: "MOVE_ITEM",
          itemId: src.id,
          to: toLoc,
          reason: overInfo.zone === "middle" ? "reparent" : "reorder",
        });
        fireMoved({
          item: src,
          from: { parentId: fromParentId, index: fromIndex },
          to: toLoc,
          via: "drag",
        });
      } finally {
        finishDrag();
      }
      // event is read above; silence unused-var lint via reference.
      void event;
    },
    [
      activeItem,
      over,
      items,
      dispatch,
      fireMoved,
      firePermissionDenied,
      canDropIntoChildren,
      canDropAsSibling,
      finishDrag,
    ],
  );

  const onDragCancel = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  return {
    sensors,
    activeItem,
    activeLevel,
    over,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
  };
}

function siblingIndex(
  items: ReadonlyArray<TodoItem>,
  parentId: string | null,
  id: string,
): number {
  if (parentId === null) return items.findIndex((i) => i.id === id);
  const parent = findItemById(items, parentId);
  if (!parent || !parent.children) return -1;
  return parent.children.findIndex((i) => i.id === id);
}

/**
 * Resolve the drop's TreeLocation from the over row + edge zone. Middle =
 * append-as-last-child of the target (auto-expand handled in the reducer).
 * Top/bottom = sibling adjacency relative to the target's parent.
 */
function resolveDropLocation(
  items: ReadonlyArray<TodoItem>,
  targetId: string,
  zone: EdgeZone,
): TreeLocation | null {
  if (zone === "middle") {
    const target = findItemById(items, targetId);
    if (!target) return null;
    const childCount = target.children?.length ?? 0;
    return { parentId: targetId, index: childCount };
  }
  const parentId = findParentId(items, targetId);
  const sibIdx = siblingIndex(items, parentId, targetId);
  if (sibIdx === -1) return null;
  return {
    parentId,
    index: zone === "top" ? sibIdx : sibIdx + 1,
  };
}
