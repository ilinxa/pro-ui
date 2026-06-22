"use client";

import { useCalendar } from "../hooks/use-calendar-context";
import { weekColumns } from "../lib/date-range";
import { TimeGrid } from "./calendar-time-grid";

/** Week view (Tier B) — the 7-day time-grid. */
export function CalendarWeekView({ className }: { className?: string }) {
  const { focusDate, weekStartsOn } = useCalendar();
  return <TimeGrid columns={weekColumns(focusDate, weekStartsOn)} className={className} />;
}
