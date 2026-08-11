"use client";

import { startOfDay } from "date-fns";
import { useCalendar } from "../hooks/use-calendar-context";
import { TimeGrid } from "./calendar-time-grid";

/** Day view (Tier B) — the single-column time-grid. */
export function CalendarDayView({ className }: { className?: string }) {
  const { focusDate } = useCalendar();
  return <TimeGrid columns={[startOfDay(focusDate)]} className={className} />;
}
