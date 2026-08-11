/**
 * Pure forest mutations over `TaskItem[]` — the editing layer (v0.2.0).
 *
 * The array analogue of task-card's reducer mutations and the date-grid
 * sibling of gantt's `lib/edit-mutations.ts`: every function returns a NEW forest
 * with structural sharing and NEVER mutates in place, so the controlled consumer
 * can diff/echo and stack undo for free. Framework-free; Vitest-ready. Hierarchy
 * is nested `children` (no parentId on TaskItem), so the index here is what
 * callers use to locate a splice point.
 *
 * Calendar-specific delta vs gantt: `setWindow` is **all-day aware**. Where gantt
 * always serializes via `new Date(ms).toISOString()`, the calendar must write a
 * bare `YYYY-MM-DD` (from LOCAL fields) for all-day items so the value round-trips
 * through `classify.ts`'s floating-local `parseDateValue` without the UTC
 * off-by-one. `formatDateValue` is the inverse of `parseDateValue`.
 */

import type { CalendarSnap, TaskItem } from "../types";
import { parseDateValue } from "./classify";

/** Minimum timed span (ms) so a resize/drag can't collapse a block to zero. */
export const MIN_DURATION_MS = 60_000;

/** Snap increment (ms) for a `CalendarSnap`. `"off"` → 0 (no snap). */
export function snapStepMs(snap: CalendarSnap): number {
  if (typeof snap === "number") return Math.max(0, snap);
  switch (snap) {
    case "off":
      return 0;
    case "minute":
      return 60_000;
    case "5min":
      return 300_000;
    case "15min":
      return 900_000;
    case "30min":
      return 1_800_000;
    case "hour":
      return 3_600_000;
    case "day":
      return 86_400_000;
    default:
      return 900_000; // "15min" fallback
  }
}

/** Round `ms` to the nearest `step` relative to `originMs` (e.g. the day start). */
export function snapToStep(ms: number, originMs: number, step: number): number {
  if (step <= 0 || !Number.isFinite(ms)) return ms;
  return originMs + Math.round((ms - originMs) / step) * step;
}

/**
 * Inverse of `classify.ts`'s `parseDateValue`:
 *   - all-day  → bare `YYYY-MM-DD` built from LOCAL Y/M/D (NEVER `toISOString`,
 *                which is UTC and renders a day early in negative-UTC offsets).
 *   - timed    → full ISO timestamp.
 * Returns "" for a non-finite ms so callers never emit `new Date(NaN).toISOString()`.
 */
