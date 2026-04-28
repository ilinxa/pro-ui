/**
 * Pure reducer for rich-card state.
 *
 * v0.1 actions: toggle-collapse, set-focus, replace-tree
 * v0.2 actions: 12 (selection, mark-clean, field/card/predefined edit/add/remove)
 * v0.3 actions: 12 (multi-select, drag-transient, card move/duplicate, meta edit/add/remove,
 *                   search query/active-match/clear, expand-path-to-matches)
 *
 * Validation runs OUTSIDE the reducer; the dispatch wrapper validates before dispatch.
 */

import type { FlatFieldValue, PredefinedKey } from "../types";
import type { FlatFieldType } from "./infer-type";
import type { RichCardPredefinedEntry, RichCardTree } from "./parse";

export type { RichCardField, RichCardPredefinedEntry, RichCardTree } from "./parse";

/* ───────── state ───────── */

/** v0.4 — undo snapshot. Captures tree + UI state that "undo" should restore. */
export type UndoSnapshot = {
  tree: RichCardTree;
  collapsed: ReadonlySet<string>;
  selectedIds: ReadonlySet<string>;
  focusedId: string | null;
};

export type RichCardState = {
  tree: RichCardTree;
  collapsed: ReadonlySet<string>;
  /** v0.3 — preserves user-driven collapse separately from search-auto-expand. */
  userCollapsed: ReadonlySet<string>;
  focusedId: string | null;
  /** v0.2 — single id retained for backward compat; in v0.3 derived from selectedIds[0]. */
  selectedId: string | null;
  /** v0.3 — multi-select set. */
  selectedIds: ReadonlySet<string>;
  /** v0.3 — anchor for shift-click range selection. */
  selectionAnchorId: string | null;
  /** v0.3 — id being dragged (transient). */
  draggingId: string | null;
  /** v0.3 — current search query (empty string = inactive). */
  searchQuery: string;
  /** v0.3 — index into search-result.matches for the currently active match. */
  searchActiveIndex: number | null;
  /** v0.4 — undo / redo stacks (most recent at end). */
  undoStack: ReadonlyArray<UndoSnapshot>;
  redoStack: ReadonlyArray<UndoSnapshot>;
  /** v0.4 — configurable history depth. */
  maxUndoDepth: number;
  version: number;
  cleanVersion: number;
};

/* ───────── actions ───────── */

export type RichCardAction =
  // v0.1
  | { type: "toggle-collapse"; id: string }
  | { type: "set-focus"; id: string | null }
  | { type: "replace-tree"; tree: RichCardTree }
  // v0.2 selection + dirty
  | { type: "set-selection"; id: string | null }
  | { type: "mark-clean" }
  // v0.2 flat fields
  | {
      type: "field-edit-value";
      cardId: string;
      key: string;
      value: FlatFieldValue;
      valueType: FlatFieldType;
    }
  | { type: "field-edit-key"; cardId: string; oldKey: string; newKey: string }
  | {
      type: "field-add";
      cardId: string;
      key: string;
      value: FlatFieldValue;
      valueType: FlatFieldType;
    }
  | { type: "field-remove"; cardId: string; key: string }
  // v0.2 cards
  | { type: "card-add"; parentId: string; card: RichCardTree }
  | {
      type: "card-remove";
      cardId: string;
      policy?: "cascade" | "promote";
      collisionStrategy?: "suffix" | "qualify" | "reject";
    }
  | { type: "card-rename"; cardId: string; newParentKey: string }
  // v0.2 predefined
  | { type: "predefined-add"; cardId: string; entry: RichCardPredefinedEntry }
  | {
      type: "predefined-edit";
      cardId: string;
      key: PredefinedKey | string;
      entry: RichCardPredefinedEntry;
    }
  | { type: "predefined-remove"; cardId: string; key: PredefinedKey | string }
  // v0.3 — multi-select
  | { type: "set-multi-selection"; ids: readonly string[]; anchor?: string | null }
  | { type: "toggle-selection"; id: string }
  | { type: "extend-selection-to"; id: string }
  | { type: "clear-selection" }
  // v0.3 — drag-transient
  | { type: "drag-start"; cardId: string }
  | { type: "drag-end" }
  // v0.3 — card movement + duplicate
  | {
      type: "card-move";
      cardId: string;
      newParentId: string;
      newOrder: number;
    }
  | { type: "card-duplicate"; cardId: string; newCardId: string }
  // v0.3 — meta
  | {
      type: "meta-edit";
      cardId: string;
      key: string;
      value: FlatFieldValue;
    }
  | {
      type: "meta-add";
      cardId: string;
      key: string;
      value: FlatFieldValue;
    }
  | { type: "meta-remove"; cardId: string; key: string }
  // v0.3 — bulk
  | { type: "bulk-remove"; cardIds: readonly string[] }
  // v0.3 — search
  | { type: "set-search-query"; query: string }
  | { type: "set-active-match-index"; index: number | null }
  | { type: "clear-search" }
  | { type: "expand-path-to-matches"; ancestorIds: readonly string[] }
  // v0.4 — undo/redo
  | { type: "undo" }
  | { type: "redo" }
  | { type: "clear-history" }
  | { type: "set-max-undo-depth"; depth: number };

