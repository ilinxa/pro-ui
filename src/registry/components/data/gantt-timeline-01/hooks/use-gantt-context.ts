"use client";

import { createContext, useContext } from "react";
import type { GanttContextValue } from "../types";

export const GanttContext = createContext<GanttContextValue | null>(null);

/** Read the gantt context. Throws if used outside `<GanttTimelineRoot>`. */
export function useGanttTimeline(): GanttContextValue {
  const ctx = useContext(GanttContext);
  if (!ctx) {
    throw new Error("useGanttTimeline must be used within <GanttTimelineRoot>");
  }
  return ctx;
}
