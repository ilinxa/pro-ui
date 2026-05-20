import type { TodoItem } from "../../todo-rich-card/types";
import type { TodoTreeSort } from "../types";

/**
 * Apply `sort` to the tree recursively. Children sort independently under
 * their parent. Pure: returns a new top-level array; subtrees with empty or
 * single-element children are returned by reference when stable. Sibling
 * order is stable (Array.prototype.sort is stable as of ES2019).
 */
export function applySort(
  items: ReadonlyArray<TodoItem>,
  sort: TodoTreeSort,
): TodoItem[] {
  const compare = makeComparator(sort);
  return sortRecursive(items, compare);
}

function sortRecursive(
  items: ReadonlyArray<TodoItem>,
  compare: (a: TodoItem, b: TodoItem) => number,
): TodoItem[] {
  const next = items
    .map((item) => {
      if (item.children && item.children.length > 0) {
        const sortedChildren = sortRecursive(item.children, compare);
        if (sortedChildren !== item.children) {
          return { ...item, children: sortedChildren };
        }
      }
      return item;
    })
    .slice();
  next.sort(compare);
  return next;
}

function makeComparator(
  sort: TodoTreeSort,
): (a: TodoItem, b: TodoItem) => number {
  if (sort.kind === "custom") return sort.compare;
  const dir = sort.direction === "desc" ? -1 : 1;
  switch (sort.kind) {
    case "name":
      return (a, b) => dir * a.name.localeCompare(b.name);
    case "setAt":
      return (a, b) => dir * compareIsoStrings(a.setAt, b.setAt);
    case "expireAt":
      return (a, b) => dir * compareIsoStrings(a.expireAt, b.expireAt);
    case "status":
      return (a, b) => dir * a.status.localeCompare(b.status);
  }
}

function compareIsoStrings(a: string | undefined, b: string | undefined): number {
  // Items without the timestamp sort last regardless of direction so the
  // direction flip only affects rows that actually have the field.
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
