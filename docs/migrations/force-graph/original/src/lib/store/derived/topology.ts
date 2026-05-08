import type { Edge, EndpointKind, EndpointRef } from "../../../types";
import type { GraphStoreState } from "../store-creator";

/**
 * Topology selectors — neighborsOf + parallelEdgesBetween. Pure functions
 * over the unified `edges` map (node↔node from graphology + group-involving
 * from groupEdges slice are merged by the store before this layer).
 *
 * v0.1 implementation is straightforward iteration; v0.4 may add an
 * adjacency-index slice if real-world consumers hit perf issues at high
 * edge counts.
 */

export function neighborsOf(
  state: Pick<GraphStoreState, "edges">,
  id: string,
  kind: EndpointKind,
): ReadonlyArray<EndpointRef> {
  const out: EndpointRef[] = [];
  const seen = new Set<string>();

  for (const edge of state.edges.values()) {
    if (edge.source.kind === kind && edge.source.id === id) {
      const key = endpointKey(edge.target);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(edge.target);
      }
    }
    if (edge.target.kind === kind && edge.target.id === id) {
      const key = endpointKey(edge.source);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(edge.source);
      }
    }
  }

  return out;
}

export function parallelEdgesBetween(
  state: Pick<GraphStoreState, "edges">,
  a: EndpointRef,
  b: EndpointRef,
): ReadonlyArray<Edge> {
  const out: Edge[] = [];
  const aKey = endpointKey(a);
  const bKey = endpointKey(b);

  for (const edge of state.edges.values()) {
    const sKey = endpointKey(edge.source);
    const tKey = endpointKey(edge.target);
    if (
      (sKey === aKey && tKey === bKey) ||
      (sKey === bKey && tKey === aKey)
    ) {
      out.push(edge);
    }
  }

  return out;
}

function endpointKey(ref: EndpointRef): string {
  return `${ref.kind}:${ref.id}`;
}
