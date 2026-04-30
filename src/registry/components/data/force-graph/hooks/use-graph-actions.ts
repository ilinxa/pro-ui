"use client";

import { useMemo } from "react";
import type { ActionsV01, Edge, GraphSnapshot, Node } from "../types";
import { useGraphologyAdapter } from "./use-graphology-adapter";
import { useGraphStoreContext } from "./use-graph-store";

/**
 * Per plan §4.3: v0.1 actions surface (~6 actions). Selection / hover /
 * undo / redo land in v0.2; CRUD lands in v0.3; group + filter actions
 * land in v0.4; search + multi-edge in v0.6.
 *
 * The hook composes the adapter + store + FA2 worker controls into a
 * single stable object. Memoized on the underlying handles so inline
 * destructuring (`const { importSnapshot } = useGraphActions()`) doesn't
 * trigger re-renders on unrelated state changes.
 *
 * Per plan §7.4: position commits + pin changes bump graphVersion in
 * v0.1 (the action exists for ref-based deep-link landings). Layout
 * toggle + rerun do NOT bump (geometry-irrelevant per §7.4).
 */
export function useGraphActions(): ActionsV01 {
  const adapter = useGraphologyAdapter();
  const { store, graph, worker } = useGraphStoreContext();

  return useMemo<ActionsV01>(
    () => ({
      importSnapshot(snapshot) {
        adapter.importSnapshot(snapshot);
      },

      exportSnapshot(): GraphSnapshot {
        const state = store.getState();
        // Read fresh positions from graphology — FA2 worker mutates x/y
        // directly without going through the store mirror Map.
        const nodes: Node[] = Array.from(state.nodes.values()).map((n) => {
          if (!graph.hasNode(n.id)) return n;
          const x = graph.getNodeAttribute(n.id, "x");
          const y = graph.getNodeAttribute(n.id, "y");
          if (typeof x === "number" && typeof y === "number") {
            return { ...n, position: { x, y } } as Node;
          }
          return n;
        });

        // Walk edgeOrder per decision #3 — preserves insertion order
        // across both storage layers (graphology native + groupEdges).
        const edges: Edge[] = [];
        for (const id of state.edgeOrder) {
          const edge = state.edges.get(id);
          if (edge) edges.push(edge);
        }

        return {
          version: "1.0",
          nodes,
          edges,
          groups: Array.from(state.groups.values()),
          nodeTypes: Array.from(state.nodeTypes.values()),
          edgeTypes: Array.from(state.edgeTypes.values()),
          settings: state.settings,
        };
      },

      setLayoutEnabled(enabled) {
        store.setState((state) => ({
          settings: { ...state.settings, layoutEnabled: enabled },
        }));
        worker.setEnabled(enabled);
      },

      rerunLayout() {
        worker.rerun();
      },

      pinAllPositions() {
        const state = store.getState();
        const nextNodes = new Map(state.nodes);
        for (const node of state.nodes.values()) {
          // Mirror in the store Map.
          nextNodes.set(node.id, { ...node, pinned: true } as Node);
          // Honor pin in graphology so FA2 skips the position update.
          if (graph.hasNode(node.id)) {
            graph.setNodeAttribute(node.id, "fixed", true);
            graph.setNodeAttribute(node.id, "pinned", true);
          }
        }
        store.setState((s) => ({
          nodes: nextNodes,
          graphVersion: s.graphVersion + 1,
        }));
      },

      setNodePositions(batch, options) {
        // `options.silent` reserved for v0.2 undo-stack control per
        // decision #7; v0.1 has no undo so the flag is read-but-no-op.
        void options?.silent;

        const state = store.getState();
        const nextNodes = new Map(state.nodes);

        for (const { id, x, y } of batch) {
          if (!graph.hasNode(id)) continue;
          graph.setNodeAttribute(id, "x", x);
          graph.setNodeAttribute(id, "y", y);
          const existing = state.nodes.get(id);
          if (existing) {
            nextNodes.set(id, { ...existing, position: { x, y } } as Node);
          }
        }

        store.setState((s) => ({
          nodes: nextNodes,
          graphVersion: s.graphVersion + 1,
        }));
      },
    }),
    [adapter, store, graph, worker],
  );
}
