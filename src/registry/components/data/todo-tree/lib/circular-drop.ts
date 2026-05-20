import type { TodoItem } from "../../todo-rich-card/types";
import { findItemById } from "./tree-walker";

/**
 * True when `targetId` lies within the subtree rooted at `sourceId` —
 * i.e., reparenting `sourceId` under `targetId` would form a cycle.
 * Also true when source === target (item dropped into itself).
 */
export function isAncestor(
  items: ReadonlyArray<TodoItem>,
  sourceId: string,
  targetId: string,
): boolean {
  if (sourceId === targetId) return true;
  const source = findItemById(items, sourceId);
  if (!source || !source.children || source.children.length === 0) return false;
  return findItemById(source.children, targetId) !== undefined;
}
