"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import type { DragOverState } from "../parts/file-tree-row-list";
import type {
  FileTreeDropPosition,
  FileTreeMoveArgs,
  FileTreeRow,
  FsNode,
} from "../types";
import { isLegalDrop } from "../lib/validation";
import { indexNodes } from "../lib/tree-utils";

const INTERNAL_MIME = "application/x-ilinxa-file-tree";

interface UseTreeDragArgs {
  nodes: FsNode[];
  enableInternalDrag: boolean;
  enableExternalDrop: boolean;
  selectedIds: ReadonlySet<string>;
  selectionMode: "single" | "multi";
  onMove?: (args: FileTreeMoveArgs) => void;
  onExternalDrop?: (args: { files: File[]; targetId: string | null }) => void;
  /** Replace selection with a single id (used at drag-start when source isn't selected). */
  selectIds: (idOrIds: string | string[]) => void;
}

export interface UseTreeDragResult {
  dragOver: DragOverState | null;
  isExternalDragging: boolean;
  isInternalDragging: boolean;
  // Row-level handlers
  onRowDragStart: (e: DragEvent, row: FileTreeRow) => void;
  onRowDragOver: (e: DragEvent, row: FileTreeRow) => void;
  onRowDragLeave: (e: DragEvent, row: FileTreeRow) => void;
  onRowDrop: (e: DragEvent, row: FileTreeRow) => void;
  onRowDragEnd: (e: DragEvent, row: FileTreeRow) => void;
  // Container-level handlers (root + scroll area)
  onContainerDragEnter: (e: DragEvent) => void;
  onContainerDragOver: (e: DragEvent) => void;
  onContainerDragLeave: (e: DragEvent) => void;
  onContainerDrop: (e: DragEvent) => void;
  /** Map of `clientY` → scroll-direction; only active during drag near edges. */
  startAutoScroll: (
    container: HTMLElement | null,
    clientY: number,
  ) => void;
  stopAutoScroll: () => void;
}

const AUTO_SCROLL_EDGE_PX = 24;
const AUTO_SCROLL_PX_PER_FRAME = 4;

