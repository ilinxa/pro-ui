/**
 * Date parsing + the §7-D5 three-layer all-day/timed/milestone classification.
 * Pure; framework-free.
 */
import type { EventKind, TodoItem } from "../types";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

export type ParsedDate = {
  /** Epoch ms, or NaN if unparseable. */
  ms: number;
  /** True when the source was a bare YYYY-MM-DD (no time component). */
  dateOnly: boolean;
};

/**
 * Parse a TodoItem ISO date value. A bare calendar date (YYYY-MM-DD, no `T`)
 * is treated as an ALL-DAY, timezone-independent date and parsed as a FLOATING
 * LOCAL date — NOT via `Date.parse`, which per spec reads "2026-06-22" as UTC
 * midnight and renders a day early in negative-UTC offsets. Full timestamps go
 * through `Date.parse` unchanged (matching the rest of the family).
 */
export function parseDateValue(value: string | undefined): ParsedDate {
  if (!value) return { ms: NaN, dateOnly: false };
  if (DATE_ONLY_RE.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return { ms: new Date(y, m - 1, d).getTime(), dateOnly: true };
  }
  return { ms: Date.parse(value), dateOnly: false };
}

/** Effective start (floating-local for date-only). */
export function effectiveStart(item: TodoItem): ParsedDate {
  return parseDateValue(item.startAt ?? item.setAt);
}

/**
 * Effective end. `expireAt` wins; else `start + duration`; else null (no end).
 * `ms: NaN` signals an unparseable `expireAt`.
 */
export function effectiveEnd(
  item: TodoItem,
  startMs: number,
): { ms: number | null; dateOnly: boolean } {
  if (item.expireAt) {
    const p = parseDateValue(item.expireAt);
    return { ms: p.ms, dateOnly: p.dateOnly };
  }
  if (item.duration != null) {
    // Inherit the start's date-only-ness: a whole-day duration off a bare
    // YYYY-MM-DD is conceptually all-day, so the derived end keeps the flag (C3).
    return { ms: startMs + item.duration, dateOnly: effectiveStart(item).dateOnly };
  }
  return { ms: null, dateOnly: false };
}

/**
 * Three-layer rule, first match wins (§7-D5):
 *   1. consumer `classifyEvent` predicate (if it returns a kind)
 *   2. no end:  date-only start ⇒ all-day (a bare date = an all-day event);
 *               otherwise ⇒ milestone (a precise instant / deadline)
 *   3. date-only start or end ⇒ all-day (Google's mechanism)
 *   4. span ≥ 1 full day ⇒ all-day
 *   5. otherwise ⇒ timed
 */
export function classify(
  item: TodoItem,
  classifyEvent?: (item: TodoItem) => EventKind | undefined,
): EventKind {
  const override = classifyEvent?.(item);
  if (override) return override;

  const start = effectiveStart(item);
  const end = effectiveEnd(item, start.ms);

  if (end.ms == null) return start.dateOnly ? "all-day" : "milestone";
  if (start.dateOnly || end.dateOnly) return "all-day";

  const span = end.ms - start.ms;
  if (Number.isFinite(span) && span >= MS_PER_DAY) return "all-day";
  return "timed";
}
