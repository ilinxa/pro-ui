"use client";

import { createContext, useContext } from "react";
import type {
  DragEvent as ReactDragEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import type { TodoItem, TodoStatusOption } from "../../todo-rich-card/types";
import type {
  TodoTreeEmptyRenderArgs,
  TodoTreeFieldRenderArgs,
  TodoTreeRowRenderArgs,
  TodoTreeStateValue,
  TodoTreeStatusRenderArgs,
} from "../types";
import type { EdgeZone } from "../lib/edge-zone";

/**
 * State context — populated by the host `<TodoTree>` so parts/ can read the
 * live state value (visibleItems, selectedIds, etc.) and dispatch actions
 * without re-walking the reducer's effective state. Separate from the
 * render-config context (slot props, indentSize, statusOptions) that lives
 * alongside parts/ in C4 — keeping state pure here lets the headless
 * useTodoTreeState() consumer pass a state ref to other surfaces.
 */
export const TodoTreeStateContext = createContext<TodoTreeStateValue | null>(
  null,
);

/**
 * Read the state context. Throws when called outside `<TodoTree>` because
 * parts/ relying on this context cannot function without it — a silent null
 * would mask the bug.
 */
export function useTodoTreeStateContext(): TodoTreeStateValue {
  const ctx = useContext(TodoTreeStateContext);
  if (ctx === null) {
    throw new Error(
      "useTodoTreeStateContext must be called inside <TodoTree>. " +
        "If composing parts/* manually, wrap them in <TodoTreeStateContext.Provider value={state}>.",
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
 * props from `<TodoTreeRow>` down to the leaves, NOT through this context,
 * to keep the leaves trivially testable.
 */
export interface TodoTreeRenderContextValue {
  /** Default "dot"; "strip" renders a left-edge color strip; "none" hides. */
  statusIndicator: "dot" | "strip" | "none";
  /** Memoized lookup map; empty when the consumer passes no statusOptions. */
  statusOptionMap: ReadonlyMap<string, TodoStatusOption>;
  /** Pixels per nesting level. */
  indentSize: number;
  // Slot overrides — undefined => use the default leaf paint.
  renderRow?: (args: TodoTreeRowRenderArgs) => ReactNode;
  renderName?: (args: TodoTreeFieldRenderArgs) => ReactNode;
  renderDescription?: (args: TodoTreeFieldRenderArgs) => ReactNode;
  renderPerson?: (args: TodoTreeFieldRenderArgs) => ReactNode;
  renderStatusIndicator?: (args: TodoTreeStatusRenderArgs) => ReactNode;
  renderEmptyState?: (args: TodoTreeEmptyRenderArgs) => ReactNode;
}

export const TodoTreeRenderContext =
  createContext<TodoTreeRenderContextValue | null>(null);

export function useTodoTreeRenderContext(): TodoTreeRenderContextValue {
  const ctx = useContext(TodoTreeRenderContext);
  if (ctx === null) {
    throw new Error(
      "useTodoTreeRenderContext must be called inside <TodoTree>. " +
        "If composing parts/* manually, wrap them in <TodoTreeRenderContext.Provider value={config}>.",
    );
  }
  return ctx;
}

/**
 * DnD context — drag-time state surfaced to rows so they can decorate
 * themselves (drop indicator visual + dragging-source dimming) without
 * needing to subscribe to the @dnd-kit store directly.
 */
export interface TodoTreeDndContextValue {
  activeItemId: string | null;
  overId: string | null;
  overZone: EdgeZone | null;
  /** True when the over zone would form a cycle; row should suppress the indicator. */
  overCircular: boolean;
  /** Click handler for plain / cmd / shift row click. */
  handleRowClick: (
    item: TodoItem,
    level: number,
    event: ReactMouseEvent,
  ) => void;
  /** Native HTML5 drag handlers; spread onto the row's outer div. */
  getRowHandlers: (item: TodoItem) => {
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
export const TodoTreeDndContext =
  createContext<TodoTreeDndContextValue | null>(null);

export function useTodoTreeDndContext(): TodoTreeDndContextValue | null {
  return useContext(TodoTreeDndContext);
}
