"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { TodoItem } from "../../todo-rich-card/types";
import type {
  TodoTreeChangeArgs,
  TodoTreeFilter,
  TodoTreeHandle,
  TodoTreeSort,
  TodoTreeStateValue,
  TodoTreeVisibleRow,
} from "../types";
import {
  createInitialState,
  reducer,
  type State,
} from "../lib/reducer";
import { computeVisibleItems } from "../lib/visible-items";
import { findItemById } from "../lib/tree-walker";
import { useControlledMode } from "./use-controlled-mode";
import { useTreeEvents, type TreeEventCallbacks } from "./use-tree-events";
import { useSelection } from "./use-selection";

export interface UseTodoTreeStateArgs extends TreeEventCallbacks {
  defaultValue?: TodoItem[];
  value?: TodoItem[];
  onChange?: (args: TodoTreeChangeArgs) => void;
  defaultCollapsedIds?: ReadonlyArray<string>;
  defaultSelectedIds?: ReadonlyArray<string>;
  defaultSort?: TodoTreeSort;
  defaultFilter?: TodoTreeFilter;
  /** Default "fade"; "hide" omits non-matching + non-ancestor-of-match rows. */
  filterMode?: "fade" | "hide";
}

/**
 * Headless state hook. Owns the reducer + visible-item pipeline + event
 * dispatch + controlled-mode wiring. Returns a TodoTreeStateValue that lifts
 * cleanly into custom toolbars / virtualization layers / external state
 * managers, OR can be fed back into `<TodoTree state={state} />` so the
 * default tree shell drives the same engine.
 *
 * Visibility-aware ops (select-all, range-select via the handle) are
 * resolved here against the current visibleItems snapshot using the
 * consumer's filterMode, then dispatched as SELECT_REPLACE.
 */
