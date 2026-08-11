/**
 * Paste-target resolution — extracted from the pre-split `calendar-root.tsx`
 * (features-editing split, v0.3). Pure; framework-free.
 */
import { startOfDay } from "date-fns";
import { parseDateValue } from "../../../lib/classify";
import type { CalendarOccurrence, CalendarView, TaskItem } from "../../../types";

/** Duration (ms) of a task from its dates; 0 when it has no real span. */
export function itemDurationMs(it: TaskItem): number {
  const startMs = parseDateValue(it.startAt ?? it.setAt).ms;
  const endMs = it.expireAt ? parseDateValue(it.expireAt).ms : NaN;
  return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
    ? endMs - startMs
    : 0;
}

/**
 * Where a paste lands. The TARGET decides all-day vs timed (so paste also
 * converts): a focused day-cell → that day, all-day; a focused event → its
 * day + all-day-ness; otherwise the current focus date (timed in week/day at
 * `scrollToHour`, else all-day). Duration is carried from the copied item.
 */
export function resolvePasteWindow(
  items: TaskItem[],
  opts: {
    activeEl: Element | null;
    occurrences: CalendarOccurrence[];
    view: CalendarView;
    focusDate: Date;
    scrollToHour: number;
  },
): { startMs: number; endMs?: number; allDay: boolean } {
  const { activeEl, occurrences, view, focusDate, scrollToHour } = opts;
  const dur = itemDurationMs(items[0]);
  const dayEl = activeEl?.closest?.("[data-day-ms]") as HTMLElement | null;
  if (dayEl) {
    const startMs = Number(dayEl.getAttribute("data-day-ms"));
    return { startMs, endMs: dur > 0 ? startMs + dur : undefined, allDay: true };
  }
  const occEl = activeEl?.closest?.("[data-occ-id]") as HTMLElement | null;
  if (occEl) {
    const occ = occurrences.find(
      (o) => o.id === occEl.getAttribute("data-occ-id"),
    );
    if (occ) {
      const span = occ.endMs > occ.startMs ? occ.endMs - occ.startMs : 0;
      const length = dur > 0 ? dur : span;
      return {
        startMs: occ.startMs,
        endMs: length > 0 ? occ.startMs + length : undefined,
        allDay: occ.allDay,
      };
    }
  }
  const base = startOfDay(focusDate).getTime();
  if (view === "week" || view === "day") {
    const startMs = base + Math.max(0, Math.min(23, scrollToHour)) * 3_600_000;
    return {
      startMs,
      endMs: dur > 0 ? startMs + dur : startMs + 3_600_000,
      allDay: false,
    };
  }
  return { startMs: base, endMs: dur > 0 ? base + dur : undefined, allDay: true };
}
