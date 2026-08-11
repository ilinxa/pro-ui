"use client";

import { createContext, useContext } from "react";
import type { CalendarContextValue } from "../types";

export const CalendarContext = createContext<CalendarContextValue | null>(null);

/** Read the calendar context. Throws if used outside `<EventCalendarRoot>`. */
export function useCalendar(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error("useCalendar must be used within <EventCalendarRoot>");
  }
  return ctx;
}