export function useTodoTreeState(
  args: UseTodoTreeStateArgs,
): TodoTreeStateValue {
  const {
    defaultValue,
    value,
    onChange,
    defaultCollapsedIds,
    defaultSelectedIds,
    defaultSort,
    defaultFilter,
    filterMode = "fade",
    ...eventCallbacks
  } = args;

  // Initializer fires once at mount; controlled `value` wins over defaultValue.
  type InitArg = {
    initial: TodoItem[];
    collapsed: ReadonlyArray<string> | undefined;
    selected: ReadonlyArray<string> | undefined;
    sort: TodoTreeSort | undefined;
    filter: TodoTreeFilter | undefined;
  };
  const initArg: InitArg = {
    initial: value ?? defaultValue ?? [],
    collapsed: defaultCollapsedIds,
    selected: defaultSelectedIds,
    sort: defaultSort,
    filter: defaultFilter,
  };

  const [state, dispatch] = useReducer(
    reducer,
    initArg,
    (init: InitArg): State =>
      createInitialState({
        items: init.initial,
        defaultCollapsedIds: init.collapsed,
        defaultSelectedIds: init.selected,
        defaultSort: init.sort,
        defaultFilter: init.filter,
      }),
  );

  const visibleItems = useMemo<ReadonlyArray<TodoTreeVisibleRow>>(
    () =>
      computeVisibleItems({
        items: state.items,
        query: state.query,
        sort: state.sort,
        filter: state.filter,
        collapsedIds: state.collapsedIds,
        filterMode,
      }),
    [
      state.items,
      state.query,
      state.sort,
      state.filter,
      state.collapsedIds,
      filterMode,
    ],
  );

  const applyExternalItems = useCallback(
    (next: TodoItem[]) => {
      dispatch({ type: "SET_ITEMS", items: next, reason: "imperative-set" });
    },
    [dispatch],
  );

  const { fireOnChange } = useControlledMode({
    value,
    internalItems: state.items,
    onChange,
    applyExternalItems,
  });

  const { fire } = useTreeEvents(eventCallbacks);
  const fireRef = useRef(fire);
  useEffect(() => {
    fireRef.current = fire;
  }, [fire]);

  // Track previous state to wire selection / search / sort / filter events.
  const prevSelectedIdsRef = useRef(state.selectedIds);
  const prevQueryRef = useRef(state.query);
  const prevSortRef = useRef(state.sort);
  const prevFilterRef = useRef(state.filter);
  const prevItemsRef = useRef(state.items);
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      prevSelectedIdsRef.current = state.selectedIds;
      prevQueryRef.current = state.query;
      prevSortRef.current = state.sort;
      prevFilterRef.current = state.filter;
      prevItemsRef.current = state.items;
      return;
    }
    if (state.selectedIds !== prevSelectedIdsRef.current) {
      prevSelectedIdsRef.current = state.selectedIds;
      fireRef.current("selectionChanged", { selectedIds: state.selectedIds });
    }
    if (state.query !== prevQueryRef.current) {
      prevQueryRef.current = state.query;
      fireRef.current("searchChanged", { query: state.query });
    }
    if (state.sort !== prevSortRef.current) {
      prevSortRef.current = state.sort;
      fireRef.current("sortChanged", { sort: state.sort });
    }
    if (state.filter !== prevFilterRef.current) {
      prevFilterRef.current = state.filter;
      fireRef.current("filterChanged", { filter: state.filter });
    }
    if (state.items !== prevItemsRef.current) {
      prevItemsRef.current = state.items;
      // onChange is wired through controlled-mode's microtask-deferred path
      // so consumer setState doesn't fire mid-render.
      fireOnChange(state.items, "imperative-set");
    }
  }, [
    state.selectedIds,
    state.query,
    state.sort,
    state.filter,
    state.items,
    fireOnChange,
  ]);

  const selection = useSelection({
    visibleItems,
    selectionAnchorId: state.selectionAnchorId,
    selectedIds: state.selectedIds,
    dispatch,
    onItemClick: args.onItemClick,
  });

  // Build the 26-method imperative handle.
  const handle = useMemo<TodoTreeHandle>(() => {
    return {
      getValue: () => state.items,
      setValue: (next) => {
        dispatch({ type: "SET_ITEMS", items: next, reason: "imperative-set" });
      },
      addItem: (item, opts) => {
        const parentId = opts?.parentId ?? null;
        dispatch({
          type: "ADD_ITEM",
          item,
          parentId,
          index: opts?.index,
          via: "imperative",
        });
        fireRef.current("itemAdded", {
          item,
          parentId,
          index: opts?.index ?? -1,
          via: "imperative",
        });
      },
      removeItem: (id) => {
        const item = findItemById(state.items, id);
        if (!item) return;
        dispatch({ type: "REMOVE_ITEM", id, via: "imperative" });
        fireRef.current("itemRemoved", { item, via: "imperative" });
      },
      addChild: (parentId, item, index) => {
        dispatch({ type: "ADD_CHILD", parentId, item, index });
        fireRef.current("itemAdded", {
          item,
          parentId,
          index: index ?? -1,
          via: "imperative",
        });
      },
      removeItems: (ids) => {
        if (ids.length === 0) return;
        dispatch({ type: "REMOVE_ITEMS", ids });
        fireRef.current("bulkRemove", { ids });
      },
      toggleActive: (id, nextActive) => {
        const item = findItemById(state.items, id);
        if (!item) return;
        dispatch({ type: "TOGGLE_ACTIVE", id, nextActive });
        fireRef.current("activeToggled", { item, nextActive });
      },
      toggleActiveBulk: (ids, nextActive) => {
        if (ids.length === 0) return;
        dispatch({ type: "TOGGLE_ACTIVE_BULK", ids, nextActive });
        fireRef.current("bulkToggleActive", { ids, nextActive });
      },
      focusItem: () => {
        // Focus is a DOM concern; the list view subscribes to state.focusedItemId
        // and calls focus() on the matching row. C5 wires the subscription.
        // Reducer doesn't track focus yet — placeholder.
      },
      getItemById: (id) => findItemById(state.items, id),
      expandItem: (id) => {
        if (!state.collapsedIds.has(id)) return;
        dispatch({ type: "TOGGLE_COLLAPSE", id });
        const item = findItemById(state.items, id);
        if (item) {
          fireRef.current("collapseToggled", { item, collapsed: false });
        }
      },
      collapseItem: (id) => {
        if (state.collapsedIds.has(id)) return;
        dispatch({ type: "TOGGLE_COLLAPSE", id });
        const item = findItemById(state.items, id);
        if (item) {
          fireRef.current("collapseToggled", { item, collapsed: true });
        }
      },
      toggleCollapse: (id) => {
        const wasCollapsed = state.collapsedIds.has(id);
        dispatch({ type: "TOGGLE_COLLAPSE", id });
        const item = findItemById(state.items, id);
        if (item) {
          fireRef.current("collapseToggled", {
            item,
            collapsed: !wasCollapsed,
          });
        }
      },
      expandAll: () => {
        dispatch({ type: "EXPAND_ALL" });
      },
      collapseAll: () => {
        dispatch({ type: "COLLAPSE_ALL" });
      },
      isCollapsed: (id) => state.collapsedIds.has(id),
      selectItem: (id) => {
        dispatch({ type: "SELECT_ONE", id, mode: "toggle" });
      },
      deselectItem: (id) => {
        if (!state.selectedIds.has(id)) return;
        dispatch({ type: "SELECT_ONE", id, mode: "toggle" });
      },
      selectRange: selection.selectRange,
      selectAll: selection.selectAllVisible,
      clearSelection: () => {
        dispatch({ type: "CLEAR_SELECTION" });
      },
      getSelectedIds: () => state.selectedIds,
      setQuery: (query) => {
        dispatch({ type: "SET_QUERY", query });
      },
      setSort: (sort) => {
        dispatch({ type: "SET_SORT", sort });
      },
      setFilter: (filter) => {
        dispatch({ type: "SET_FILTER", filter });
      },
      clearAllFilters: () => {
        dispatch({ type: "CLEAR_FILTERS" });
      },
    };
  }, [
    state.items,
    state.collapsedIds,
    state.selectedIds,
    dispatch,
    selection.selectRange,
    selection.selectAllVisible,
  ]);

  // Compose the public state value. Spread the handle so all 26 methods land
  // on the result. State fields layer on top.
  return useMemo<TodoTreeStateValue>(
    () => ({
      ...handle,
      items: state.items,
      visibleItems,
      collapsedIds: state.collapsedIds,
      selectedIds: state.selectedIds,
      query: state.query,
      sort: state.sort,
      filter: state.filter,
      dispatch,
    }),
    [
      handle,
      state.items,
      visibleItems,
      state.collapsedIds,
      state.selectedIds,
      state.query,
      state.sort,
      state.filter,
      dispatch,
    ],
  );
}
