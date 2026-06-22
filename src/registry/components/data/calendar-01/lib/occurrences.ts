/**
 * TodoItem[] → CalendarOccurrence[] — the single normalization pass.
 * Pure; framework-free. Flattens `children` (every dated item renders; no WBS
 * rollup — D10), computes the effective window with finite guards (never a NaN
 * geometry / `toISOString` throw — gantt v0.3.1 G2 lesson), classifies, and
 * resolves color via the shared engine.
 */
import { classify, effectiveEnd, effectiveStart } from "./classify";
import { eventColor, resolveRamp, toneFor } from "./color";
import type {
  CalendarOccurrence,
  EventKind,
  TodoColorRamp,
  TodoItem,
  TodoStatusOption,
} from "../types";

export type OccurrenceContext = {
  nowMs: number;
  classifyEvent?: (item: TodoItem) => EventKind | undefined;
  statusOptions?: TodoStatusOption[];
  colorRamp?: TodoColorRamp;
};

export function toOccurrences(
  data: TodoItem[],
  ctx: OccurrenceContext,
): CalendarOccurrence[] {
  const ramp = resolveRamp(ctx.colorRamp);
  const out: CalendarOccurrence[] = [];

  const walk = (item: TodoItem) => {
    const kind = classify(item, ctx.classifyEvent);
    const start = effectiveStart(item);
    const end = effectiveEnd(item, start.ms);

    const startMs = start.ms;
    const rawEnd = end.ms == null ? startMs : end.ms; // no end ⇒ point
    const invalid =
      !Number.isFinite(startMs) || (end.ms != null && !Number.isFinite(end.ms));

    // Finite guard: never emit a NaN geometry.
    let endMs = Number.isFinite(rawEnd) ? rawEnd : startMs;
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs < startMs) {
      endMs = startMs;
    }

    const tone = toneFor(item, ctx.statusOptions);
    const overdue =
      Number.isFinite(endMs) && endMs < ctx.nowMs && tone !== "done";
    const color = eventColor(item, tone, startMs, endMs, ctx.nowMs, ramp);

    out.push({
      item,
      id: item.id,
      kind,
      startMs,
      endMs,
      allDay: kind !== "timed",
      tone,
      color,
      overdue,
      inactive: item.active === false,
      invalid: invalid || undefined,
    });

    item.children?.forEach(walk);
  };

  data.forEach(walk);
  return out;
}

/** Occurrences whose covered span intersects [startMs, endMs). */
export function occurrencesInRange(
  occ: CalendarOccurrence[],
  startMs: number,
  endMs: number,
): CalendarOccurrence[] {
  return occ.filter(
    (o) => !o.invalid && o.endMs >= startMs && o.startMs < endMs,
  );
}