/* ───────── initial-state factory ───────── */

export type DefaultCollapsed = "all" | "none" | ((level: number) => boolean);

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
  maxUndoDepth = 50,
): RichCardState {
  const collapsed = new Set<string>();
  collectCollapsedIds(tree, defaultCollapsed, collapsed);
  return {
    tree,
    collapsed,
    userCollapsed: collapsed,
    focusedId: null,
    selectedId: null,
    selectedIds: new Set<string>(),
    selectionAnchorId: null,
    draggingId: null,
    searchQuery: "",
    searchActiveIndex: null,
    undoStack: [],
    redoStack: [],
    maxUndoDepth,
    version: 0,
    cleanVersion: 0,
  };
}

/* ───────── immutable tree helpers ───────── */

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

function removeNodeById(
  tree: RichCardTree,
  id: string,
): { tree: RichCardTree; removed: RichCardTree | null; parentId: string | null } {
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

function deepCloneWithFreshIds(node: RichCardTree, freshId: () => string): RichCardTree {
  return {
    ...node,
    id: freshId(),
    fields: node.fields.map((f) => ({ ...f })),
    predefined: node.predefined.map((p) => ({ ...p })),
    meta: node.meta ? { ...node.meta } : undefined,
    children: node.children.map((c) => deepCloneWithFreshIds(c, freshId)),
  };
}

function freshIdGen(): () => string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return () => globalThis.crypto.randomUUID();
  }
  let i = 0;
  return () => `rc-${Date.now().toString(36)}-${(i++).toString(36)}`;
}

/* ───────── promote-on-delete ───────── */

function resolveCollision(
  candidateKey: string,
  existingKeys: Set<string>,
  strategy: "suffix" | "qualify" | "reject",
  qualifyPrefix: string,
): string | null {
  if (!existingKeys.has(candidateKey)) return candidateKey;
  if (strategy === "reject") return null;
  if (strategy === "qualify") {
    let qualified = `${qualifyPrefix}_${candidateKey}`;
    let i = 2;
    while (existingKeys.has(qualified)) {
      qualified = `${qualifyPrefix}_${candidateKey}_${i++}`;
    }
    return qualified;
  }
  // suffix _2 / _3 / ...
  let i = 2;
  while (existingKeys.has(`${candidateKey}_${i}`)) i++;
  return `${candidateKey}_${i}`;
}

/* ───────── reducer ───────── */

/** Take a snapshot of state slots that undo restores. */
function snapshot(state: RichCardState): UndoSnapshot {
  return {
    tree: state.tree,
    collapsed: state.collapsed,
    selectedIds: state.selectedIds,
    focusedId: state.focusedId,
  };
}

