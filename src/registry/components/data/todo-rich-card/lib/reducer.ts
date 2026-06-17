/**
 * State machine. Pure reducer.
 *
 * The reducer only mutates `state` — it does NOT fire events. Event firing
 * happens at the dispatch site (in hooks/use-card-state) which has access to
 * the props callbacks. Keeping the reducer side-effect-free preserves
 * testability and makes time-travel debugging trivial when added later.
 */

import type {
  Action,
  EditState,
  State,
  TodoItem,
  TodoNode,
} from "../types";
import { findNode, normalize, reassignIds, reindex } from "./normalize";

export function createInitialState(input: TodoItem | undefined): State {
  const { root } = normalize(input);
  return {
    root,
    edit: { kind: "view" },
    focusedId: null,
    dirty: false,
    collapsedIds: new Set<string>(),
  };
}

/** Deep-clone a node so the reducer can mutate without aliasing. */
function cloneNode(node: TodoNode): TodoNode {
  return {
    item: { ...node.item },
    level: node.level,
    parentId: node.parentId,
    index: node.index,
    childNodes: node.childNodes.map(cloneNode),
  };
}

/** Walk + map: returns a new tree with `transform` applied to a single node. */
function withNode(
  root: TodoNode,
  id: string,
  transform: (node: TodoNode) => TodoNode,
): TodoNode {
  if (root.item.id === id) return transform(cloneNode(root));
  return {
    ...root,
    childNodes: root.childNodes.map((child) => withNode(child, id, transform)),
  };
}

/** Locate and remove a node; returns { newRoot, removed, oldParentId, oldIndex }. */
function removeNode(
  root: TodoNode,
  id: string,
): {
  newRoot: TodoNode;
  removed: TodoNode | null;
  oldParentId: string | null;
  oldIndex: number;
} {
  if (root.item.id === id) {
    // Root removal is out of scope in v0.1; caller should reject.
    return { newRoot: root, removed: null, oldParentId: null, oldIndex: 0 };
  }

  function walk(node: TodoNode): {
    node: TodoNode;
    removed: TodoNode | null;
    parentId: string | null;
    index: number;
  } {
    const directIndex = node.childNodes.findIndex((c) => c.item.id === id);
    if (directIndex !== -1) {
      const removed = node.childNodes[directIndex];
      const nextChildren = node.childNodes.filter((_, i) => i !== directIndex);
      return {
        node: { ...node, childNodes: nextChildren },
        removed,
        parentId: node.item.id,
        index: directIndex,
      };
    }
    let foundRemoved: TodoNode | null = null;
    let foundParent: string | null = null;
    let foundIndex = 0;
    const nextChildren = node.childNodes.map((child) => {
      if (foundRemoved) return child;
      const r = walk(child);
      if (r.removed) {
        foundRemoved = r.removed;
        foundParent = r.parentId;
        foundIndex = r.index;
        return r.node;
      }
      return child;
    });
    return {
      node: { ...node, childNodes: nextChildren },
      removed: foundRemoved,
      parentId: foundParent,
      index: foundIndex,
    };
  }

  const result = walk(root);
  return {
    newRoot: result.node,
    removed: result.removed,
    oldParentId: result.parentId,
    oldIndex: result.index,
  };
}

/** Insert a node under parentId at the given index (append if undefined). */
function insertChild(
  root: TodoNode,
  parentId: string,
  newChild: TodoNode,
  index?: number,
): TodoNode {
  return withNode(root, parentId, (parent) => {
    const next = [...parent.childNodes];
    const i = index == null || index < 0 || index > next.length ? next.length : index;
    next.splice(i, 0, newChild);
    return { ...parent, childNodes: next };
  });
}

function todoItemToNode(
  item: TodoItem,
  level: number,
  parentId: string,
  index: number,
): TodoNode {
  return {
    item: { ...item },
    level,
    parentId,
    index,
    childNodes: (item.children ?? []).map((child, i) =>
      todoItemToNode(child, level + 1, item.id, i),
    ),
  };
}

