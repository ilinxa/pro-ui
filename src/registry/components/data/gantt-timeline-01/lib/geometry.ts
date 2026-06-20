/**
 * Effective-window + hierarchy math. Pure; framework-free.
 *
 * Deterministic resolution (locked in the procomp description §4):
 *   effectiveStart = startAt ?? setAt
 *   effectiveEnd   = expireAt ?? (duration != null ? start + duration : null)
 *   isMilestone    = effectiveEnd == null      → diamond at effectiveStart
 *   isOverdue      = end != null && end < now && tone !== "done"
 */

import type { GanttBarGeometry, GanttStatusTone, TodoItem } from "../types";

export function effStartMs(item: TodoItem): number {
  return Date.parse(item.startAt ?? item.setAt);
}

export function effEndMs(item: TodoItem): number | null {
  if (item.expireAt) return Date.parse(item.expireAt);
  if (item.duration != null) return effStartMs(item) + item.duration;
  return null;
}

export function geometryFor(
  item: TodoItem,
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
  item: TodoItem,
): { startMs: number; endMs: number } | null {
  if (!item.children || item.children.length === 0) return null;
  let start = Infinity;
  let end = -Infinity;
  const walk = (n: TodoItem) => {
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
export function dataExtent(data: TodoItem[]): { startMs: number; endMs: number } {
  let start = Infinity;
  let end = -Infinity;
  const walk = (n: TodoItem) => {
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
