import type { TodoItem } from "../../todo-rich-card/types";

/** Depth-first search for an item by id. Returns undefined when not found. */
export function findItemById(
  items: ReadonlyArray<TodoItem>,
  id: string,
): TodoItem | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children && item.children.length > 0) {
      const hit = findItemById(item.children, id);
      if (hit) return hit;
    }
  }
  return undefined;
}

/**
 * Find the parent id of `id`. Returns null when `id` is a top-level item OR
 * when `id` is not in the tree. Use `findItemById` first if you need to
 * disambiguate those two cases.
 */
export function findParentId(
  items: ReadonlyArray<TodoItem>,
  id: string,
): string | null {
  for (const item of items) {
    if (item.children) {
      for (const child of item.children) {
        if (child.id === id) return item.id;
      }
      const deeper = findParentId(item.children, id);
      if (deeper !== null) return deeper;
    }
  }
  return null;
}

/**
 * Return the ancestor chain (root-first) leading to `id`, excluding `id`
 * itself. Empty when `id` is top-level or missing.
 */
export function findAncestors(
  items: ReadonlyArray<TodoItem>,
  id: string,
): TodoItem[] {
  const path: TodoItem[] = [];
  if (walkPath(items, id, path)) return path;
  return [];
}

function walkPath(
  items: ReadonlyArray<TodoItem>,
  id: string,
  acc: TodoItem[],
): boolean {
  for (const item of items) {
    if (item.id === id) return true;
    if (item.children && item.children.length > 0) {
      acc.push(item);
      if (walkPath(item.children, id, acc)) return true;
      acc.pop();
    }
  }
  return false;
}

/** Sibling index of `id` under `parentId`. Returns -1 when not found. */
export function findIndexUnder(
  items: ReadonlyArray<TodoItem>,
  parentId: string | null,
  id: string,
): number {
  if (parentId === null) {
    return items.findIndex((i) => i.id === id);
  }
  const parent = findItemById(items, parentId);
  if (!parent || !parent.children) return -1;
  return parent.children.findIndex((i) => i.id === id);
}

/** Visit every item depth-first. Stops when visitor returns false. */
export function forEachItem(
  items: ReadonlyArray<TodoItem>,
  visit: (item: TodoItem, level: number, parentId: string | null) => boolean | void,
  level = 0,
  parentId: string | null = null,
): boolean {
  for (const item of items) {
    if (visit(item, level, parentId) === false) return false;
    if (item.children && item.children.length > 0) {
      if (!forEachItem(item.children, visit, level + 1, item.id)) return false;
    }
  }
  return true;
}
