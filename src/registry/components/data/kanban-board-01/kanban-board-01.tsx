"use client";

import { useEffect, useMemo } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Board } from "./parts/board";
import { KanbanDragOverlay } from "./parts/drag-overlay";
import { useDragHandlers } from "./hooks/use-drag-handlers";
import { useKanbanState } from "./hooks/use-kanban-state";
import { useRendererMap } from "./hooks/use-renderer-map";
import { newColumnId, newItemId } from "./lib/ids";
import { DEFAULT_PALETTE } from "./lib/palette";
import { validateData } from "./lib/data";
import type {
  AnyKanbanCardRenderer,
  KanbanBoardProps,
  KanbanColumn,
  KanbanItem,
} from "./types";

export function KanbanBoard({
  renderers,
  data,
  defaultData,
  onChange,
  onItemCreate,
  onItemCreateArgs,
  onItemUpdate,
  onItemDelete,
  onColumnCreate,
  onColumnUpdate,
  onColumnDelete,
  onItemClick,
  onItemMove,
  onItemMoveArgs,
  palette,
  readOnly = false,
  "aria-label": ariaLabel = "Kanban board",
  className,
}: KanbanBoardProps) {
  const [state, dispatch] = useKanbanState({ data, defaultData, onChange });
  const rendererMap = useRendererMap(renderers);
  const palettePinned = useMemo(() => palette ?? DEFAULT_PALETTE, [palette]);

  // Resolve onItemCreate / onItemMove — prefer the object-shape `*Args`
  // versions (forward-compat). F-cross-12 transition; positional shapes
  // still work with dev-only console.warn. v0.2 will remove the positional
  // shapes and rename `*Args` → `*`.
  const resolvedOnItemCreate = onItemCreateArgs
    ? (columnId: string, item: KanbanItem) =>
        onItemCreateArgs({ columnId, item })
    : onItemCreate
      ? (() => {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "[kanban-board-01] `onItemCreate` positional signature `(columnId, item)` is @deprecated. Use `onItemCreateArgs({ columnId, item })`; v0.2 will remove the positional shape.",
            );
          }
          return onItemCreate;
        })()
      : undefined;

  const resolvedOnItemMove = onItemMoveArgs
    ? (
        item: KanbanItem,
        from: { columnId: string; swimlaneId?: string },
        to: { columnId: string; swimlaneId?: string },
      ) => onItemMoveArgs({ item, from, to })
    : onItemMove
      ? (() => {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "[kanban-board-01] `onItemMove` positional signature `(item, from, to)` is @deprecated. Use `onItemMoveArgs({ item, from, to })`; v0.2 will remove the positional shape.",
            );
          }
          return onItemMove;
        })()
      : undefined;

  // Mount-time validation (developer feedback only; doesn't block render).
  useEffect(() => {
    if (renderers.length === 0) {
      console.error(
        "[kanban-board-01] `renderers` prop is required and must contain at least one entry.",
      );
      return;
    }
    const result = validateData(state, renderers);
    if (!result.valid) {
      for (const err of result.errors) {
        console.warn(`[kanban-board-01] ${err}`);
      }
    }
    // Run once per session-equivalent — re-run if renderers change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderers]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const {
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    activeItem,
    activeRendererId,
  } = useDragHandlers({
    data: state,
    readOnly,
    dispatch,
    onItemMove: resolvedOnItemMove,
  });

  // Internal handlers translating UI events into reducer actions + consumer callbacks.
  function handleItemCreate(columnId: string, item: KanbanItem) {
    dispatch({ type: "create-item", columnId, item });
    resolvedOnItemCreate?.(columnId, item);
  }

  function handleItemUpdate(item: KanbanItem) {
    dispatch({ type: "update-item", item });
    onItemUpdate?.(item);
  }

  function handleItemDelete(itemId: string) {
    dispatch({ type: "delete-item", itemId });
    onItemDelete?.(itemId);
  }

  function handleColumnCreate(column: KanbanColumn) {
    dispatch({ type: "create-column", column });
    onColumnCreate?.(column);
  }

  function handleColumnUpdate(column: KanbanColumn) {
    dispatch({ type: "update-column", column });
    onColumnUpdate?.(column);
  }

  function handleColumnDelete(columnId: string) {
    dispatch({ type: "delete-column", columnId });
    onColumnDelete?.(columnId);
  }

  function handleSetColor(columnId: string, color: string | undefined) {
    dispatch({ type: "set-color", columnId, color });
  }

  function handleToggleCollapse(columnId: string) {
    dispatch({ type: "toggle-collapse", columnId });
  }

  if (renderers.length === 0) {
    return (
      <div
        role="region"
        aria-label={ariaLabel}
        className={cn(
          "flex h-full min-h-32 items-center justify-center rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive",
          className,
        )}
      >
        kanban-board-01 requires at least one renderer
      </div>
    );
  }

  // In readOnly mode, skip DnD wiring entirely.
  if (readOnly) {
    return (
      <div
        role="region"
        aria-label={ariaLabel}
        className={cn("relative flex h-full min-h-0 flex-col", className)}
      >
        <Board
          data={state}
          swimlanes={state.swimlanes}
          rendererMap={rendererMap}
          renderers={renderers}
          palette={palettePinned}
          readOnly
          activeRendererId={undefined}
          onItemClick={onItemClick}
          onSetColor={handleSetColor}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div
        role="region"
        aria-label={ariaLabel}
        className={cn("relative flex h-full min-h-0 flex-col", className)}
      >
        <Board
          data={state}
          swimlanes={state.swimlanes}
          rendererMap={rendererMap}
          renderers={renderers}
          palette={palettePinned}
          readOnly={false}
          activeRendererId={activeRendererId}
          onItemCreate={resolvedOnItemCreate ? handleItemCreate : undefined}
          onItemUpdate={onItemUpdate ? handleItemUpdate : undefined}
          onItemDelete={onItemDelete ? handleItemDelete : undefined}
          onItemClick={onItemClick}
          onColumnCreate={onColumnCreate ? handleColumnCreate : undefined}
          onColumnUpdate={onColumnUpdate ? handleColumnUpdate : undefined}
          onColumnDelete={onColumnDelete ? handleColumnDelete : undefined}
          onSetColor={handleSetColor}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>
      <KanbanDragOverlay activeItem={activeItem} rendererMap={rendererMap} />
    </DndContext>
  );
}

// Public helper exported for advanced consumers writing custom inline editors.
export function findRenderer(
  renderers: AnyKanbanCardRenderer[],
  rendererId: string,
): AnyKanbanCardRenderer | undefined {
  return renderers.find((r) => r.id === rendererId);
}

// Re-export ID helpers for consumers building items / columns programmatically.
export { newItemId, newColumnId };
