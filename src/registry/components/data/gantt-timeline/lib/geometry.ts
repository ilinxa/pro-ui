/**
 * Effective-window + hierarchy math. Pure; framework-free.
 *
 * Deterministic resolution (locked in the procomp description §4):
 *   effectiveStart = startAt ?? setAt
 *   effectiveEnd   = expireAt ?? (duration != null ? start + duration : null)
 *   isMilestone    = effectiveEnd == null      → diamond at effectiveStart
 *   isOverdue      = end != null && end < now && tone !== "done"
 */

import type { GanttBarGeometry, GanttStatusTone, TaskItem } from "../types";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a TaskItem ISO date value. A bare calendar date (`YYYY-MM-DD`, no `T`)
 * is the family's all-day form and parses as a FLOATING LOCAL date — NOT via
 * `Date.parse`, which per spec reads "2026-06-22" as UTC midnight and renders
 * the bar a day early in negative-UTC offsets (family convention; matches
 * event-calendar's `parseDateValue`). Full timestamps go through `Date.parse`
 * unchanged. Returns NaN for missing/unparseable input.
 */
export function parseGanttDate(value: string | undefined): number {
  if (!value) return NaN;
  if (DATE_ONLY_RE.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  return Date.parse(value);
}

/** True for the family's bare `YYYY-MM-DD` all-day form. */
export function isGanttDateOnly(value: string | undefined): boolean {
  return typeof value === "string" && DATE_ONLY_RE.test(value);
}

/**
 * Serialize an epoch-ms instant back to a stored field whose ORIGINAL value
 * may have been date-only. When the original was `YYYY-MM-DD` AND the instant
 * still sits on a floating-local midnight (a whole-day move), the date-only
 * form is representable — keep it, so an edit never silently converts an
 * all-day value into a UTC timestamp. Anything else serializes as full ISO.
 */
export function serializeGanttDate(ms: number, original: string | undefined): string {
  if (original !== undefined && DATE_ONLY_RE.test(original)) {
    const d = new Date(ms);
    if (
      d.getHours() === 0 &&
      d.getMinutes() === 0 &&
      d.getSeconds() === 0 &&
      d.getMilliseconds() === 0
    ) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
  }
  return new Date(ms).toISOString();
}

export function effStartMs(item: TaskItem): number {
  return parseGanttDate(item.startAt ?? item.setAt);
}

export function effEndMs(item: TaskItem): number | null {
  if (item.expireAt) return parseGanttDate(item.expireAt);
  if (item.duration != null) return effStartMs(item) + item.duration;
  return null;
}

export function geometryFor(
  item: TaskItem,
  nowMs: number,
  tone: GanttStatusTone,
): GanttBarGeometry {
  const startMs = effStartMs(item);
  const endMs = effEndMs(item);
  const isMilestone = endMs == null;
  const isOverdue = endMs != null && endMs < nowMs && tone !== "done";
  return { startMs, endMs, isMilestone, isOverdue };
}

/**
 * Summary span for a parent = min(descendant starts) → max(descendant ends),
 * treating a milestone descendant as a point. Returns null for a leaf.
 */
export function summarySpan(
  item: TaskItem,
): { startMs: number; endMs: number } | null {
  if (!item.children || item.children.length === 0) return null;
  let start = Infinity;
  let end = -Infinity;
  const walk = (n: TaskItem) => {
    const s = effStartMs(n);
    const e = effEndMs(n) ?? s; // milestone → point
    if (s < start) start = s;
    if (e > end) end = e;
    n.children?.forEach(walk);
  };
  item.children.forEach(walk);
  if (start === Infinity) return null;
  return { startMs: start, endMs: end };
}

/** Min start / max end across the whole forest (milestones as points). */
export function dataExtent(data: TaskItem[]): { startMs: number; endMs: number } {
  let start = Infinity;
  let end = -Infinity;
  const walk = (n: TaskItem) => {
    const s = effStartMs(n);
    const e = effEndMs(n) ?? s;
    if (Number.isFinite(s) && s < start) start = s;
    if (Number.isFinite(e) && e > end) end = e;
    n.children?.forEach(walk);
  };
  data.forEach(walk);
  if (start === Infinity || end === -Infinity) {
    // Empty / unparseable — a neutral one-month window keeps the axis sane.
    const base = 0;
    return { startMs: base, endMs: base + 30 * 86_400_000 };
  }
  if (start === end) {
    // Single instant — pad to a day so a bar/diamond has room.
    return { startMs: start - 43_200_000, endMs: end + 43_200_000 };
  }
  return { startMs: start, endMs: end };
}
