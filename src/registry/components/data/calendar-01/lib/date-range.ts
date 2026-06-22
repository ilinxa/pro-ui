/**
 * Calendar date math — pure, framework-free, all via date-fns (DST-correct by
 * construction). Maps the cursor (view + focus date) to the visible range and
 * the per-view day grids.
 */
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarView, WeekStart } from "../types";

/** The inclusive-start / exclusive-ish-end window the active view covers. */
export function visibleRange(
  view: CalendarView,
  focusDate: Date,
  weekStartsOn: WeekStart,
  agendaRangeDays: number,
): { start: Date; end: Date } {
  switch (view) {
    case "month": {
      return {
        start: startOfWeek(startOfMonth(focusDate), { weekStartsOn }),
        end: endOfWeek(endOfMonth(focusDate), { weekStartsOn }),
      };
    }
    case "week": {
      return {
        start: startOfWeek(focusDate, { weekStartsOn }),
        end: endOfWeek(focusDate, { weekStartsOn }),
      };
    }
    case "day": {
      const s = startOfDay(focusDate);
      return { start: s, end: addDays(s, 1) };
    }
    case "agenda": {
      const s = startOfDay(focusDate);
      return { start: s, end: addDays(s, Math.max(1, agendaRangeDays)) };
    }
  }
}

/** Full weeks (5–6 rows × 7 days) covering the focus month. */
export function monthGrid(focusDate: Date, weekStartsOn: WeekStart): Date[][] {
  const { start, end } = visibleRange("month", focusDate, weekStartsOn, 0);
  const days = eachDayOfInterval({ start, end });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

/** The 7 day columns of the focus week. */
export function weekColumns(focusDate: Date, weekStartsOn: WeekStart): Date[] {
  const s = startOfWeek(focusDate, { weekStartsOn });
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}

/** The consecutive days an agenda window spans (for day grouping). */
export function agendaDays(focusDate: Date, agendaRangeDays: number): Date[] {
  const s = startOfDay(focusDate);
  return Array.from({ length: Math.max(1, agendaRangeDays) }, (_, i) =>
    addDays(s, i),
  );
}

/** Step the focus date by one view-relative period. `dir` = +1 / −1. */
export function stepDate(
  view: CalendarView,
  focusDate: Date,
  dir: number,
  agendaRangeDays: number,
): Date {
  switch (view) {
    case "month":
      return addMonths(focusDate, dir);
    case "week":
      return addWeeks(focusDate, dir);
    case "day":
      return addDays(focusDate, dir);
    case "agenda":
      return addDays(focusDate, dir * Math.max(1, agendaRangeDays));
  }
}

/** 0..23 — the hour rows of a time-grid. */
export const HOURS: number[] = Array.from({ length: 24 }, (_, h) => h);
