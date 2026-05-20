import type { TodoItem } from "../../todo-rich-card/types";
import type { TodoTreeFilter } from "../types";
import { forEachItem } from "./tree-walker";
import { itemMatchesQuery } from "./search-items";

/**
 * Build a match-flag map: `true` when the item matches BOTH the filter spec
 * AND the search query, after normalization. The flatten pass uses this to
 * decide what to dim (fade mode) or hide (hide mode, with ancestor-of-match
 * still rendered).
 *
 * Filter spec interpretation:
 *   - statuses: empty array OR undefined ⇒ all statuses pass
 *   - personIds: empty array OR undefined ⇒ all persons pass; matches against
 *     both targetPerson.id AND creatorPerson.id (either hits qualifies)
 *   - active: "all" (default) | "active" | "inactive"
 */
export function buildMatchMap(
  items: ReadonlyArray<TodoItem>,
  filter: TodoTreeFilter,
  query: string,
): ReadonlyMap<string, boolean> {
  const map = new Map<string, boolean>();
  const statuses = filter.statuses;
  const personIds = filter.personIds;
  const active = filter.active ?? "all";
  const hasStatusFilter = statuses && statuses.length > 0;
  const hasPersonFilter = personIds && personIds.length > 0;
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  forEachItem(items, (item) => {
    let pass = true;
    if (hasStatusFilter && !statuses.includes(item.status)) pass = false;
    if (pass && hasPersonFilter) {
      const targetId = item.targetPerson?.id;
      const creatorId = item.creatorPerson?.id;
      const ok =
        (targetId !== undefined && personIds.includes(targetId)) ||
        (creatorId !== undefined && personIds.includes(creatorId));
      if (!ok) pass = false;
    }
    if (pass && active === "active" && !item.active) pass = false;
    if (pass && active === "inactive" && item.active) pass = false;
    if (pass && hasQuery && !itemMatchesQuery(item, trimmed)) pass = false;
    map.set(item.id, pass);
  });

  return map;
}

/**
 * Build the ancestor-of-match set used by `filterMode: "hide"` to ensure that
 * even non-matching ancestors render so the matched descendants stay visible
 * in tree context (VSCode-style — Q6 lock).
 */
export function buildAncestorOfMatchSet(
  items: ReadonlyArray<TodoItem>,
  matchMap: ReadonlyMap<string, boolean>,
): ReadonlySet<string> {
  const out = new Set<string>();
  function walk(nodes: ReadonlyArray<TodoItem>): boolean {
    let any = false;
    for (const node of nodes) {
      const selfMatch = matchMap.get(node.id) === true;
      let descendantMatch = false;
      if (node.children && node.children.length > 0) {
        descendantMatch = walk(node.children);
      }
      if (descendantMatch && !selfMatch) {
        out.add(node.id);
      }
      if (selfMatch || descendantMatch) any = true;
    }
    return any;
  }
  walk(items);
  return out;
}

/**
 * Convenience: true when ANY entry in the filter spec or query is non-empty.
 * Used by the empty state ("no results for filter X") and toolbar
 * clear-filters affordance gating.
 */
export function isFilterActive(filter: TodoTreeFilter, query: string): boolean {
  if (query.trim().length > 0) return true;
  if (filter.statuses && filter.statuses.length > 0) return true;
  if (filter.personIds && filter.personIds.length > 0) return true;
  if (filter.active && filter.active !== "all") return true;
  return false;
}
