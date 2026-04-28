/**
 * Pure reducer for rich-card state.
 *
 * v0.1 actions: toggle-collapse, set-focus, replace-tree.
 * v0.2 adds 12 new actions + 3 state slots (selectedId, version, cleanVersion).
 *
 * Every "committing" action increments `version`. mark-clean snapshots
 * `cleanVersion = version`. isDirty derives from `version !== cleanVersion`.
 *
 * Validation runs OUTSIDE the reducer (in the dispatch wrapper) — actions
 * that reach the reducer are assumed valid. Invalid actions short-circuit
 * before dispatch.
 */

import type { FlatFieldValue, PredefinedKey } from "../types";
import type { FlatFieldType } from "./infer-type";
import type { RichCardPredefinedEntry, RichCardTree } from "./parse";

// Re-export tree types so consumers of reducer.ts don't have to know they live in parse.ts.
export type { RichCardField, RichCardPredefinedEntry, RichCardTree } from "./parse";

/* ───────── state + actions ───────── */

export type RichCardState = {
  tree: RichCardTree;
  collapsed: ReadonlySet<string>;
  focusedId: string | null;
  selectedId: string | null;
  version: number;
  cleanVersion: number;
};

export type RichCardAction =
  // v0.1
  | { type: "toggle-collapse"; id: string }
  | { type: "set-focus"; id: string | null }
  | { type: "replace-tree"; tree: RichCardTree }
  // v0.2 — selection + dirty
  | { type: "set-selection"; id: string | null }
  | { type: "mark-clean" }
  // v0.2 — flat fields
  | {
      type: "field-edit-value";
      cardId: string;
      key: string;
      value: FlatFieldValue;
      valueType: FlatFieldType;
    }
  | {
      type: "field-edit-key";
      cardId: string;
      oldKey: string;
      newKey: string;
    }
  | {
      type: "field-add";
      cardId: string;
      key: string;
      value: FlatFieldValue;
      valueType: FlatFieldType;
    }
  | { type: "field-remove"; cardId: string; key: string }
  // v0.2 — cards
  | { type: "card-add"; parentId: string; card: RichCardTree }
  | { type: "card-remove"; cardId: string }
  | { type: "card-rename"; cardId: string; newParentKey: string }
  // v0.2 — predefined
  | {
      type: "predefined-add";
      cardId: string;
      entry: RichCardPredefinedEntry;
    }
  | {
      type: "predefined-edit";
      cardId: string;
      key: PredefinedKey;
      entry: RichCardPredefinedEntry;
    }
  | { type: "predefined-remove"; cardId: string; key: PredefinedKey };

/* ───────── initial-state factory ───────── */

export type DefaultCollapsed =
  | "all"
  | "none"
  | ((level: number) => boolean);

function collectCollapsedIds(
  tree: RichCardTree,
  predicate: DefaultCollapsed,
  out: Set<string>,
): void {
  const shouldCollapse =
    predicate === "all"
      ? true
      : predicate === "none"
        ? false
        : predicate(tree.level);
  if (shouldCollapse) out.add(tree.id);
  for (const child of tree.children) {
    collectCollapsedIds(child, predicate, out);
  }
}

export function createInitialState(
  tree: RichCardTree,
  defaultCollapsed: DefaultCollapsed,
): RichCardState {
  const collapsed = new Set<string>();
  collectCollapsedIds(tree, defaultCollapsed, collapsed);
  return {
    tree,
    collapsed,
    focusedId: null,
    selectedId: null,
    version: 0,
    cleanVersion: 0,
  };
}

/* ───────── immutable tree helpers ───────── */

/** Apply `fn` to the node with `id`; return a new tree with structural sharing for unchanged subtrees. */
function updateNode(
  tree: RichCardTree,
  id: string,
  fn: (node: RichCardTree) => RichCardTree,
): RichCardTree {
  if (tree.id === id) return fn(tree);
  if (tree.children.length === 0) return tree;
  let changed = false;
  const next = tree.children.map((c) => {
    const n = updateNode(c, id, fn);
    if (n !== c) changed = true;
    return n;
  });
  return changed ? { ...tree, children: next } : tree;
}

/** Find and remove a card by id. Returns the new tree + the removed subtree (or null if not found). */
function removeNodeById(
  tree: RichCardTree,
  id: string,
): { tree: RichCardTree; removed: RichCardTree | null; parentId: string | null } {
  // Direct children check
  const directIdx = tree.children.findIndex((c) => c.id === id);
  if (directIdx >= 0) {
    const removed = tree.children[directIdx];
    return {
      tree: {
        ...tree,
        children: tree.children.filter((_, i) => i !== directIdx),
      },
      removed,
      parentId: tree.id,
    };
  }
  // Recurse
  for (let i = 0; i < tree.children.length; i++) {
    const sub = removeNodeById(tree.children[i], id);
    if (sub.removed) {
      const newChildren = [...tree.children];
      newChildren[i] = sub.tree;
      return {
        tree: { ...tree, children: newChildren },
        removed: sub.removed,
        parentId: sub.parentId,
      };
    }
  }
  return { tree, removed: null, parentId: null };
}

function setLevelDeep(node: RichCardTree, level: number): RichCardTree {
  const next: RichCardTree = { ...node, level };
  if (node.children.length === 0) return next;
  next.children = node.children.map((c) => setLevelDeep(c, level + 1));
  return next;
}

/* ───────── reducer ───────── */

