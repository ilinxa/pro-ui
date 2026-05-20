"use client";

/**
 * React context for tree-wide config consumed by parts/*.
 * Provider is constructed in todo-rich-card.tsx; this file owns the symbol +
 * the typed consumer hook.
 */

import { createContext, useContext } from "react";
import type { TodoCardContextValue } from "../types";

export const TodoCardContext = createContext<TodoCardContextValue | null>(null);

export function useCardContext(): TodoCardContextValue {
  const ctx = useContext(TodoCardContext);
  if (!ctx) {
    throw new Error(
      "useCardContext must be used inside <TodoRichCard>; missing provider.",
    );
  }
  return ctx;
}
