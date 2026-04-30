"use client";

import { useEffect, useMemo, useRef } from "react";
import type {
  Edge,
  EdgeType,
  GraphDelta,
  GraphSnapshot,
  Group,
  Node,
  NodeType,
  ResolvedTheme,
} from "../types";
import { applyDelta } from "../lib/store/apply-delta";
import { softEdgeAttributes } from "../lib/edge-attributes";
import { sigmaNodeAttributes } from "../lib/node-attributes";
import { isGroupInvolvingEdge } from "../lib/store/slices/group-edges-slice";
import { useGraphStoreContext } from "./use-graph-store";

/**
 * Per plan §7.1: the graphologyAdapter wraps mutations to the imperative
 * graphology MultiGraph + bumps the reactive `graphVersion` counter so
 * subscribers re-fire.
 *
 * v0.1 only exercises `importSnapshot` (host bootstrap) and `applyDelta`
 * (live-source subscribe callback). Full CRUD lands in v0.3.
 *
 * Per plan §7.4: the bump happens once per logical mutation (a snapshot
 * import is one bump; a single delta is one bump). v0.3 batched
 * mutations bump once per batch.
 *
 * Per [#38][1] + plan §8.2: edge add computes per-edge `color`/`size`/
 * `type` attributes via `softEdgeAttributes()`; node add computes
 * `x`/`y`/`size`/`color`/`label`/`fixed` via `sigmaNodeAttributes()`.
 * Both pull from the resolved theme via `themeRef.current` — read at
 * call time, not as a memo dep, so theme flips don't recreate the
 * adapter (which would cascade into useSourceAdapter's deps and force
 * a re-bootstrap).
 *
 * Theme flips are handled by a graph-walk recompute in
 * `ForceGraphInner` — this adapter only handles add-time attribute
 * computation; the parent walks the graph + remerges attrs whenever
 * `resolvedTheme` changes.
 *
 * [1]: ../../../../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index
 */
export interface GraphologyAdapter {
  importSnapshot(snapshot: GraphSnapshot): void;
  applyDelta(delta: GraphDelta): void;
}

export function useGraphologyAdapter(): GraphologyAdapter {
  const { store, graph, theme } = useGraphStoreContext();

  // Mirror theme into a ref so `applyDelta` + `importSnapshot` see the
  // latest value without participating in the adapter's memo deps.
  const themeRef = useRef<ResolvedTheme>(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  return useMemo<GraphologyAdapter>(
    () => ({
      importSnapshot(snapshot) {
        const currentTheme = themeRef.current;

        // Step 1: clear graphology + store mirror Maps
        graph.clear();

        // Step 2: build type maps so per-node + per-edge attribute
        // computation can read them.
        const nodeTypeMap = new Map<string, NodeType>(
          snapshot.nodeTypes.map((nt) => [nt.id, nt]),
        );
        const edgeTypeMap = new Map<string, EdgeType>(
          snapshot.edgeTypes.map((et) => [et.id, et]),
        );

        // Step 3: load nodes; assign Sigma's required top-level attrs.
        const nodeMap = new Map<string, Node>();
        for (const node of snapshot.nodes) {
          const attrs = sigmaNodeAttributes(node, nodeTypeMap, currentTheme);
          graph.addNode(node.id, { ...node, ...attrs });
          nodeMap.set(node.id, node);
        }

        // Step 4: load edges; partition by group-involvement; assign
        // soft attributes to graphology-stored edges so Sigma renders
        // the #38 visual variant.
        const edgeMap = new Map<string, Edge>();
        const groupEdgeMap = new Map<string, Edge>();
        const edgeOrder: string[] = [];
        const groupMap = new Map<string, Group>(
          snapshot.groups.map((g) => [g.id, g]),
        );
        for (const edge of snapshot.edges) {
          edgeOrder.push(edge.id);
          edgeMap.set(edge.id, edge);
          if (isGroupInvolvingEdge(edge)) {
            groupEdgeMap.set(edge.id, edge);
          } else if (
            edge.source.kind === "node" &&
            edge.target.kind === "node"
          ) {
            const attrs = softEdgeAttributes(edge, {
              nodes: nodeMap,
              groups: groupMap,
              edgeTypes: edgeTypeMap,
              theme: currentTheme,
            });
            graph.addEdgeWithKey(
              edge.id,
              edge.source.id,
              edge.target.id,
              { ...edge, ...attrs },
            );
          }
        }

        // Step 5: commit + bump version atomically.
        store.setState((state) => ({
          nodes: nodeMap,
          edges: edgeMap,
          groupEdges: groupEdgeMap,
          groups: groupMap,
          nodeTypes: nodeTypeMap,
          edgeTypes: edgeTypeMap,
          edgeOrder,
          settings: snapshot.settings,
          graphVersion: state.graphVersion + 1,
        }));
      },

      applyDelta(delta) {
        const state = store.getState();
        applyDelta(
          graph,
          state,
          (updater) => store.setState(updater),
          delta,
          themeRef.current,
        );
        // Per plan §7.4: every delta bumps graphVersion. UI state is not
        // touched (decision #22). v0.2's cascade-on-delete activation
        // happens here when ui-slice gains real state.
        store.setState((s) => ({ graphVersion: s.graphVersion + 1 }));
      },
    }),
    [store, graph],
  );
}
