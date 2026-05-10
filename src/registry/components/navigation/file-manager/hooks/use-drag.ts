"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import type {
  FileManagerDropPosition,
  FileManagerExternalDropArgs,
  FileManagerItem,
  FileManagerMoveArgs,
  FsNode,
} from "../types";
import { isLegalDrop } from "../lib/validation";
import { indexNodes } from "../lib/tree-utils";

/** Same MIME marker file-tree uses — enables cross-component drops. */
const INTERNAL_MIME = "application/x-ilinxa-file-tree";

const AUTO_SCROLL_EDGE_PX = 24;
const AUTO_SCROLL_PX_PER_FRAME = 4;

export interface DragOverState {
  /** Item id currently being hovered as a drop target. `null` = container. */
  itemId: string | null;
  valid: boolean;
}

interface UseDragArgs {
  nodes: FsNode[];
  currentFolderId: string | null;
  enableInternalDrag: boolean;
  enableExternalDrop: boolean;
  selectedIds: ReadonlySet<string>;
  onMove?: (args: FileManagerMoveArgs) => void;
  onExternalDrop?: (args: FileManagerExternalDropArgs) => void;
  /** Replace selection with a single id (used at drag-start when source isn't selected). */
  selectIds: (idOrIds: string | string[]) => void;
}

export interface UseDragResult {
  dragOver: DragOverState | null;
  isExternalDragging: boolean;
  isInternalDragging: boolean;
  // Item-level handlers
  onItemDragStart: (e: DragEvent, item: FileManagerItem) => void;
  onItemDragOver: (e: DragEvent, item: FileManagerItem) => void;
  onItemDragLeave: (e: DragEvent, item: FileManagerItem) => void;
  onItemDrop: (e: DragEvent, item: FileManagerItem) => void;
  onItemDragEnd: (e: DragEvent, item: FileManagerItem) => void;
  // Container handlers (scroll area)
  onContainerDragEnter: (e: DragEvent) => void;
  onContainerDragOver: (e: DragEvent) => void;
  onContainerDragLeave: (e: DragEvent) => void;
  onContainerDrop: (e: DragEvent) => void;
}

