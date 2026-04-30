"use client";

import { useStore } from "zustand";
import type { ForceGraphState } from "../types";
import {
  deriveVisibleEdgeIds,
  deriveVisibleGroupIds,
  deriveVisibleNodeIds,
} from "../lib/store/derived/visible-ids";
import {
  neighborsOf,
  parallelEdgesBetween,
} from "../lib/store/derived/topology";
import type { GraphStoreState } from "../lib/store/store-creator";
import { useGraphStoreContext } from "./use-graph-store";

/**
 * Per plan §7.3 + decision #4: selectors that read graph data MUST
 * observe `graphVersion`. The hook touches it implicitly inside the
 * Zustand selector so consumers can't forget the dependency.
 *
 * `buildStateView` constructs the consumer-facing read view from the
 * underlying store state. Derived selectors (visibleNodeIds / topology)
 * are recomputed on each call in v0.1 since v0.1 has no filters; v0.4
 * adds memoization keyed on graphVersion + filter slice.
 *
 * Performance posture: consumers that select derived collections
 * (e.g., `s.derived.visibleNodeIds`) will currently re-render on every
 * graph mutation since the Set instance is fresh each call. v0.6 perf
 * hardening adds memoization. v0.1 callers should select primitives or
 * stable references where possible.
 */
export function useGraphSelector<T>(
  fn: (state: ForceGraphState) => T,
): T {
  const { store } = useGraphStoreContext();
  return useStore(store, (raw) => {
    void raw.graphVersion;
    return fn(buildStateView(raw));
  });
}

function buildStateView(raw: GraphStoreState): ForceGraphState {
  return {
    nodes: raw.nodes,
    edges: raw.edges,
    groups: raw.groups,
    nodeTypes: raw.nodeTypes,
    edgeTypes: raw.edgeTypes,
    settings: raw.settings,
    graphVersion: raw.graphVersion,
    derived: {
      visibleNodeIds: deriveVisibleNodeIds(raw),
      visibleEdgeIds: deriveVisibleEdgeIds(raw),
      visibleGroupIds: deriveVisibleGroupIds(raw),
      neighborsOf: (id, kind) => neighborsOf(raw, id, kind),
      parallelEdgesBetween: (a, b) => parallelEdgesBetween(raw, a, b),
    },
  };
}
