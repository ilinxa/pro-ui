"use client";

import { useCallback, useState } from "react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { findItem } from "../lib/data";
import { canDrop } from "../lib/permissions";
import type { KanbanAction, KanbanData, KanbanItem } from "../types";

type Active =
  | { kind: "item"; item: KanbanItem }
  | { kind: "column"; columnId: string }
  | null;

export function useDragHandlers({
  data,
  readOnly,
  dispatch,
  onItemMove,
}: {
  data: KanbanData;
  readOnly: boolean;
  dispatch: (action: KanbanAction) => void;
  onItemMove?: (
    item: KanbanItem,
    from: { columnId: string; swimlaneId?: string },
    to: { columnId: string; swimlaneId?: string },
  ) => void;
}) {
  const [active, setActive] = useState<Active>(null);

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      if (readOnly) return;
      const activeData = event.active.data.current as
        | { kind: "item"; columnId: string; swimlaneId?: string; rendererId: string }
        | { kind: "column"; columnId: string }
        | undefined;
      if (!activeData) return;
      if (activeData.kind === "item") {
        const found = findItem(data, String(event.active.id));
        if (found) setActive({ kind: "item", item: found.item });
      } else if (activeData.kind === "column") {
        setActive({ kind: "column", columnId: activeData.columnId });
      }
    },
    [data, readOnly],
  );

  const onDragOver = useCallback(() => {
    // Visual rejection is handled inside SwimlaneCell via column.acceptsRendererIds + activeRendererId.
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active: a, over } = event;
      setActive(null);
      if (!over || readOnly) return;

      const activeData = a.data.current as
        | { kind: "item"; columnId: string; swimlaneId?: string; rendererId: string }
        | { kind: "column"; columnId: string }
        | undefined;
      const overData = over.data.current as
        | { kind: "item"; columnId: string; swimlaneId?: string; rendererId: string }
        | { kind: "cell"; columnId: string; swimlaneId?: string }
        | { kind: "collapsed-column"; columnId: string }
        | { kind: "column"; columnId: string }
        | undefined;
      if (!activeData || !overData) return;

      // ─── Column reorder ───
      if (activeData.kind === "column" && overData.kind === "column") {
        if (activeData.columnId === overData.columnId) return;
        const toIndex = data.columns.findIndex((c) => c.id === overData.columnId);
        if (toIndex < 0) return;
        dispatch({ type: "reorder-column", columnId: activeData.columnId, toIndex });
        return;
      }

      // ─── Item move ───
      if (activeData.kind !== "item") return;
      const itemId = String(a.id);
      const found = findItem(data, itemId);
      if (!found) return;

      let toColumnId: string | undefined;
      let toSwimlaneId: string | undefined;
      let toIndex = 0;

      if (overData.kind === "item") {
        const overFound = findItem(data, String(over.id));
        if (!overFound) return;
        toColumnId = overFound.columnId;
        toSwimlaneId = overData.swimlaneId;
        const targetCol = data.columns.find((c) => c.id === toColumnId);
        if (!targetCol) return;
        toIndex = targetCol.items.findIndex((it) => it.id === over.id);
        if (toIndex < 0) toIndex = targetCol.items.length;
      } else if (overData.kind === "cell" || overData.kind === "collapsed-column") {
        toColumnId = overData.columnId;
        toSwimlaneId = "swimlaneId" in overData ? overData.swimlaneId : undefined;
        const targetCol = data.columns.find((c) => c.id === toColumnId);
        if (!targetCol) return;
        toIndex = targetCol.items.length;
      } else {
        return;
      }

      const allowed = canDrop({
        data,
        itemId,
        fromColumnId: found.columnId,
        toColumnId,
        fromSwimlaneId: found.item.swimlaneId,
        toSwimlaneId,
        readOnly,
      });
      if (!allowed) return;

      // For same-column moves, adjust toIndex to handle the
      // active-before-over case correctly. When the active item sits before
      // the over item in the same column, removing the active first shifts
      // the over item's index down by 1; inserting at the original over
      // index would land the active *after* over, not at over's slot.
      if (toColumnId === found.columnId && found.index < toIndex) {
        toIndex = toIndex - 1;
      }

      // No-op when index doesn't actually change in the same column.
      if (
        toColumnId === found.columnId &&
        toIndex === found.index &&
        toSwimlaneId === found.item.swimlaneId
      ) {
        return;
      }

      // moveItem auto-expands collapsed target columns (locked contract baked
      // into the action so both controlled and uncontrolled modes apply it
      // atomically).
      dispatch({
        type: "move-item",
        itemId,
        toColumnId,
        toIndex,
        toSwimlaneId,
      });

      onItemMove?.(
        found.item,
        { columnId: found.columnId, swimlaneId: found.item.swimlaneId },
        { columnId: toColumnId, swimlaneId: toSwimlaneId },
      );
    },
    [data, dispatch, onItemMove, readOnly],
  );

  const onDragCancel = useCallback(() => {
    setActive(null);
  }, []);

  const activeItem = active?.kind === "item" ? active.item : null;
  const activeRendererId = active?.kind === "item" ? active.item.rendererId : undefined;

  return { onDragStart, onDragOver, onDragEnd, onDragCancel, activeItem, activeRendererId };
}