/** After a commit-action, push undo snapshot + clear redo + trim. */
function withUndoBookkeeping(
  prev: RichCardState,
  next: RichCardState,
): RichCardState {
  if (next.version === prev.version) return next; // not a commit
  const undoStack = [...prev.undoStack, snapshot(prev)];
  while (undoStack.length > prev.maxUndoDepth) {
    undoStack.shift();
  }
  return { ...next, undoStack, redoStack: [] };
}

export function reducer(
  state: RichCardState,
  action: RichCardAction,
): RichCardState {
  // v0.4 actions handled before delegating to innerReducer
  if (action.type === "undo") {
    if (state.undoStack.length === 0) return state;
    const snap = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);
    const newRedoStack = [...state.redoStack, snapshot(state)];
    return {
      ...state,
      tree: snap.tree,
      collapsed: snap.collapsed,
      selectedIds: snap.selectedIds,
      selectedId:
        snap.selectedIds.size > 0
          ? Array.from(snap.selectedIds)[0] ?? null
          : null,
      focusedId: snap.focusedId,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    };
  }
  if (action.type === "redo") {
    if (state.redoStack.length === 0) return state;
    const snap = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, -1);
    const newUndoStack = [...state.undoStack, snapshot(state)];
    return {
      ...state,
      tree: snap.tree,
      collapsed: snap.collapsed,
      selectedIds: snap.selectedIds,
      selectedId:
        snap.selectedIds.size > 0
          ? Array.from(snap.selectedIds)[0] ?? null
          : null,
      focusedId: snap.focusedId,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    };
  }
  if (action.type === "clear-history") {
    if (state.undoStack.length === 0 && state.redoStack.length === 0) return state;
    return { ...state, undoStack: [], redoStack: [] };
  }
  if (action.type === "set-max-undo-depth") {
    if (state.maxUndoDepth === action.depth) return state;
    const undoStack =
      state.undoStack.length > action.depth
        ? state.undoStack.slice(state.undoStack.length - action.depth)
        : state.undoStack;
    return { ...state, maxUndoDepth: action.depth, undoStack };
  }

  // All other actions → run through innerReducer + bookkeeping
  const next = innerReducer(state, action);
  return withUndoBookkeeping(state, next);
}

