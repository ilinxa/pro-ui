"use client";

/**
 * React context for tree-wide config consumed by parts/*.
 * Provider is constructed in task-card.tsx; this file owns the symbol +
 * the typed consumer hook.
 */

import { createContext, useContext } from "react";
import type { TaskCardContextValue } from "../types";

export const TaskCardContext = createContext<TaskCardContextValue | null>(null);

export function useCardContext(): TaskCardContextValue {
  const ctx = useContext(TaskCardContext);
  if (!ctx) {
    throw new Error(
      "useCardContext must be used inside <TaskCard>; missing provider.",
    );
  }
  return ctx;
}