export function useTreeDrag(args: UseTreeDragArgs): UseTreeDragResult {
  const {
    nodes,
    enableInternalDrag,
    enableExternalDrop,
    selectedIds,
    selectionMode,
    onMove,
    onExternalDrop,
    selectIds,
  } = args;

  const [dragOver, setDragOver] = useState<DragOverState | null>(null);
  const [isExternalDragging, setIsExternalDragging] = useState(false);
  const isInternalDraggingRef = useRef(false);
  const [isInternalDragging, setIsInternalDragging] = useState(false);
  const nodeIndex = useMemo(() => indexNodes(nodes), [nodes]);
  // Track external-drag enter/leave with a refcount (events fire per nested element)
  const externalEnterCountRef = useRef(0);
  const dragSourceIdsRef = useRef<string[]>([]);
  const autoScrollRef = useRef<{
    container: HTMLElement | null;
    direction: number;
    raf: number | null;
  }>({ container: null, direction: 0, raf: null });

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

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAutoScroll();
  }, [stopAutoScroll]);

  const computePosition = (
    e: DragEvent,
    row: FileTreeRow,
  ): FileTreeDropPosition => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;
    if (row.node.type === "folder") {
      // three zones
      if (y < h * 0.25) return "before";
      if (y > h * 0.75) return "after";
      return "inside";
    }
    // file: two zones
    return y < h * 0.5 ? "before" : "after";
  };

  const onRowDragStart = useCallback(
    (e: DragEvent, row: FileTreeRow) => {
      if (!enableInternalDrag) return;
      // Ensure dragged node is part of selection. If it's already in
      // multi-select, drag the whole selection. Otherwise replace selection.
      let ids: string[];
      if (selectionMode === "multi" && selectedIds.has(row.node.id)) {
        ids = Array.from(selectedIds);
      } else {
        ids = [row.node.id];
        selectIds(row.node.id);
      }
      dragSourceIdsRef.current = ids;
      isInternalDraggingRef.current = true;
      setIsInternalDragging(true);
      try {
        e.dataTransfer.effectAllowed = "move";
        // Write a sentinel value so we can recognize own drag in dragenter
        e.dataTransfer.setData(INTERNAL_MIME, "1");
      } catch {
        // some envs throw on synthetic events
      }
    },
    [enableInternalDrag, selectionMode, selectedIds, selectIds],
  );

  const onRowDragEnd = useCallback(() => {
    isInternalDraggingRef.current = false;
    setIsInternalDragging(false);
    dragSourceIdsRef.current = [];
    setDragOver(null);
    stopAutoScroll();
  }, [stopAutoScroll]);

  const onRowDragOver = useCallback(
    (e: DragEvent, row: FileTreeRow) => {
      // External-drag is handled by container handlers; row-level is internal-only.
      if (!isInternalDraggingRef.current) return;
      e.preventDefault();
      const position = computePosition(e, row);
      // For position 'before'/'after', cycle check uses target's parent
      const idx = nodeIndex;
      const valid = isLegalDrop({
        srcIds: dragSourceIdsRef.current,
        targetId: row.node.id,
        position,
        index: idx,
      });
      e.dataTransfer.dropEffect = valid ? "move" : "none";
      setDragOver({ rowId: row.node.id, position, valid });
      // auto-scroll near edges
      const scroller = (e.currentTarget as HTMLElement).closest(
        "[data-file-tree-scroller]",
      ) as HTMLElement | null;
      startAutoScroll(scroller, e.clientY);
    },
    [nodeIndex, startAutoScroll],
  );

  const onRowDragLeave = useCallback(
    (_e: DragEvent, row: FileTreeRow) => {
      // Only clear if leaving the current target
      setDragOver((prev) => (prev?.rowId === row.node.id ? null : prev));
    },
    [],
  );

  const onRowDrop = useCallback(
    (e: DragEvent, row: FileTreeRow) => {
      if (!isInternalDraggingRef.current) return;
      e.preventDefault();
      const position = computePosition(e, row);
      const idx = nodeIndex;
      const ids = dragSourceIdsRef.current;
      const valid = isLegalDrop({
        srcIds: ids,
        targetId: row.node.id,
        position,
        index: idx,
      });
      if (valid && onMove) {
        const targetId =
          position === "inside" ? row.node.id : (row.node.parentId ?? null);
        onMove({ ids, targetId, position });
      }
      setDragOver(null);
      stopAutoScroll();
      isInternalDraggingRef.current = false;
      setIsInternalDragging(false);
      dragSourceIdsRef.current = [];
    },
    [nodeIndex, onMove, stopAutoScroll],
  );

  // ── External-drop (OS files) handlers on the container ────────────────────

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
      if (!enableExternalDrop) return;
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [enableExternalDrop],
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
      if (!enableExternalDrop) return;
      if (!hasFiles(e)) return;
      e.preventDefault();
      externalEnterCountRef.current = 0;
      setIsExternalDragging(false);
      const target = e.target as HTMLElement | null;
      const rowEl = target?.closest("[data-row-id]") as HTMLElement | null;
      const rowId = rowEl?.getAttribute("data-row-id") ?? null;
      const idx = nodeIndex;
      let targetId: string | null = null;
      if (rowId) {
        const node = idx.get(rowId);
        if (node) {
          targetId = node.type === "folder" ? rowId : (node.parentId ?? null);
        }
      }
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length > 0) {
        onExternalDrop?.({ files, targetId });
      }
    },
    [enableExternalDrop, nodeIndex, onExternalDrop],
  );

  return {
    dragOver,
    isExternalDragging,
    isInternalDragging,
    onRowDragStart,
    onRowDragOver,
    onRowDragLeave,
    onRowDrop,
    onRowDragEnd,
    onContainerDragEnter,
    onContainerDragOver,
    onContainerDragLeave,
    onContainerDrop,
    startAutoScroll,
    stopAutoScroll,
  };
}
