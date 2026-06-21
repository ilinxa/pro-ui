/**
 * Pure forest mutations over `TodoItem[]` — the editing layer (v0.2.0).
 *
 * The array analogue of todo-rich-card's reducer mutations: every function
 * returns a NEW forest with structural sharing and NEVER mutates in place, so
 * the controlled consumer can diff/echo and stack undo for free. Framework-free;
 * Vitest-ready. Hierarchy is nested `children` (no parentId on TodoItem), so the
 * index here is what callers use to locate a splice point.
 */

import type { TodoItem } from "../types";
import { effEndMs, effStartMs } from "./geometry";

/** Minimum bar span (ms) so a resize/drag can't collapse a bar to zero width. */
export const MIN_DURATION_MS = 60_000;

export type ForestNodeInfo = {
  item: TodoItem;
  parentId: string | null;
  index: number;
  /** 1 = root. */
  level: number;
};

/** Flat `id → { item, parentId, index, level }` over the whole forest. */
export function buildIndex(data: TodoItem[]): Map<string, ForestNodeInfo> {
  const map = new Map<string, ForestNodeInfo>();
  const walk = (items: TodoItem[], parentId: string | null, level: number) => {
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
  data: TodoItem[],
  id: string,
  fn: (item: TodoItem) => TodoItem,
): TodoItem[] {
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
  data: TodoItem[],
  id: string,
  name: string,
): TodoItem[] {
  return replace(data, id, (item) => ({ ...item, name }));
}

/**
 * Apply a window patch (reschedule / resize / milestone-move), enforcing the
 * geometry invariant `end ≥ start + MIN_DURATION_MS`. Respects the v1 precedence:
 * an `expireAt`-driven bar keeps writing `expireAt`; a `duration`-driven bar
 * keeps writing `duration`.
 */
export function setWindow(
  data: TodoItem[],
  id: string,
  patch: { startAt?: string; expireAt?: string; duration?: number },
): TodoItem[] {
  return replace(data, id, (item) => {
    const next: TodoItem = { ...item, ...patch };
    const startMs = Date.parse(next.startAt ?? next.setAt);
    if (next.expireAt != null) {
      let endMs = Date.parse(next.expireAt);
      if (Number.isFinite(startMs) && endMs < startMs + MIN_DURATION_MS) {
        endMs = startMs + MIN_DURATION_MS;
      }
      next.expireAt = new Date(endMs).toISOString();
    } else if (next.duration != null) {
      next.duration = Math.max(MIN_DURATION_MS, next.duration);
    }
    return next;
  });
}

/** True when `maybeAncestorId` is an ancestor of `id` (circular-drop guard). */
export function isAncestor(
  data: TodoItem[],
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
  data: TodoItem[],
  parentId: string | null,
  item: TodoItem,
  index?: number,
): TodoItem[] {
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
  data: TodoItem[],
  id: string,
): { next: TodoItem[]; removed: TodoItem | null; parentId: string | null } {
  const info = buildIndex(data).get(id);
  if (!info) return { next: data, removed: null, parentId: null };
  const prune = (items: TodoItem[]): TodoItem[] =>
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
 * parent's children AFTER the source has been removed (todo-tree semantics).
 */
export function moveItem(
  data: TodoItem[],
  id: string,
  newParentId: string | null,
  newIndex: number,
): TodoItem[] {
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
export function subtreeLeaves(root: TodoItem): TodoItem[] {
  const out: TodoItem[] = [];
  const walk = (n: TodoItem) => {
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
  data: TodoItem[],
  rootId: string,
  deltaMs: number,
): TodoItem[] {
  if (!Number.isFinite(deltaMs) || deltaMs === 0) return data;
  const shiftLeaf = (item: TodoItem): TodoItem => {
    const next: TodoItem = {
      ...item,
      startAt: new Date(effStartMs(item) + deltaMs).toISOString(),
    };
    if (item.expireAt != null) {
      next.expireAt = new Date((effEndMs(item) ?? effStartMs(item)) + deltaMs).toISOString();
    }
    return next;
  };
  const shiftDeep = (item: TodoItem): TodoItem =>
    item.children?.length
      ? { ...item, children: item.children.map(shiftDeep) }
      : shiftLeaf(item);
  return replace(data, rootId, shiftDeep);
}