export function formatDateValue(ms: number, allDay: boolean): string {
  if (!Number.isFinite(ms)) return "";
  if (allDay) {
    const d = new Date(ms);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  return new Date(ms).toISOString();
}

export type ForestNodeInfo = {
  item: TaskItem;
  parentId: string | null;
  index: number;
  /** 1 = root. */
  level: number;
};

/** Flat `id → { item, parentId, index, level }` over the whole forest. */
export function buildIndex(data: TaskItem[]): Map<string, ForestNodeInfo> {
  const map = new Map<string, ForestNodeInfo>();
  const walk = (items: TaskItem[], parentId: string | null, level: number) => {
    items.forEach((item, index) => {
      map.set(item.id, { item, parentId, index, level });
      if (item.children?.length) walk(item.children, item.id, level + 1);
    });
  };
  walk(data, null, 1);
  return map;
}

/** Replace the matching item via `fn`; returns the same ref when nothing changed. */
function replace(
  data: TaskItem[],
  id: string,
  fn: (item: TaskItem) => TaskItem,
): TaskItem[] {
  let changed = false;
  const next = data.map((item) => {
    if (item.id === id) {
      changed = true;
      return fn(item);
    }
    if (item.children?.length) {
      const kids = replace(item.children, id, fn);
      if (kids !== item.children) {
        changed = true;
        return { ...item, children: kids };
      }
    }
    return item;
  });
  return changed ? next : data;
}

export function renameItem(
  data: TaskItem[],
  id: string,
  name: string,
): TaskItem[] {
  return replace(data, id, (item) => ({ ...item, name }));
}

/**
 * Apply a calendar window patch (reschedule / resize / all-day⇄timed convert).
 *
 * Takes epoch **ms + an `allDay` flag** (not ISO strings — the geometry layer
 * hands it numbers and the formatter decides the serialization). The calendar
 * canonicalizes to a `startAt` + `expireAt` pair: when an `endMs` is written, a
 * pre-existing `duration` is dropped (an explicit end is clearer than a duration
 * for a calendar event, and avoids a stale duration shadowing the new expireAt).
 * Enforces `end ≥ start + MIN_DURATION_MS` for timed only (all-day spans are
 * day-quantized and need no ms floor). Non-finite ms leave the field untouched
 * rather than emitting `new Date(NaN).toISOString()`.
 */
export function setWindow(
  data: TaskItem[],
  id: string,
  patch: { startMs?: number; endMs?: number; allDay: boolean },
): TaskItem[] {
  return replace(data, id, (item) => {
    const next: TaskItem = { ...item };
    if (patch.startMs != null && Number.isFinite(patch.startMs)) {
      let startMs = patch.startMs;
      // Start-side mirror of the end clamp below (defense in depth — the
      // gesture layer clamps its commit too, v0.2.4): a timed start-only patch
      // may not cross the item's existing end, else the persisted window
      // inverts (startAt > expireAt). When the patch also carries an endMs the
      // end clamp below owns the invariant instead.
      if (!patch.allDay && patch.endMs == null) {
        const endMs = parseDateValue(next.expireAt ?? "").ms;
        if (Number.isFinite(endMs) && startMs > endMs - MIN_DURATION_MS) {
          startMs = endMs - MIN_DURATION_MS;
        }
      }
      next.startAt = formatDateValue(startMs, patch.allDay);
    }
    if (patch.endMs != null) {
      const startMs =
        patch.startMs != null && Number.isFinite(patch.startMs)
          ? patch.startMs
          : parseDateValue(next.startAt ?? next.setAt).ms;
      let endMs = patch.endMs;
      if (
        !patch.allDay &&
        Number.isFinite(startMs) &&
        Number.isFinite(endMs) &&
        endMs < startMs + MIN_DURATION_MS
      ) {
        endMs = startMs + MIN_DURATION_MS;
      }
      if (Number.isFinite(endMs)) {
        next.expireAt = formatDateValue(endMs, patch.allDay);
        if (next.duration != null) delete next.duration; // canonicalize to expireAt-driven
      }
    }
    return next;
  });
}

/** True when `maybeAncestorId` is an ancestor of `id` (circular-drop guard). */
export function isAncestor(
  data: TaskItem[],
  maybeAncestorId: string,
  id: string,
): boolean {
  const idx = buildIndex(data);
  let cur = idx.get(id)?.parentId ?? null;
  while (cur != null) {
    if (cur === maybeAncestorId) return true;
    cur = idx.get(cur)?.parentId ?? null;
  }
  return false;
}

/** Insert `item` under `parentId` (null = root) at `index` (default = append). */
export function addItem(
  data: TaskItem[],
  parentId: string | null,
  item: TaskItem,
  index?: number,
): TaskItem[] {
  if (parentId == null) {
    const next = [...data];
    next.splice(index ?? next.length, 0, item);
    return next;
  }
  return replace(data, parentId, (parent) => {
    const kids = parent.children ? [...parent.children] : [];
    kids.splice(index ?? kids.length, 0, item);
    return { ...parent, children: kids };
  });
}

/** Remove an item; returns the new forest + the removed subtree + its old parent. */
export function removeItem(
  data: TaskItem[],
  id: string,
): { next: TaskItem[]; removed: TaskItem | null; parentId: string | null } {
  const info = buildIndex(data).get(id);
  if (!info) return { next: data, removed: null, parentId: null };
  const prune = (items: TaskItem[]): TaskItem[] =>
    items
      .filter((it) => it.id !== id)
      .map((it) =>
        it.children?.length ? { ...it, children: prune(it.children) } : it,
      );
  return { next: prune(data), removed: info.item, parentId: info.parentId };
}

/**
 * Move an item to `newParentId` (null = root) at `newIndex`. The caller guards
 * circular drops (`isAncestor`); `newIndex` is interpreted against the target
 * parent's children AFTER the source has been removed (task-tree semantics).
 * Reserved for the v0.2.0 "drop-onto-an-event-to-nest" path (not wired by any
 * gesture this version — calendar's "move" is reschedule, not reparent).
 */
export function moveItem(
  data: TaskItem[],
  id: string,
  newParentId: string | null,
  newIndex: number,
): TaskItem[] {
  const { next: pruned, removed } = removeItem(data, id);
  if (!removed) return data;
  return addItem(pruned, newParentId, removed, newIndex);
}