export function useDrag(args: UseDragArgs): UseDragResult {
  const {
    nodes,
    currentFolderId,
    enableInternalDrag,
    enableExternalDrop,
    selectedIds,
    onMove,
    onExternalDrop,
    selectIds,
  } = args;

  const [dragOver, setDragOver] = useState<DragOverState | null>(null);
  const [isExternalDragging, setIsExternalDragging] = useState(false);
  const [isInternalDragging, setIsInternalDragging] = useState(false);
  const isInternalDraggingRef = useRef(false);
  const externalEnterCountRef = useRef(0);
  const dragSourceIdsRef = useRef<string[]>([]);
  const autoScrollRef = useRef<{
    container: HTMLElement | null;
    direction: number;
    raf: number | null;
  }>({ container: null, direction: 0, raf: null });

  const nodeIndex = useMemo(() => indexNodes(nodes), [nodes]);

  const stopAutoScroll = useCallback(() => {
    const ref = autoScrollRef.current;
    if (ref.raf !== null) {
      cancelAnimationFrame(ref.raf);
      ref.raf = null;
    }
    ref.direction = 0;
    ref.container = null;
  }, []);

  const startAutoScroll = useCallback(
    (container: HTMLElement | null, clientY: number) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let dir = 0;
      if (clientY - rect.top < AUTO_SCROLL_EDGE_PX) dir = -1;
      else if (rect.bottom - clientY < AUTO_SCROLL_EDGE_PX) dir = 1;
      const ref = autoScrollRef.current;
      ref.container = container;
      if (dir !== ref.direction) {
        ref.direction = dir;
        if (ref.raf !== null) {
          cancelAnimationFrame(ref.raf);
          ref.raf = null;
        }
        if (dir !== 0) {
          const tick = () => {
            const r = autoScrollRef.current;
            if (r.container && r.direction !== 0) {
              r.container.scrollTop +=
                r.direction * AUTO_SCROLL_PX_PER_FRAME;
              r.raf = requestAnimationFrame(tick);
            } else {
              r.raf = null;
            }
          };
          ref.raf = requestAnimationFrame(tick);
        }
      }
    },
    [],
  );

  useEffect(() => {
    return () => stopAutoScroll();
  }, [stopAutoScroll]);

  const onItemDragStart = useCallback(
    (e: DragEvent, item: FileManagerItem) => {
      if (!enableInternalDrag) return;
      let ids: string[];
      if (selectedIds.has(item.node.id) && selectedIds.size > 1) {
        ids = Array.from(selectedIds);
      } else {
        ids = [item.node.id];
        selectIds(item.node.id);
      }
      dragSourceIdsRef.current = ids;
      isInternalDraggingRef.current = true;
      setIsInternalDragging(true);
      try {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(INTERNAL_MIME, "1");
      } catch {
        /* ignored */
      }
    },
    [enableInternalDrag, selectedIds, selectIds],
  );

  const onItemDragEnd = useCallback(() => {
    isInternalDraggingRef.current = false;
    setIsInternalDragging(false);
    dragSourceIdsRef.current = [];
    setDragOver(null);
    stopAutoScroll();
  }, [stopAutoScroll]);

  const onItemDragOver = useCallback(
    (e: DragEvent, item: FileManagerItem) => {
      if (!isInternalDraggingRef.current) return;
      e.preventDefault();
      // Drops are only legal on folders
      const validTarget = item.node.type === "folder";
      const position: FileManagerDropPosition = "inside";
      const valid =
        validTarget &&
        isLegalDrop({
          srcIds: dragSourceIdsRef.current,
          targetId: item.node.id,
          position,
          index: nodeIndex,
        });
      e.dataTransfer.dropEffect = valid ? "move" : "none";
      setDragOver({ itemId: item.node.id, valid });
      const scroller = (e.currentTarget as HTMLElement).closest(
        "[data-file-manager-scroller]",
      ) as HTMLElement | null;
      startAutoScroll(scroller, e.clientY);
    },
    [nodeIndex, startAutoScroll],
  );

  const onItemDragLeave = useCallback(
    (_e: DragEvent, item: FileManagerItem) => {
      setDragOver((prev) =>
        prev?.itemId === item.node.id ? null : prev,
      );
    },
    [],
  );

  const onItemDrop = useCallback(
    (e: DragEvent, item: FileManagerItem) => {
      if (!isInternalDraggingRef.current) return;
      e.preventDefault();
      const validTarget = item.node.type === "folder";
      const ids = dragSourceIdsRef.current;
      if (!validTarget) {
        // rejected
        setDragOver(null);
        stopAutoScroll();
        isInternalDraggingRef.current = false;
        setIsInternalDragging(false);
        dragSourceIdsRef.current = [];
        return;
      }
      const valid = isLegalDrop({
        srcIds: ids,
        targetId: item.node.id,
        position: "inside",
        index: nodeIndex,
      });
      if (valid && onMove) {
        onMove({ ids, targetId: item.node.id, position: "inside" });
      }
      setDragOver(null);
      stopAutoScroll();
      isInternalDraggingRef.current = false;
      setIsInternalDragging(false);
      dragSourceIdsRef.current = [];
    },
    [nodeIndex, onMove, stopAutoScroll],
  );

  // Container-level (whitespace) handlers
  const hasFiles = (e: DragEvent) =>
    Array.from(e.dataTransfer.types).includes("Files");

  const onContainerDragEnter = useCallback(
    (e: DragEvent) => {
      if (!enableExternalDrop) return;
      if (!hasFiles(e)) return;
      externalEnterCountRef.current += 1;
      setIsExternalDragging(true);
    },
    [enableExternalDrop],
  );

  const onContainerDragOver = useCallback(
    (e: DragEvent) => {
      if (enableExternalDrop && hasFiles(e)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      } else if (isInternalDraggingRef.current) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "none"; // dropping on whitespace internal = no-op
        setDragOver(null);
        // auto-scroll if near edges
        const scroller = e.currentTarget as HTMLElement;
        startAutoScroll(scroller, e.clientY);
      }
    },
    [enableExternalDrop, startAutoScroll],
  );

  const onContainerDragLeave = useCallback(
    (e: DragEvent) => {
      if (!enableExternalDrop) return;
      if (!hasFiles(e)) return;
      externalEnterCountRef.current = Math.max(
        0,
        externalEnterCountRef.current - 1,
      );
      if (externalEnterCountRef.current === 0) {
        setIsExternalDragging(false);
      }
    },
    [enableExternalDrop],
  );

  const onContainerDrop = useCallback(
    (e: DragEvent) => {
      if (enableExternalDrop && hasFiles(e)) {
        e.preventDefault();
        externalEnterCountRef.current = 0;
        setIsExternalDragging(false);
        const target = e.target as HTMLElement | null;
        const itemEl = target?.closest("[data-item-id]") as
          | HTMLElement
          | null;
        const itemId = itemEl?.getAttribute("data-item-id") ?? null;
        let targetFolderId: string | null = currentFolderId;
        if (itemId) {
          const node = nodeIndex.get(itemId);
          if (node?.type === "folder") targetFolderId = itemId;
        }
        const files = Array.from(e.dataTransfer.files ?? []);
        if (files.length > 0) {
          onExternalDrop?.({ files, targetFolderId });
        }
        return;
      }
      // Internal drag onto whitespace = no-op
      if (isInternalDraggingRef.current) {
        e.preventDefault();
        isInternalDraggingRef.current = false;
        setIsInternalDragging(false);
        dragSourceIdsRef.current = [];
        setDragOver(null);
        stopAutoScroll();
      }
    },
    [
      enableExternalDrop,
      currentFolderId,
      nodeIndex,
      onExternalDrop,
      stopAutoScroll,
    ],
  );

  return {
    dragOver,
    isExternalDragging,
    isInternalDragging,
    onItemDragStart,
    onItemDragOver,
    onItemDragLeave,
    onItemDrop,
    onItemDragEnd,
    onContainerDragEnter,
    onContainerDragOver,
    onContainerDragLeave,
    onContainerDrop,
  };
}