/** v0.1–v0.3 reducer logic, unchanged. */
function innerReducer(
  state: RichCardState,
  action: RichCardAction,
): RichCardState {
  switch (action.type) {
    /* v0.1 */
    case "toggle-collapse": {
      const next = new Set(state.collapsed);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      // Mirror to userCollapsed when search is inactive (so user-driven collapse persists across search clear)
      const userNext = state.searchQuery === "" ? next : state.userCollapsed;
      return { ...state, collapsed: next, userCollapsed: userNext };
    }
    case "set-focus": {
      if (state.focusedId === action.id) return state;
      return { ...state, focusedId: action.id };
    }
    case "replace-tree": {
      return createInitialState(action.tree, "none");
    }

    /* v0.2 selection + dirty */
    case "set-selection": {
      if (state.selectedId === action.id) return state;
      const ids = action.id ? new Set<string>([action.id]) : new Set<string>();
      return {
        ...state,
        selectedId: action.id,
        selectedIds: ids,
        selectionAnchorId: action.id,
      };
    }
    case "mark-clean": {
      if (state.cleanVersion === state.version) return state;
      return { ...state, cleanVersion: state.version };
    }

    /* v0.2 flat-field actions */
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

    /* v0.2 card actions */
    case "card-add": {
      const tree = updateNode(state.tree, action.parentId, (parent) => {
        const child = setLevelDeep(action.card, parent.level + 1);
        const next = [...parent.children, child].sort(
          (a, b) => a.order - b.order,
        );
        return { ...parent, children: next };
      });
      if (tree === state.tree) return state;
      const collapsed = new Set(state.collapsed);
      collapsed.delete(action.parentId);
      return { ...state, tree, collapsed, version: state.version + 1 };
    }
    case "card-remove": {
      const policy = action.policy ?? "cascade";
      const collisionStrategy = action.collisionStrategy ?? "suffix";

      // Find the card and its parent BEFORE removal
      const target = findCard(state.tree, action.cardId);
      if (!target) return state;

      // Promote first if requested
      let workingTree = state.tree;
      if (policy === "promote" && target.children.length > 0) {
        const parentId = findParentId(state.tree, action.cardId);
        if (parentId === null) {
          // Root; can't promote — fall back to cascade
        } else {
          // Compute promoted children with collision resolution
          const parent = findCard(state.tree, parentId)!;
          const existingKeys = new Set<string>([
            ...parent.children
              .filter((c) => c.id !== action.cardId)
              .map((c) => c.parentKey ?? "")
              .filter((k) => k.length > 0),
            ...parent.fields.map((f) => f.key),
          ]);

          const promoted: RichCardTree[] = [];
          for (const child of target.children) {
            const candidate = child.parentKey ?? `child_${child.id.slice(0, 8)}`;
            const resolved = resolveCollision(
              candidate,
              existingKeys,
              collisionStrategy,
              target.parentKey ?? "promoted",
            );
            if (resolved === null) {
              // reject mode: refuse this promotion
              return state;
            }
            existingKeys.add(resolved);
            promoted.push({ ...child, parentKey: resolved, level: parent.level + 1 });
          }

          workingTree = updateNode(state.tree, parentId, (p) => ({
            ...p,
            children: [
              ...p.children.filter((c) => c.id !== action.cardId),
              ...promoted.map((c) => setLevelDeep(c, p.level + 1)),
            ].sort((a, b) => a.order - b.order),
          }));

          const removedIds = new Set<string>([action.cardId]);
          // Note: descendants' IDs are preserved; only the removed card's id is dirty.
          const collapsed = new Set(state.collapsed);
          removedIds.forEach((id) => collapsed.delete(id));
          const focusedId = removedIds.has(state.focusedId ?? "")
            ? null
            : state.focusedId;
          const selectedIds = new Set(
            [...state.selectedIds].filter((id) => !removedIds.has(id)),
          );
          return {
            ...state,
            tree: workingTree,
            collapsed,
            focusedId,
            selectedId: selectedIds.size > 0 ? [...selectedIds][0] ?? null : null,
            selectedIds,
            version: state.version + 1,
          };
        }
      }

      // Cascade
      const result = removeNodeById(state.tree, action.cardId);
      if (!result.removed) return state;
      const removedIds = new Set<string>();
      collectIds(result.removed, removedIds);
      const collapsed = new Set(state.collapsed);
      removedIds.forEach((id) => collapsed.delete(id));
      const focusedId = removedIds.has(state.focusedId ?? "")
        ? null
        : state.focusedId;
      const selectedIds = new Set(
        [...state.selectedIds].filter((id) => !removedIds.has(id)),
      );
      return {
        ...state,
        tree: result.tree,
        collapsed,
        focusedId,
        selectedId: selectedIds.size > 0 ? [...selectedIds][0] ?? null : null,
        selectedIds,
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

    /* v0.2 predefined */
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

    /* v0.3 — multi-select */
    case "set-multi-selection": {
      const ids = new Set(action.ids);
      const anchor =
        action.anchor !== undefined
          ? action.anchor
          : action.ids.length > 0
            ? action.ids[action.ids.length - 1]
            : null;
      return {
        ...state,
        selectedIds: ids,
        selectedId: ids.size > 0 ? [...ids][0] ?? null : null,
        selectionAnchorId: anchor,
      };
    }
    case "toggle-selection": {
      const next = new Set(state.selectedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return {
        ...state,
        selectedIds: next,
        selectedId: next.size > 0 ? [...next][0] ?? null : null,
        selectionAnchorId: action.id,
      };
    }
    case "extend-selection-to": {
      // Range-select from anchor to action.id along visible-traversal order.
      const anchor = state.selectionAnchorId ?? action.id;
      const order = visibleIdsInOrder(state.tree, state.collapsed);
      const a = order.indexOf(anchor);
      const b = order.indexOf(action.id);
      if (a < 0 || b < 0) return state;
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      const range = order.slice(lo, hi + 1);
      const next = new Set([...state.selectedIds, ...range]);
      return {
        ...state,
        selectedIds: next,
        selectedId: next.size > 0 ? [...next][0] ?? null : null,
      };
    }
    case "clear-selection": {
      if (state.selectedIds.size === 0) return state;
      return {
        ...state,
        selectedIds: new Set<string>(),
        selectedId: null,
        selectionAnchorId: null,
      };
    }

    /* v0.3 — drag transient */
    case "drag-start": {
      return { ...state, draggingId: action.cardId };
    }
    case "drag-end": {
      if (state.draggingId === null) return state;
      return { ...state, draggingId: null };
    }

    /* v0.3 — card movement + duplicate */
    case "card-move": {
      // Remove the card from its current parent, then insert under newParentId at newOrder.
      const result = removeNodeById(state.tree, action.cardId);
      if (!result.removed) return state;
      const detached = result.removed;
      const inserted = updateNode(result.tree, action.newParentId, (parent) => ({
        ...parent,
        children: [
          ...parent.children,
          setLevelDeep({ ...detached, order: action.newOrder }, parent.level + 1),
        ].sort((a, b) => a.order - b.order),
      }));
      return { ...state, tree: inserted, version: state.version + 1 };
    }
    case "card-duplicate": {
      const source = findCard(state.tree, action.cardId);
      if (!source) return state;
      const parentId = findParentId(state.tree, action.cardId);
      if (parentId === null) return state; // can't duplicate root
      const fresh = freshIdGen();
      const clone = deepCloneWithFreshIds(source, fresh);
      // Override the top-level clone id with the supplied newCardId
      const cloneWithId: RichCardTree = {
        ...clone,
        id: action.newCardId,
        order: source.order + 0.5,
        parentKey: source.parentKey ? `${source.parentKey}_copy` : "copy",
      };
      const tree = updateNode(state.tree, parentId, (parent) => ({
        ...parent,
        children: [
          ...parent.children,
          setLevelDeep(cloneWithId, parent.level + 1),
        ].sort((a, b) => a.order - b.order),
      }));
      return { ...state, tree, version: state.version + 1 };
    }

    /* v0.3 — meta */
    case "meta-edit": {
      const tree = updateNode(state.tree, action.cardId, (card) => ({
        ...card,
        meta: { ...(card.meta ?? {}), [action.key]: action.value },
      }));
      if (tree === state.tree) return state;
      return { ...state, tree, version: state.version + 1 };
    }
    case "meta-add": {
      const tree = updateNode(state.tree, action.cardId, (card) => {
        if (card.meta && action.key in card.meta) return card;
        return {
          ...card,
          meta: { ...(card.meta ?? {}), [action.key]: action.value },
        };
      });
      if (tree === state.tree) return state;
      return { ...state, tree, version: state.version + 1 };
    }
    case "meta-remove": {
      const tree = updateNode(state.tree, action.cardId, (card) => {
        if (!card.meta || !(action.key in card.meta)) return card;
        const next = { ...card.meta };
        delete next[action.key];
        return { ...card, meta: Object.keys(next).length > 0 ? next : undefined };
      });
      if (tree === state.tree) return state;
      return { ...state, tree, version: state.version + 1 };
    }

    /* v0.3 — bulk */
    case "bulk-remove": {
      // Order ids deepest-first to avoid removing an ancestor before its descendants.
      const order = depthFirstDepthMap(state.tree);
      const sorted = [...action.cardIds]
        .filter((id) => id !== state.tree.id) // root protected
        .sort((a, b) => (order.get(b) ?? 0) - (order.get(a) ?? 0));
      let workingTree = state.tree;
      const allRemoved = new Set<string>();
      for (const id of sorted) {
        const result = removeNodeById(workingTree, id);
        if (result.removed) {
          collectIds(result.removed, allRemoved);
          workingTree = result.tree;
        }
      }
      if (allRemoved.size === 0) return state;
      const collapsed = new Set(state.collapsed);
      allRemoved.forEach((id) => collapsed.delete(id));
      const focusedId = allRemoved.has(state.focusedId ?? "") ? null : state.focusedId;
      const selectedIds = new Set(
        [...state.selectedIds].filter((id) => !allRemoved.has(id)),
      );
      return {
        ...state,
        tree: workingTree,
        collapsed,
        focusedId,
        selectedIds,
        selectedId: selectedIds.size > 0 ? [...selectedIds][0] ?? null : null,
        version: state.version + 1,
      };
    }

    /* v0.3 — search */
    case "set-search-query": {
      if (state.searchQuery === action.query) return state;
      const wasInactive = state.searchQuery === "";
      const isInactive = action.query === "";
      // When transitioning to active, snapshot user-collapsed state (if not already snapshotted).
      // When transitioning to inactive, restore user-collapsed state.
      if (wasInactive && !isInactive) {
        return {
          ...state,
          searchQuery: action.query,
          searchActiveIndex: 0,
          userCollapsed: state.collapsed,
        };
      }
      if (!wasInactive && isInactive) {
        return {
          ...state,
          searchQuery: "",
          searchActiveIndex: null,
          collapsed: state.userCollapsed,
        };
      }
      return { ...state, searchQuery: action.query };
    }
    case "set-active-match-index": {
      if (state.searchActiveIndex === action.index) return state;
      return { ...state, searchActiveIndex: action.index };
    }
    case "clear-search": {
      if (state.searchQuery === "") return state;
      return {
        ...state,
        searchQuery: "",
        searchActiveIndex: null,
        collapsed: state.userCollapsed,
      };
    }
    case "expand-path-to-matches": {
      // Remove these ancestor ids from collapsed (additively).
      if (action.ancestorIds.length === 0) return state;
      const next = new Set(state.collapsed);
      let changed = false;
      for (const id of action.ancestorIds) {
        if (next.delete(id)) changed = true;
      }
      return changed ? { ...state, collapsed: next } : state;
    }
    // v0.4 actions are handled by the outer reducer wrapper, so they should
    // never reach innerReducer. Listed here for exhaustiveness.
    case "undo":
    case "redo":
    case "clear-history":
    case "set-max-undo-depth":
      return state;
  }
}

/* ───────── traversal helpers ───────── */

function collectIds(node: RichCardTree, out: Set<string>): void {
  out.add(node.id);
  for (const c of node.children) collectIds(c, out);
}

/** Depth-first-traversal order map (id → traversal index). Used for deepest-first sort. */
function depthFirstDepthMap(tree: RichCardTree): Map<string, number> {
  const out = new Map<string, number>();
  walkDepth(tree, 0, out);
  return out;
}

function walkDepth(node: RichCardTree, depth: number, out: Map<string, number>): void {
  out.set(node.id, depth);
  for (const c of node.children) walkDepth(c, depth + 1, out);
}

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

export function findParentId(tree: RichCardTree, id: string): string | null {
  if (tree.id === id) return null;
  for (const child of tree.children) {
    if (child.id === id) return tree.id;
    const inSubtree = findParentId(child, id);
    if (inSubtree) return inSubtree;
  }
  return null;
}

export function findCard(tree: RichCardTree, id: string): RichCardTree | null {
  if (tree.id === id) return tree;
  for (const child of tree.children) {
    const found = findCard(child, id);
    if (found) return found;
  }
  return null;
}

/** Returns the chain of ancestor ids from root → parent (excluding the card itself). */
export function findAncestorIds(tree: RichCardTree, id: string): string[] {
  const out: string[] = [];
  walkAncestors(tree, id, [], out);
  return out;
}

function walkAncestors(
  node: RichCardTree,
  targetId: string,
  path: string[],
  out: string[],
): boolean {
  if (node.id === targetId) {
    out.push(...path);
    return true;
  }
  for (const c of node.children) {
    if (walkAncestors(c, targetId, [...path, node.id], out)) return true;
  }
  return false;
}
