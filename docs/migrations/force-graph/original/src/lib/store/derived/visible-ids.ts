import type { GraphStoreState } from "../store-creator";

/**
 * v0.1 derived selectors — "visible" === "all" since filters land in v0.4
 * (decision #12 search-overrides-filters lands in v0.6 with search).
 *
 * Returns ReadonlySets so consumers can't mutate. The sets are
 * recomputed on each call; v0.4 will introduce memoization on top of
 * graphVersion + filter slice once filters exist.
 */

export function deriveVisibleNodeIds(
  state: Pick<GraphStoreState, "nodes">,
): ReadonlySet<string> {
  return new Set(state.nodes.keys());
}

export function deriveVisibleEdgeIds(
  state: Pick<GraphStoreState, "edges">,
): ReadonlySet<string> {
  return new Set(state.edges.keys());
}

export function deriveVisibleGroupIds(
  state: Pick<GraphStoreState, "groups">,
): ReadonlySet<string> {
  return new Set(state.groups.keys());
}
