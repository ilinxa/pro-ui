import type { TodoItem } from "../../todo-rich-card/types";
import type {
  TodoTreeAction,
  TodoTreeChangeReason,
  TodoTreeFilter,
  TodoTreeSort,
} from "../types";
import {
  insertAt,
  moveItem,
  removeById,
  updateById,
} from "./tree-mutators";
import { forEachItem } from "./tree-walker";

/**
 * Internal reducer state. Not exported from the package barrel — only
 * `useTodoTreeState` (C3) consumes it. Mutations are reference-equal on
 * no-ops so downstream selectors can memoize off identity.
 */
export interface State {
  items: TodoItem[];
  collapsedIds: ReadonlySet<string>;
  selectedIds: ReadonlySet<string>;
  selectionAnchorId: string | null;
  query: string;
  sort: TodoTreeSort;
  filter: TodoTreeFilter;
  focusedItemId: string | null;
  /**
   * Set by the reducer on every items-changing action; consumed by the
   * hook's items-change effect to route the correct reason to onChange.
   * Lives in state (vs an external ref) so raw-dispatch consumers route
   * correctly too. Non-items actions leave it untouched.
   */
  lastChangeReason: TodoTreeChangeReason | null;
}

export interface CreateInitialStateInput {
  items: TodoItem[];
  defaultCollapsedIds?: ReadonlyArray<string>;
  defaultSelectedIds?: ReadonlyArray<string>;
  defaultSort?: TodoTreeSort;
  defaultFilter?: TodoTreeFilter;
}

const DEFAULT_SORT: TodoTreeSort = { kind: "name", direction: "asc" };
const DEFAULT_FILTER: TodoTreeFilter = {
  statuses: [],
  personIds: [],
  active: "all",
};

export function createInitialState(input: CreateInitialStateInput): State {
  return {
    items: input.items,
    collapsedIds: new Set(input.defaultCollapsedIds ?? []),
    selectedIds: new Set(input.defaultSelectedIds ?? []),
    selectionAnchorId: null,
    query: "",
    sort: input.defaultSort ?? DEFAULT_SORT,
    filter: input.defaultFilter ?? DEFAULT_FILTER,
    focusedItemId: null,
    lastChangeReason: null,
  };
}

/**
 * Derive the public change reason from any items-changing action. Returns
 * null for non-items actions so the hook's effect can skip firing onChange.
 */
function reasonFromAction(
  action: TodoTreeAction,
): TodoTreeChangeReason | null {
  switch (action.type) {
    case "SET_ITEMS":
      return action.reason;
    case "ADD_ITEM":
      return action.via === "drop-from-external"
        ? "drop-from-external"
        : "add-item";
    case "REMOVE_ITEM":
      return "remove-item";
    case "REMOVE_ITEMS":
      return "bulk-remove";
    case "ADD_CHILD":
      return "add-child";
    case "MOVE_ITEM":
      return action.reason;
    case "TOGGLE_ACTIVE":
      return "toggle-active";
    case "TOGGLE_ACTIVE_BULK":
      return "bulk-toggle-active";
    default:
      return null;
  }
}

export function reducer(state: State, action: TodoTreeAction): State {
  const next = reducerInner(state, action);
  if (next === state) return state;
  if (next.items !== state.items) {
    const reason = reasonFromAction(action);
    return { ...next, lastChangeReason: reason };
  }
  return next;
}

