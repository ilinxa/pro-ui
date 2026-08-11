"use client";

import { createContext, useContext } from "react";
import type { CalendarBaseContextValue } from "../types";

export const CalendarContext = createContext<CalendarBaseContextValue | null>(
  null,
);

/** Read the base (read-only) calendar context. Throws if used outside
 *  `<EventCalendarRoot>`. For the edit surface, see the editing feature's
 *  `useCalendarEditOptional()` / `useCalendarEditContext()`. */
export function useCalendar(): CalendarBaseContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error("useCalendar must be used within <EventCalendarRoot>");
  }
  return ctx;
}