function applyFieldEdit(
  root: TodoNode,
  id: string,
  key: string,
  value: unknown,
): TodoNode {
  return withNode(root, id, (node) => {
    return {
      ...node,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      item: { ...node.item, [key]: value } as any,
    };
  });
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "replace-tree": {
      const { root } = normalize(action.tree);
      return {
        root,
        edit: { kind: "view" },
        focusedId: null,
        dirty: false,
        collapsedIds: new Set<string>(),
      };
    }

    case "open-edit": {
      // Caller is responsible for the permissions check.
      const editing: EditState = { kind: action.mode, itemId: action.itemId };
      return { ...state, edit: editing };
    }

    case "close-edit": {
      return { ...state, edit: { kind: "view" } };
    }

    case "edit-field": {
      const root = applyFieldEdit(state.root, action.itemId, action.key, action.value);
      return { ...state, root, dirty: true };
    }

    case "add-child": {
      // Re-id the incoming subtree: paste/drop payloads may carry ids that
      // already exist in this tree, which would corrupt id-keyed lookup/focus/
      // permissions. Re-iding here covers all add-child entry points at once.
      const newNode = todoItemToNode(reassignIds(action.item), 0, action.parentId, 0);
      const rootWithInsert = insertChild(state.root, action.parentId, newNode, action.index);
      return { ...state, root: reindex(rootWithInsert), dirty: true };
    }

    case "sync-tree": {
      // Controlled-mode reconcile: replace the tree from an external `value`
      // while preserving UI-only state (edit / focus / collapse / dirty).
      const { root } = normalize(action.tree);
      return { ...state, root };
    }

    case "remove-item": {
      const { newRoot, removed } = removeNode(state.root, action.itemId);
      if (!removed) return state; // not found or attempted root-remove
      // Close edit if the removed item (or any descendant) was being edited.
      const newEdit: EditState =
        state.edit.kind !== "view" && state.edit.itemId === action.itemId
          ? { kind: "view" }
          : state.edit;
      return {
        ...state,
        root: reindex(newRoot),
        edit: newEdit,
        dirty: true,
      };
    }

    case "move-item": {
      const { newRoot, removed } = removeNode(state.root, action.itemId);
      if (!removed) return state;
      const inserted = insertChild(newRoot, action.newParentId, removed, action.newIndex);
      return { ...state, root: reindex(inserted), dirty: true };
    }

    case "set-border-color": {
      const next = withNode(state.root, action.itemId, (node) => ({
        ...node,
        item: {
          ...node.item,
          borderColor: action.color ?? undefined,
        },
      }));
      return { ...state, root: next, dirty: true };
    }

    case "toggle-active": {
      const next = withNode(state.root, action.itemId, (node) => ({
        ...node,
        item: { ...node.item, active: !node.item.active },
      }));
      return { ...state, root: next, dirty: true };
    }

    case "set-locked": {
      const next = withNode(state.root, action.itemId, (node) => ({
        ...node,
        item: { ...node.item, locked: action.locked },
      }));
      // Close any edit on this item if locking.
      const newEdit: EditState =
        action.locked && state.edit.kind !== "view" && state.edit.itemId === action.itemId
          ? { kind: "view" }
          : state.edit;
      return { ...state, root: next, edit: newEdit, dirty: true };
    }

    case "set-focus": {
      return { ...state, focusedId: action.itemId };
    }

    case "toggle-collapse": {
      const next = new Set(state.collapsedIds);
      if (next.has(action.itemId)) {
        next.delete(action.itemId);
      } else {
        next.add(action.itemId);
      }
      return { ...state, collapsedIds: next };
    }

    case "mark-clean": {
      return { ...state, dirty: false };
    }

    default: {
      return state;
    }
  }
}

/** Read helper — exported so hooks can locate nodes without rummaging. */
export function lookup(state: State, id: string): TodoNode | null {
  return findNode(state.root, id);
}