function reducerInner(state: State, action: TodoTreeAction): State {
  switch (action.type) {
    case "SET_ITEMS": {
      if (action.items === state.items) return state;
      return pruneOrphanedIds({ ...state, items: action.items });
    }

    case "ADD_ITEM": {
      const items = insertAt(
        state.items,
        action.parentId,
        action.index,
        action.item,
      );
      if (items === state.items) return state;
      return { ...state, items };
    }

    case "REMOVE_ITEM": {
      const items = removeById(state.items, action.id);
      if (items === state.items) return state;
      return pruneOrphanedIds({ ...state, items });
    }

    case "REMOVE_ITEMS": {
      if (action.ids.length === 0) return state;
      let items = state.items;
      for (const id of action.ids) {
        items = removeById(items, id);
      }
      if (items === state.items) return state;
      return pruneOrphanedIds({ ...state, items });
    }

    case "ADD_CHILD": {
      const items = insertAt(
        state.items,
        action.parentId,
        action.index,
        action.item,
      );
      if (items === state.items) return state;
      const collapsedIds = withoutId(state.collapsedIds, action.parentId);
      return { ...state, items, collapsedIds };
    }

    case "MOVE_ITEM": {
      const items = moveItem(state.items, action.itemId, action.to);
      if (items === state.items) return state;
      const collapsedIds =
        action.to.parentId !== null
          ? withoutId(state.collapsedIds, action.to.parentId)
          : state.collapsedIds;
      return { ...state, items, collapsedIds };
    }

    case "TOGGLE_ACTIVE": {
      const items = updateById(state.items, action.id, (item) =>
        item.active === action.nextActive
          ? item
          : { ...item, active: action.nextActive },
      );
      if (items === state.items) return state;
      return { ...state, items };
    }

    case "TOGGLE_ACTIVE_BULK": {
      if (action.ids.length === 0) return state;
      const target = new Set(action.ids);
      let items = state.items;
      for (const id of target) {
        items = updateById(items, id, (item) =>
          item.active === action.nextActive
            ? item
            : { ...item, active: action.nextActive },
        );
      }
      if (items === state.items) return state;
      return { ...state, items };
    }

    case "TOGGLE_COLLAPSE": {
      const next = new Set(state.collapsedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, collapsedIds: next };
    }

    case "EXPAND_ALL": {
      if (state.collapsedIds.size === 0) return state;
      return { ...state, collapsedIds: new Set<string>() };
    }

    case "COLLAPSE_ALL": {
      const next = new Set<string>();
      forEachItem(state.items, (item) => {
        if (item.children && item.children.length > 0) next.add(item.id);
      });
      if (sameSet(next, state.collapsedIds)) return state;
      return { ...state, collapsedIds: next };
    }

    case "SET_COLLAPSED": {
      const next = new Set(action.ids);
      if (sameSet(next, state.collapsedIds)) return state;
      return { ...state, collapsedIds: next };
    }

    case "SELECT_ONE": {
      const { id, mode } = action;
      if (mode === "replace") {
        if (state.selectedIds.size === 1 && state.selectedIds.has(id)) {
          if (state.selectionAnchorId === id) return state;
          return { ...state, selectionAnchorId: id };
        }
        return {
          ...state,
          selectedIds: new Set([id]),
          selectionAnchorId: id,
        };
      }
      if (mode === "toggle") {
        const next = new Set(state.selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { ...state, selectedIds: next, selectionAnchorId: id };
      }
      // mode === "range" — DFS over the (unfiltered, uncollapsed) tree.
      // Visibility-aware range select is the hook's job: the hook computes the
      // visible-row id list using the consumer's filterMode and dispatches
      // SELECT_REPLACE with the resolved ids. This branch is the fallback for
      // raw `dispatch(SELECT_ONE/range)` users and works correctly when the
      // filter is inactive and nothing is collapsed.
      const anchor = state.selectionAnchorId;
      const rangeIds = computeUnfilteredRangeIds(state.items, anchor, id);
      if (rangeIds.length === 0) return state;
      const next = new Set(state.selectedIds);
      for (const r of rangeIds) next.add(r);
      return { ...state, selectedIds: next };
    }

    case "SELECT_ALL": {
      // Unfiltered: select every id in the tree. Visibility-aware select-all
      // is the hook's job; it uses SELECT_REPLACE with the visible-id list.
      const next = new Set<string>();
      forEachItem(state.items, (item) => {
        next.add(item.id);
      });
      if (sameSet(next, state.selectedIds)) return state;
      return { ...state, selectedIds: next };
    }

    case "SELECT_REPLACE": {
      const next = new Set(action.ids);
      const anchor =
        action.anchorId !== undefined
          ? action.anchorId
          : state.selectionAnchorId;
      if (
        sameSet(next, state.selectedIds) &&
        anchor === state.selectionAnchorId
      ) {
        return state;
      }
      return { ...state, selectedIds: next, selectionAnchorId: anchor };
    }

    case "CLEAR_SELECTION": {
      if (state.selectedIds.size === 0 && state.selectionAnchorId === null) {
        return state;
      }
      return {
        ...state,
        selectedIds: new Set<string>(),
        selectionAnchorId: null,
      };
    }

    case "SET_QUERY": {
      if (state.query === action.query) return state;
      return { ...state, query: action.query };
    }

    case "SET_SORT": {
      if (sortsEqual(state.sort, action.sort)) return state;
      return { ...state, sort: action.sort };
    }

    case "SET_FILTER": {
      if (filtersEqual(state.filter, action.filter)) return state;
      return { ...state, filter: action.filter };
    }

    case "CLEAR_FILTERS": {
      if (
        state.query === "" &&
        filtersEqual(state.filter, DEFAULT_FILTER)
      ) {
        return state;
      }
      return { ...state, query: "", filter: DEFAULT_FILTER };
    }
  }
}

/**
 * After a tree mutation, drop dangling ids from collapsedIds + selectedIds +
 * the selection anchor. Cheap (DFS over remaining items) and keeps Q7's "drop
 * silently" lock honored for selection.
 */
function pruneOrphanedIds(state: State): State {
  const live = new Set<string>();
  forEachItem(state.items, (item) => {
    live.add(item.id);
  });

  let collapsedIds = state.collapsedIds;
  let selectedIds = state.selectedIds;
  let anchor = state.selectionAnchorId;

  if (hasOrphan(collapsedIds, live)) {
    const next = new Set<string>();
    for (const id of collapsedIds) if (live.has(id)) next.add(id);
    collapsedIds = next;
  }
  if (hasOrphan(selectedIds, live)) {
    const next = new Set<string>();
    for (const id of selectedIds) if (live.has(id)) next.add(id);
    selectedIds = next;
  }
  if (anchor !== null && !live.has(anchor)) anchor = null;

  if (
    collapsedIds === state.collapsedIds &&
    selectedIds === state.selectedIds &&
    anchor === state.selectionAnchorId
  ) {
    return state;
  }
  return { ...state, collapsedIds, selectedIds, selectionAnchorId: anchor };
}

function hasOrphan(ids: ReadonlySet<string>, live: ReadonlySet<string>): boolean {
  for (const id of ids) if (!live.has(id)) return true;
  return false;
}

function withoutId(
  ids: ReadonlySet<string>,
  id: string,
): ReadonlySet<string> {
  if (!ids.has(id)) return ids;
  const next = new Set(ids);
  next.delete(id);
  return next;
}

function sameSet<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function sortsEqual(a: TodoTreeSort, b: TodoTreeSort): boolean {
  if (a === b) return true;
  if (a.kind !== b.kind) return false;
  if (a.kind === "custom" && b.kind === "custom") return a.compare === b.compare;
  if (a.kind !== "custom" && b.kind !== "custom") {
    return a.direction === b.direction;
  }
  return false;
}

function filtersEqual(a: TodoTreeFilter, b: TodoTreeFilter): boolean {
  if (a === b) return true;
  if ((a.active ?? "all") !== (b.active ?? "all")) return false;
  if (!arrEq(a.statuses ?? [], b.statuses ?? [])) return false;
  if (!arrEq(a.personIds ?? [], b.personIds ?? [])) return false;
  return true;
}

function arrEq<T>(a: ReadonlyArray<T>, b: ReadonlyArray<T>): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Range select fallback over the UNFILTERED tree in DFS order. The hook
 * supersedes this for visibility-aware ranges by dispatching SELECT_REPLACE
 * with pre-resolved ids; this only fires for raw `dispatch(SELECT_ONE/range)`.
 */
function computeUnfilteredRangeIds(
  items: ReadonlyArray<TodoItem>,
  anchor: string | null,
  target: string,
): string[] {
  const order: string[] = [];
  forEachItem(items, (item) => {
    order.push(item.id);
  });
  const targetIdx = order.indexOf(target);
  if (targetIdx === -1) return [];
  const anchorIdx = anchor === null ? 0 : order.indexOf(anchor);
  if (anchorIdx === -1) return [target];
  const [lo, hi] =
    anchorIdx <= targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
  return order.slice(lo, hi + 1);
}
