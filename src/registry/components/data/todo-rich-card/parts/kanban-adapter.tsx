"use client";

/**
 * Kanban-board renderer adapter (plan Q-P6).
 *
 * Exposes `todoRichCardKanbanRenderer`: a `KanbanCardRenderer<TodoItem>` that
 * `kanban-board-01` can register and use as the body for each card slot.
 *
 * `dragHandle: "shell"` (v0.3): the whole card is the drag activator. The rich
 * card normally marks its root `draggable` (HTML5 DnD, for copy/move payload +
 * nested drop), which would hijack the kanban PointerSensor gesture — so the
 * adapter passes `canDragItem={() => false}` to disable the root `draggable`
 * while embedded, letting the two DnD systems coexist. The board's
 * `activationConstraint: { distance: 5 }` keeps a click on an inner control
 * (status, edit, switch) from becoming a drag, and the inline editor stops
 * pointer propagation so text selection in a field doesn't drag the card.
 *
 * Trade-off: with the root drag disabled, subtasks can't be reordered by native
 * DnD *inside a kanban column* — acceptable since the kanban owns movement
 * there; the standalone (list) card keeps its internal DnD.
 *
 * NOTE: this adapter renders a SINGLE TodoRichCard per kanban item. The item's
 * own `children` still recurse internally — kanban "items" are not the same
 * as todo "children." Consumers wiring deep nesting into kanban columns should
 * flatten to one level at the kanban level and keep the depth inside each
 * card.
 */

import { TodoRichCard } from "../todo-rich-card";
import type { TodoItem } from "../types";

/**
 * Minimal structural mirror of `kanban-board-01`'s `KanbanCardRenderer<TData>`.
 * Declared inline to avoid a hard cross-procomp import (consumers wiring this
 * adapter into kanban-board-01 will get full type checking through that
 * procomp's own re-exported type).
 */
type KanbanRenderContext = {
  itemId: string;
  columnId: string;
  swimlaneId?: string;
  isDragging: boolean;
  isLocked: boolean;
  /** Persist an in-place edit back to the board (kanban-board-01 v0.4+). */
  onDataChange?: (nextData: unknown) => void;
};

type KanbanCardRenderer<TData> = {
  id: string;
  label: string;
  render: (data: TData, ctx: KanbanRenderContext) => React.ReactNode;
  newItem?: () => TData;
  editForm?: (
    data: TData,
    onSave: (next: TData) => void,
    onCancel: () => void,
  ) => React.ReactNode;
  dragHandle?: "shell" | "header";
};

export const todoRichCardKanbanRenderer: KanbanCardRenderer<TodoItem> = {
  id: "todo-rich-card",
  label: "Todo (rich)",
  dragHandle: "shell",
  // Controlled: the board's item data is the source of truth. Edits flow back
  // via onChange → ctx.onDataChange so they persist; a locked item is read-only;
  // `key` resets card state when the board swaps the item in this slot.
  // `canDragItem={() => false}` disables the card's own root `draggable` so it
  // can't hijack the board's pointer drag (see file header).
  render: (data, ctx) => (
    <TodoRichCard
      key={ctx.itemId}
      value={data}
      editable={!ctx.isLocked}
      canDragItem={() => false}
      onChange={(next) => ctx.onDataChange?.(next)}
    />
  ),
  newItem: () => ({
    id: `todo-${Date.now().toString(36)}`,
    name: "New task",
    status: "todo",
    active: true,
    setAt: new Date().toISOString(),
  }),
};
