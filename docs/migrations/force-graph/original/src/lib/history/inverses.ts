import type { MultiGraph } from "graphology";
import type { Node, PrimitiveInverse } from "../../types";
import type { GraphStore } from "../store/store-creator";

/**
 * Per v0.2 plan §9.2: a pure dispatcher that applies a single
 * `PrimitiveInverse` to both the imperative graphology graph AND the
 * Zustand store mirror. Used by `undo()` (applies `entry.inverses` in
 * REVERSE order) and `redo()` (applies `entry.forwards` in FORWARD
 * order) — the same primitive shape works for both directions.
 *
 * The store's `graphVersion` is NOT bumped here; the caller (`undo` /
 * `redo`) bumps once per entry to coalesce N primitive applications
 * into a single re-render.
 */
export interface InverseApplyContext {
  store: GraphStore;
  graph: MultiGraph;
}

export function applyPrimitiveInverse(
  inverse: PrimitiveInverse,
  ctx: InverseApplyContext,
): void {
  const { store, graph } = ctx;
  switch (inverse.type) {
    case "setNodePosition": {
      if (!graph.hasNode(inverse.id)) return;
      graph.setNodeAttribute(inverse.id, "x", inverse.x);
      graph.setNodeAttribute(inverse.id, "y", inverse.y);
      const state = store.getState();
      const node = state.nodes.get(inverse.id);
      if (node) {
        const next = new Map(state.nodes);
        next.set(inverse.id, {
          ...node,
          position: { x: inverse.x, y: inverse.y },
        } as Node);
        store.setState({ nodes: next });
      }
      return;
    }
    case "pinNode": {
      if (!graph.hasNode(inverse.id)) return;
      graph.setNodeAttribute(inverse.id, "fixed", inverse.pinned);
      graph.setNodeAttribute(inverse.id, "pinned", inverse.pinned);
      const state = store.getState();
      const node = state.nodes.get(inverse.id);
      if (node) {
        const next = new Map(state.nodes);
        next.set(inverse.id, { ...node, pinned: inverse.pinned } as Node);
        store.setState({ nodes: next });
      }
      return;
    }
    case "noop":
      return;
  }
}