export function reducer(
  state: RichCardState,
  action: RichCardAction,
): RichCardState {
  switch (action.type) {
    /* ────── v0.1 actions ────── */
    case "toggle-collapse": {
      const next = new Set(state.collapsed);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, collapsed: next };
    }
    case "set-focus": {
      if (state.focusedId === action.id) return state;
      return { ...state, focusedId: action.id };
    }
    case "replace-tree": {
      return {
        tree: action.tree,
        collapsed: new Set<string>(),
        focusedId: null,
        selectedId: null,
        version: 0,
        cleanVersion: 0,
      };
    }

    /* ────── v0.2 selection + dirty ────── */
    case "set-selection": {
      if (state.selectedId === action.id) return state;
      return { ...state, selectedId: action.id };
    }
    case "mark-clean": {
      if (state.cleanVersion === state.version) return state;
      return { ...state, cleanVersion: state.version };
    }

    /* ────── v0.2 flat-field actions ────── */
    case "field-edit-value": {
      const tree = updateNode(state.tree, action.cardId, (card) => ({
        ...card,
        fields: card.fields.map((f) =>
          f.key === action.key
            ? { ...f, value: action.value, type: action.valueType }
            : f,
        ),
      }));
      if (tree === state.tree) return state;
      return { ...state, tree, version: state.version + 1 };
    }
    case "field-edit-key": {
      const tree = updateNode(state.tree, action.cardId, (card) => ({
        ...card,
        fields: card.fields.map((f) =>
          f.key === action.oldKey ? { ...f, key: action.newKey } : f,
        ),
      }));
      if (tree === state.tree) return state;
      return { ...state, tree, version: state.version + 1 };
    }
    case "field-add": {
      const tree = updateNode(state.tree, action.cardId, (card) => ({
        ...card,
        fields: [
          ...card.fields,
          { key: action.key, value: action.value, type: action.valueType },
        ],
      }));
      if (tree === state.tree) return state;
      return { ...state, tree, version: state.version + 1 };
    }
    case "field-remove": {
      const tree = updateNode(state.tree, action.cardId, (card) => ({
        ...card,
        fields: card.fields.filter((f) => f.key !== action.key),
      }));
      if (tree === state.tree) return state;
      return { ...state, tree, version: state.version + 1 };
    }

    /* ────── v0.2 card actions ────── */
    case "card-add": {
      const tree = updateNode(state.tree, action.parentId, (parent) => {
        const child = setLevelDeep(action.card, parent.level + 1);
        const next = [...parent.children, child].sort(
          (a, b) => a.order - b.order,
        );
        return { ...parent, children: next };
      });
      if (tree === state.tree) return state;
      // Also expand parent if collapsed (auto-expand on add)
      const collapsed = new Set(state.collapsed);
      collapsed.delete(action.parentId);
      return {
        ...state,
        tree,
        collapsed,
        version: state.version + 1,
      };
    }
    case "card-remove": {
      const result = removeNodeById(state.tree, action.cardId);
      if (!result.removed) return state;
      // Clean up collapse / selection / focus state for the removed subtree.
      const removedIds = new Set<string>();
      collectIds(result.removed, removedIds);
      const collapsed = new Set(state.collapsed);
      removedIds.forEach((id) => collapsed.delete(id));
      const focusedId = removedIds.has(state.focusedId ?? "")
        ? null
        : state.focusedId;
      const selectedId = removedIds.has(state.selectedId ?? "")
        ? null
        : state.selectedId;
      return {
        ...state,
        tree: result.tree,
        collapsed,
        focusedId,
        selectedId,
        version: state.version + 1,
      };
    }
    case "card-rename": {
      const tree = updateNode(state.tree, action.cardId, (card) => ({
        ...card,
        parentKey: action.newParentKey,
      }));
      if (tree === state.tree) return state;
      return { ...state, tree, version: state.version + 1 };
    }

    /* ────── v0.2 predefined-key actions ────── */
    case "predefined-add": {
      const tree = updateNode(state.tree, action.cardId, (card) => ({
        ...card,
        predefined: [...card.predefined, action.entry],
      }));
      if (tree === state.tree) return state;
      return { ...state, tree, version: state.version + 1 };
    }
    case "predefined-edit": {
      const tree = updateNode(state.tree, action.cardId, (card) => ({
        ...card,
        predefined: card.predefined.map((p) =>
          p.key === action.key ? action.entry : p,
        ),
      }));
      if (tree === state.tree) return state;
      return { ...state, tree, version: state.version + 1 };
    }
    case "predefined-remove": {
      const tree = updateNode(state.tree, action.cardId, (card) => ({
        ...card,
        predefined: card.predefined.filter((p) => p.key !== action.key),
      }));
      if (tree === state.tree) return state;
      return { ...state, tree, version: state.version + 1 };
    }
  }
}

function collectIds(node: RichCardTree, out: Set<string>): void {
  out.add(node.id);
  for (const c of node.children) collectIds(c, out);
}

/* ───────── traversal helpers (used by hooks) ───────── */

export function visibleIdsInOrder(
  tree: RichCardTree,
  collapsed: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  walkVisible(tree, collapsed, out);
  return out;
}

function walkVisible(
  tree: RichCardTree,
  collapsed: ReadonlySet<string>,
  out: string[],
): void {
  out.push(tree.id);
  if (collapsed.has(tree.id)) return;
  for (const child of tree.children) walkVisible(child, collapsed, out);
}

export function findParentId(
  tree: RichCardTree,
  id: string,
): string | null {
  if (tree.id === id) return null;
  for (const child of tree.children) {
    if (child.id === id) return tree.id;
    const inSubtree = findParentId(child, id);
    if (inSubtree) return inSubtree;
  }
  return null;
}

export function findCard(
  tree: RichCardTree,
  id: string,
): RichCardTree | null {
  if (tree.id === id) return tree;
  for (const child of tree.children) {
    const found = findCard(child, id);
    if (found) return found;
  }
  return null;
}
