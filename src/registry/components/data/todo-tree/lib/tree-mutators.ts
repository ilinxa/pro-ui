import type { TodoItem } from "../../todo-rich-card/types";
import type { TreeLocation } from "../types";
import { findItemById, findParentId } from "./tree-walker";
import { isAncestor } from "./circular-drop";

/**
 * Insert `item` as a child of `parentId` at `index`. parentId=null inserts at
 * the top level. index=undefined appends. Returns a new top-level array; the
 * spine from root to mutation point is copied; untouched subtrees are reused.
 */
export function insertAt(
  items: ReadonlyArray<TodoItem>,
  parentId: string | null,
  index: number | undefined,
  item: TodoItem,
): TodoItem[] {
  if (parentId === null) {
    const next = items.slice();
    const at = clampIndex(index, next.length);
    next.splice(at, 0, item);
    return next;
  }
  return items.map((node) => {
    if (node.id === parentId) {
      const children = node.children ? node.children.slice() : [];
      const at = clampIndex(index, children.length);
      children.splice(at, 0, item);
      return { ...node, children };
    }
    if (node.children && node.children.length > 0) {
      const childUpdated = insertAt(node.children, parentId, index, item);
      if (childUpdated !== node.children) {
        return { ...node, children: childUpdated };
      }
    }
    return node;
  });
}

/**
 * Remove the item with `id` and return the new top-level array. Returns the
 * input by reference when the id is not in the tree.
 */
export function removeById(
  items: ReadonlyArray<TodoItem>,
  id: string,
): TodoItem[] {
  let mutated = false;
  const next = items
    .map((node) => {
      if (node.id === id) {
        mutated = true;
        return null;
      }
      if (node.children && node.children.length > 0) {
        const childUpdated = removeById(node.children, id);
        if (childUpdated !== node.children) {
          mutated = true;
          return { ...node, children: childUpdated };
        }
      }
      return node;
    })
    .filter((n): n is TodoItem => n !== null);
  return mutated ? next : (items as TodoItem[]);
}

/**
 * Apply an updater to the item with `id`. The updater receives the current
 * item and returns the next one (it may return the same reference to signal
 * no-op). Returns the input by reference when nothing changed.
 */
export function updateById(
  items: ReadonlyArray<TodoItem>,
  id: string,
  updater: (item: TodoItem) => TodoItem,
): TodoItem[] {
  let mutated = false;
  const next = items.map((node) => {
    if (node.id === id) {
      const replaced = updater(node);
      if (replaced !== node) mutated = true;
      return replaced;
    }
    if (node.children && node.children.length > 0) {
      const childUpdated = updateById(node.children, id, updater);
      if (childUpdated !== node.children) {
        mutated = true;
        return { ...node, children: childUpdated };
      }
    }
    return node;
  });
  return mutated ? next : (items as TodoItem[]);
}

/**
 * Atomic remove + insert. Bans circular drops (target inside source's subtree)
 * by returning the input unchanged. Also a no-op when the source can't be
 * found. Auto-expands behavior is handled in the reducer (collapsedIds set),
 * not here — this stays a pure tree transform.
 */
export function moveItem(
  items: ReadonlyArray<TodoItem>,
  sourceId: string,
  to: TreeLocation,
): TodoItem[] {
  const source = findItemById(items, sourceId);
  if (!source) return items as TodoItem[];
  if (to.parentId && isAncestor(items, sourceId, to.parentId)) {
    return items as TodoItem[];
  }
  if (to.parentId === sourceId) return items as TodoItem[];

  const oldParentId = findParentId(items, sourceId);
  const sameParent = oldParentId === to.parentId;

  // Compute the destination index BEFORE removal when the source and target
  // share a parent — the removal shifts later siblings up by one.
  let targetIndex = to.index;
  if (sameParent) {
    const oldIndex = siblingIndex(items, oldParentId, sourceId);
    if (oldIndex !== -1 && oldIndex < targetIndex) {
      targetIndex = targetIndex - 1;
    }
  }

  const withoutSource = removeById(items, sourceId);
  return insertAt(withoutSource, to.parentId, targetIndex, source);
}

function siblingIndex(
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

function clampIndex(index: number | undefined, len: number): number {
  if (index === undefined) return len;
  if (index < 0) return 0;
  if (index > len) return len;
  return index;
}
