/**
 * Month-grid layout — pure. Lays a week's occurrences into horizontal lanes:
 * multi-day events become spanning bar segments (clipped per week row, with
 * continuation flags), single-day events occupy one column. Overflow past the
 * lane cap becomes a per-day "+N more" count.
 */
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import type { CalendarOccurrence } from "../types";

/**
 * First/last covered calendar day (local). All-day end is EXCLUSIVE at local
 * midnight (iCal / Google semantics): an event 00:00 Mon → 00:00 Wed covers
 * Mon + Tue.
 */
export function coveredDays(occ: CalendarOccurrence): {
  firstMs: number;
  lastMs: number;
} {
  const first = startOfDay(occ.startMs).getTime();
  let lastDay = startOfDay(occ.endMs);
  if (occ.endMs === lastDay.getTime() && lastDay.getTime() > first) {
    lastDay = addDays(lastDay, -1); // exclusive midnight end
  }
  return { firstMs: first, lastMs: Math.max(first, lastDay.getTime()) };
}

export type MonthSegment = {
  occ: CalendarOccurrence;
  lane: number;
  startCol: number; // 0..6 within the week
  endCol: number; // 0..6
  continuesLeft: boolean; // clipped at the week's left edge
  continuesRight: boolean; // clipped at the week's right edge
  spanning: boolean; // endCol > startCol → bar, else chip
};

export type MonthWeekLayout = {
  segments: MonthSegment[]; // lane < cap
  overflow: number[]; // hidden-count per day-column (length 7)
  laneCount: number; // lanes actually rendered (≤ cap)
};

/**
 * Lay a run of `startOfDay` dates into ≤ `cap` lanes. Used by the month grid
 * (7-day weeks) AND the week/day all-day band (1–7 columns) — hence generalized
 * to `weekDays.length` rather than a hardcoded 7 (F-03).
 */
export function layoutMonthWeek(
  weekDays: Date[],
  occurrences: CalendarOccurrence[],
  cap: number,
): MonthWeekLayout {
  const lastCol = weekDays.length - 1;
  const weekStart = startOfDay(weekDays[0]).getTime();
  const weekEnd = startOfDay(weekDays[lastCol]).getTime();

  type Placed = { occ: CalendarOccurrence; startCol: number; endCol: number };
  const placed: Placed[] = [];
  for (const occ of occurrences) {
    if (occ.invalid) continue;
    const { firstMs, lastMs } = coveredDays(occ);
    if (lastMs < weekStart || firstMs > weekEnd) continue;
    const startCol = Math.max(
      0,
      differenceInCalendarDays(new Date(Math.max(firstMs, weekStart)), weekDays[0]),
    );
    const endCol = Math.min(
      lastCol,
      differenceInCalendarDays(new Date(Math.min(lastMs, weekEnd)), weekDays[0]),
    );
    placed.push({ occ, startCol, endCol });
  }

  // All-day / multi-day first (earlier start, then longer span), timed after.
  placed.sort((a, b) => {
    const am = a.occ.allDay ? 0 : 1;
    const bm = b.occ.allDay ? 0 : 1;
    if (am !== bm) return am - bm;
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    return b.endCol - b.startCol - (a.endCol - a.startCol);
  });

  const laneOccupancy: boolean[][] = []; // [lane][col]
  const overflow = new Array(weekDays.length).fill(0);
  const segments: MonthSegment[] = [];
  let laneCount = 0;

  for (const p of placed) {
    let lane = 0;
    for (;;) {
      if (!laneOccupancy[lane])
        laneOccupancy[lane] = new Array(weekDays.length).fill(false);
      let free = true;
      for (let c = p.startCol; c <= p.endCol; c++) {
        if (laneOccupancy[lane][c]) {
          free = false;
          break;
        }
      }
      if (free) break;
      lane++;
    }
    for (let c = p.startCol; c <= p.endCol; c++) laneOccupancy[lane][c] = true;

    if (lane >= cap) {
      for (let c = p.startCol; c <= p.endCol; c++) overflow[c]++;
      continue;
    }
    laneCount = Math.max(laneCount, lane + 1);
    const { firstMs, lastMs } = coveredDays(p.occ);
    segments.push({
      occ: p.occ,
      lane,
      startCol: p.startCol,
      endCol: p.endCol,
      continuesLeft: firstMs < weekStart,
      continuesRight: lastMs > weekEnd,
      spanning: p.endCol > p.startCol,
    });
  }

  return { segments, overflow, laneCount };
}

/** Every occurrence covering a given day (for the "+N more" popover list). */
export function occurrencesOnDay(
  occ: CalendarOccurrence[],
  day: Date,
): CalendarOccurrence[] {
  const dayStart = startOfDay(day).getTime();
  return occ.filter((o) => {
    if (o.invalid) return false;
    const { firstMs, lastMs } = coveredDays(o);
    return dayStart >= firstMs && dayStart <= lastMs;
  });
}
