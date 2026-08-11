"use client";

import { createContext, useContext } from "react";
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import type { TaskItem, TaskStatusOption } from "../../task-card/types";
import type {
  TaskTreeEmptyRenderArgs,
  TaskTreeFieldRenderArgs,
  TaskTreeRowRenderArgs,
  TaskTreeStateValue,
  TaskTreeStatusRenderArgs,
} from "../types";
import type { EdgeZone } from "../lib/edge-zone";

/**
 * State context — populated by the host `<TaskTree>` so parts/ can read the
 * live state value (visibleItems, selectedIds, etc.) and dispatch actions
 * without re-walking the reducer's effective state. Separate from the
 * render-config context (slot props, indentSize, statusOptions) that lives
 * alongside parts/ in C4 — keeping state pure here lets the headless
 * useTaskTreeState() consumer pass a state ref to other surfaces.
 */
export const TaskTreeStateContext = createContext<TaskTreeStateValue | null>(
  null,
);

/**
 * Read the state context. Throws when called outside `<TaskTree>` because
 * parts/ relying on this context cannot function without it — a silent null
 * would mask the bug.
 */
export function useTaskTreeStateContext(): TaskTreeStateValue {
  const ctx = useContext(TaskTreeStateContext);
  if (ctx === null) {
    throw new Error(
      "useTaskTreeStateContext must be called inside <TaskTree>. " +
        "If composing parts/* manually, wrap them in <TaskTreeStateContext.Provider value={state}>.",
    );
  }
  return ctx;
}

/**
 * Render-config context — display config + slot overrides shared by parts/.
 * Kept separate from the state context so headless consumers can drive their
 * own render layer without inheriting the default chrome's config.
 *
 * Interactive callbacks (onToggleActive, onRowClick, etc.) are passed as
 * props from `<TaskTreeRow>` down to the leaves, NOT through this context,
 * to keep the leaves trivially testable.
 */
export interface TaskTreeRenderContextValue {
  /** Default "dot"; "strip" renders a left-edge color strip; "none" hides. */
  statusIndicator: "dot" | "strip" | "none";
  /** Memoized lookup map; empty when the consumer passes no statusOptions. */
  statusOptionMap: ReadonlyMap<string, TaskStatusOption>;
  /** Pixels per nesting level. */
  indentSize: number;
  // Slot overrides — undefined => use the default leaf paint.
  renderRow?: (args: TaskTreeRowRenderArgs) => ReactNode;
  renderName?: (args: TaskTreeFieldRenderArgs) => ReactNode;
  renderDescription?: (args: TaskTreeFieldRenderArgs) => ReactNode;
  renderPerson?: (args: TaskTreeFieldRenderArgs) => ReactNode;
  renderStatusIndicator?: (args: TaskTreeStatusRenderArgs) => ReactNode;
  renderEmptyState?: (args: TaskTreeEmptyRenderArgs) => ReactNode;
}

export const TaskTreeRenderContext =
  createContext<TaskTreeRenderContextValue | null>(null);

export function useTaskTreeRenderContext(): TaskTreeRenderContextValue {
  const ctx = useContext(TaskTreeRenderContext);
  if (ctx === null) {
    throw new Error(
      "useTaskTreeRenderContext must be called inside <TaskTree>. " +
        "If composing parts/* manually, wrap them in <TaskTreeRenderContext.Provider value={config}>.",
    );
  }
  return ctx;
}

/**
 * DnD context — drag-time state surfaced to rows so they can decorate
 * themselves (drop indicator visual + dragging-source dimming) without
 * needing to subscribe to the @dnd-kit store directly.
 */
export interface TaskTreeDndContextValue {
  activeItemId: string | null;
  overId: string | null;
  overZone: EdgeZone | null;
  /** True when the over zone would form a cycle; row should suppress the indicator. */
  overCircular: boolean;
  /** Click handler for plain / cmd / shift row click. */
  handleRowClick: (
    item: TaskItem,
    level: number,
    event: ReactMouseEvent,
  ) => void;
  /** Native HTML5 drag handlers; spread onto the row's outer div. */
  getRowHandlers: (item: TaskItem) => {
    draggable: boolean;
    onDragStart: (e: ReactDragEvent<HTMLDivElement>) => void;
    onDragOver: (e: ReactDragEvent<HTMLDivElement>) => void;
    onDrop: (e: ReactDragEvent<HTMLDivElement>) => void;
  };
}

/**
 * `null` value indicates DnD is not mounted in this tree (e.g.,
 * `dndContext="external"` is set AND the consumer's outer DndContext
 * doesn't expose its over state to us). Rows degrade gracefully — no
 * drop indicator, no row-click handler.
 */
export const TaskTreeDndContext =
  createContext<TaskTreeDndContextValue | null>(null);

export function useTaskTreeDndContext(): TaskTreeDndContextValue | null {
  return useContext(TaskTreeDndContext);
}
