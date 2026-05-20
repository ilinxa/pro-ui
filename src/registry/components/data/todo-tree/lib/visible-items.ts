import type { TodoItem } from "../../todo-rich-card/types";
import type { TodoTreeFilter, TodoTreeSort } from "../types";
import {
  buildAncestorOfMatchSet,
  buildMatchMap,
  isFilterActive,
} from "./filter-items";
import { applySort } from "./sort-items";
import { flattenTree, type FlattenedRow } from "./flatten-tree";

export interface VisibleItemsInput {
  items: ReadonlyArray<TodoItem>;
  query: string;
  sort: TodoTreeSort;
  filter: TodoTreeFilter;
  collapsedIds: ReadonlySet<string>;
  /** Default "fade" per description doc; "hide" omits non-matching + non-ancestor rows. */
  filterMode: "fade" | "hide";
}

/**
 * Top-level pipeline orchestrator: items → filter → sort → flatten →
 * TodoTreeVisibleRow[] (with optional `dimmed` flag in fade mode).
 *
 * Order locked at Q-P5 (filter then sort then flatten). Memoize-friendly:
 * caller passes stable refs and the pipeline returns a new array only when
 * inputs actually change.
 */
export function computeVisibleItems(input: VisibleItemsInput): FlattenedRow[] {
  const { items, query, sort, filter, collapsedIds, filterMode } = input;
  const filterOn = isFilterActive(filter, query);
  const matchMap = filterOn ? buildMatchMap(items, filter, query) : undefined;
  const ancestorSet =
    filterOn && filterMode === "hide" && matchMap
      ? buildAncestorOfMatchSet(items, matchMap)
      : undefined;
  const sorted = applySort(items, sort);
  return flattenTree(sorted, {
    collapsedIds,
    mode: filterMode,
    matchMap,
    ancestorOfMatch: ancestorSet,
  });
}
