"use client";

import { createContext, useContext } from "react";
import type { TodoTreeStateValue } from "../types";

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
