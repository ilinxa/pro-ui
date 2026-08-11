/**
 * Tree → visible rows (depth-first; skips descendants of collapsed nodes).
 * The gutter + body consume the SAME row array so they stay vertically aligned.
 * Pure; framework-free.
 */

import type { GanttRow, TaskItem } from "../types";

export function flatten(
  data: TaskItem[],
  isCollapsed: (id: string) => boolean,
): GanttRow[] {
  const out: GanttRow[] = [];
  const walk = (
    item: TaskItem,
    depth: number,
    parentId: string | null,
    posInSet: number,
    setSize: number,
  ) => {
    const hasChildren = !!item.children && item.children.length > 0;
    const collapsed = hasChildren && isCollapsed(item.id);
    out.push({
      item,
      depth,
      parentId,
      hasChildren,
      isSummary: hasChildren,
      collapsed,
      posInSet,
      setSize,
    });
    if (hasChildren && !collapsed) {
      const kids = item.children!;
      kids.forEach((child, i) =>
        walk(child, depth + 1, item.id, i + 1, kids.length),
      );
    }
  };
  data.forEach((item, i) => walk(item, 0, null, i + 1, data.length));
  return out;
}

/** Flat id → item index over the whole forest (for scrollToItem etc.). */
export function indexById(data: TaskItem[]): Map<string, TaskItem> {
  const map = new Map<string, TaskItem>();
  const walk = (item: TaskItem) => {
    map.set(item.id, item);
    item.children?.forEach(walk);
  };
  data.forEach(walk);
  return map;
}

/** All ancestor ids that must be expanded for `id` to be visible. */
export function ancestorsOf(data: TaskItem[], id: string): string[] {
  const path: string[] = [];
  const found = { hit: false };
  const walk = (item: TaskItem, trail: string[]) => {
    if (found.hit) return;
    if (item.id === id) {
      found.hit = true;
      path.push(...trail);
      return;
    }
    item.children?.forEach((c) => walk(c, [...trail, item.id]));
  };
  data.forEach((d) => walk(d, []));
  return path;
}

/** Every id that has children (for expandAll/collapseAll). */
export function parentIds(data: TaskItem[]): string[] {
  const ids: string[] = [];
  const walk = (item: TaskItem) => {
    if (item.children && item.children.length > 0) {
      ids.push(item.id);
      item.children.forEach(walk);
    }
  };
  data.forEach(walk);
  return ids;
}
