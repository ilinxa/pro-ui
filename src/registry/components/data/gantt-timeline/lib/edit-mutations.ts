/**
 * Pure forest mutations over `TaskItem[]` — the editing layer (v0.2.0).
 *
 * The array analogue of task-card's reducer mutations: every function
 * returns a NEW forest with structural sharing and NEVER mutates in place, so
 * the controlled consumer can diff/echo and stack undo for free. Framework-free;
 * Vitest-ready. Hierarchy is nested `children` (no parentId on TaskItem), so the
 * index here is what callers use to locate a splice point.
 */

import type { TaskItem } from "../types";
import {
  effEndMs,
  effStartMs,
  isGanttDateOnly,
  parseGanttDate,
  serializeGanttDate,
} from "./geometry";

/** Minimum bar span (ms) so a resize/drag can't collapse a bar to zero width. */
export const MIN_DURATION_MS = 60_000;

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
 * Apply a window patch (reschedule / resize / milestone-move), enforcing the
 * geometry invariant `end ≥ start + MIN_DURATION_MS`. Respects the v1 precedence:
 * an `expireAt`-driven bar keeps writing `expireAt`; a `duration`-driven bar
 * keeps writing `duration`.
 */
export function setWindow(
  data: TaskItem[],
  id: string,
  patch: { startAt?: string; expireAt?: string; duration?: number },
): TaskItem[] {
  return replace(data, id, (item) => {
    const next: TaskItem = { ...item, ...patch };
    const startMs = parseGanttDate(next.startAt ?? next.setAt);
    // Date-only (all-day) preservation: when the ORIGINAL field was a bare
    // YYYY-MM-DD and the patched instant still sits on a local midnight (a
    // whole-day move), keep the date-only form instead of silently converting
    // it to a UTC timestamp. Non-date-only originals keep the patch verbatim.
    if (
      patch.startAt != null &&
      isGanttDateOnly(item.startAt) &&
      Number.isFinite(startMs)
    ) {
      next.startAt = serializeGanttDate(startMs, item.startAt);
    }
    if (next.expireAt != null) {
      let endMs = parseGanttDate(next.expireAt);
      if (
        Number.isFinite(startMs) &&
        Number.isFinite(endMs) &&
        endMs < startMs + MIN_DURATION_MS
      ) {
        endMs = startMs + MIN_DURATION_MS;
      }
      // Guard: an unparseable date would make `new Date(NaN).toISOString()`
      // throw. Leave a bad `expireAt` untouched rather than crashing the commit.
      if (Number.isFinite(endMs)) {
        next.expireAt = serializeGanttDate(endMs, item.expireAt);
      }
    } else if (next.duration != null) {
      next.duration = Math.max(MIN_DURATION_MS, next.duration);
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

/* ───────── group-move (v0.3.0) ───────── */

/**
 * The scheduled LEAF descendants of `root`. Derived summaries — `root` itself and
 * any nested parent — are never returned; only leaves carry a real schedule.
 * Walks `root.children` directly (no index rebuild), so it's cheap enough for the
 * render-hot `canGroupMove` path. A leaf root yields `[]`.
 */
export function subtreeLeaves(root: TaskItem): TaskItem[] {
  const out: TaskItem[] = [];
  const walk = (n: TaskItem) => {
    if (n.children?.length) n.children.forEach(walk);
    else out.push(n);
  };
  root.children?.forEach(walk); // a summary root ⇒ recurses, never pushes itself
  return out;
}

/**
 * Rigidly shift a subtree by `deltaMs` (group-move). Every LEAF descendant's
 * window translates by the same delta; derived summaries (the root + any nested
 * parent) keep their own latent dates and re-derive their brackets from the moved
 * leaves (WBS-consistent — the gantt ignores a parent's own window). Writes
 * `startAt` (+ `expireAt` for expireAt-driven leaves); `duration`/`setAt`
 * untouched; milestones shift `startAt` only. The span is invariant under a rigid
 * shift, so no MIN_DURATION clamp is needed. Structural sharing; returns the same
 * ref when `deltaMs` is 0 / non-finite.
 */
export function shiftSubtree(
  data: TaskItem[],
  rootId: string,
  deltaMs: number,
): TaskItem[] {
  if (!Number.isFinite(deltaMs) || deltaMs === 0) return data;
  const shiftLeaf = (item: TaskItem): TaskItem => {
    const s = effStartMs(item);
    // Unparseable start — can't translate it; leave the leaf untouched rather
    // than emitting `new Date(NaN).toISOString()` (which throws).
    if (!Number.isFinite(s)) return item;
    const next: TaskItem = {
      ...item,
      // Date-only originals keep the YYYY-MM-DD form on whole-day shifts
      // (serializeGanttDate); anything else serializes as full ISO, as before.
      startAt: serializeGanttDate(s + deltaMs, item.startAt),
    };
    if (item.expireAt != null) {
      const e = effEndMs(item);
      const base = e != null && Number.isFinite(e) ? e : s;
      next.expireAt = serializeGanttDate(base + deltaMs, item.expireAt);
    }
    return next;
  };
  const shiftDeep = (item: TaskItem): TaskItem =>
    item.children?.length
      ? { ...item, children: item.children.map(shiftDeep) }
      : shiftLeaf(item);
  return replace(data, rootId, shiftDeep);
}
