"use client";

import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar-context";

/**
 * Jump-to-date mini month (Tier B), built on the shadcn `calendar` primitive
 * (react-day-picker). The ONLY place the date-picker is used — the main grids
 * are bespoke.
 */
export function CalendarMiniNav({ className }: { className?: string }) {
  const { focusDate, goToDate, weekStartsOn } = useCalendar();
  return (
    <Calendar
      mode="single"
      selected={focusDate}
      month={focusDate}
      onMonthChange={goToDate}
      onSelect={(d) => {
        if (d) goToDate(d);
      }}
      weekStartsOn={weekStartsOn}
      className={cn("shrink-0", className)}
    />
  );
}
