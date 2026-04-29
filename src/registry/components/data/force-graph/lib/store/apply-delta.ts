import type { MultiGraph } from "graphology";
import type { Edge, GraphDelta, Node } from "../../types";
import { isGroupInvolvingEdge } from "./slices/group-edges-slice";
import type { GraphStoreState } from "./store-creator";

/**
 * Apply a GraphDelta from a live source (subscribe callback) to local
 * state. Per decision #22: real-time deltas preserve UI state and do
 * NOT enter the undo stack.
 *
 * Routes by delta.type:
 *   - node deltas → graphology MultiGraph + bump graphVersion
 *   - edge deltas (node↔node) → graphology MultiGraph + bump graphVersion
 *   - edge deltas (group-involving) → groupEdges slice + bump
 *   - group deltas → groups Map + bump
 *   - membership deltas (addNodeToGroup / removeNodeFromGroup) → group +
 *     derived node.groupIds + bump
 */
export function applyDelta(
  graph: MultiGraph,
  store: GraphStoreState,
  setStore: (
    updater: (state: GraphStoreState) => Partial<GraphStoreState>,
  ) => void,
  delta: GraphDelta,
): void {
  switch (delta.type) {
    case "addNode": {
      addNodeToGraph(graph, delta.node);
      const nextNodes = new Map(store.nodes);
      nextNodes.set(delta.node.id, delta.node);
      setStore(() => ({ nodes: nextNodes }));
      break;
    }
    case "updateNode": {
      const existing = store.nodes.get(delta.id);
      if (!existing) return;
      const next = { ...existing, ...delta.patch } as Node;
      Object.entries(delta.patch).forEach(([k, v]) =>
        graph.setNodeAttribute(delta.id, k, v),
      );
      const nextNodes = new Map(store.nodes);
      nextNodes.set(delta.id, next);
      setStore(() => ({ nodes: nextNodes }));
      break;
    }
    case "deleteNode": {
      if (graph.hasNode(delta.id)) graph.dropNode(delta.id);
      const nextNodes = new Map(store.nodes);
      nextNodes.delete(delta.id);
      setStore(() => ({ nodes: nextNodes }));
      break;
    }
    case "addEdge": {
      if (isGroupInvolvingEdge(delta.edge)) {
        const next = new Map(store.groupEdges);
        next.set(delta.edge.id, delta.edge);
        setStore(() => ({ groupEdges: next, edges: mergedEdges(store.edges, delta.edge) }));
      } else {
        addEdgeToGraph(graph, delta.edge);
        setStore(() => ({ edges: mergedEdges(store.edges, delta.edge) }));
      }
      break;
    }
    case "updateEdge": {
      const existing = store.edges.get(delta.id);
      if (!existing) return;
      const next = { ...existing, ...delta.patch } as Edge;
      const nextEdges = new Map(store.edges);
      nextEdges.set(delta.id, next);
      if (isGroupInvolvingEdge(next)) {
        const nextGroupEdges = new Map(store.groupEdges);
        nextGroupEdges.set(delta.id, next);
        setStore(() => ({ edges: nextEdges, groupEdges: nextGroupEdges }));
      } else if (graph.hasEdge(delta.id)) {
        Object.entries(delta.patch).forEach(([k, v]) =>
          graph.setEdgeAttribute(delta.id, k, v),
        );
        setStore(() => ({ edges: nextEdges }));
      }
      break;
    }
    case "deleteEdge": {
      const nextEdges = new Map(store.edges);
      nextEdges.delete(delta.id);
      const nextGroupEdges = new Map(store.groupEdges);
      const wasGroup = nextGroupEdges.delete(delta.id);
      if (!wasGroup && graph.hasEdge(delta.id)) graph.dropEdge(delta.id);
      setStore(() => ({ edges: nextEdges, groupEdges: nextGroupEdges }));
      break;
    }
    case "addGroup": {
      const next = new Map(store.groups);
      next.set(delta.group.id, delta.group);
      setStore(() => ({ groups: next }));
      break;
    }
    case "updateGroup": {
      const existing = store.groups.get(delta.id);
      if (!existing) return;
      const next = new Map(store.groups);
      next.set(delta.id, { ...existing, ...delta.patch });
      setStore(() => ({ groups: next }));
      break;
    }
    case "deleteGroup": {
      const next = new Map(store.groups);
      next.delete(delta.id);
      setStore(() => ({ groups: next }));
      break;
    }
    case "addNodeToGroup":
    case "removeNodeFromGroup": {
      const group = store.groups.get(delta.groupId);
      const node = store.nodes.get(delta.nodeId);
      if (!group || !node) return;
      const adding = delta.type === "addNodeToGroup";

      const nextMembers = adding
        ? group.memberNodeIds.includes(delta.nodeId)
          ? group.memberNodeIds
          : [...group.memberNodeIds, delta.nodeId]
        : group.memberNodeIds.filter((id) => id !== delta.nodeId);

      const nextGroupIds = adding
        ? node.groupIds.includes(delta.groupId)
          ? node.groupIds
          : [...node.groupIds, delta.groupId]
        : node.groupIds.filter((id) => id !== delta.groupId);

      const nextGroups = new Map(store.groups);
      nextGroups.set(delta.groupId, { ...group, memberNodeIds: nextMembers });
      const nextNodes = new Map(store.nodes);
      nextNodes.set(delta.nodeId, { ...node, groupIds: nextGroupIds } as Node);
      setStore(() => ({ groups: nextGroups, nodes: nextNodes }));
      break;
    }
  }
}

function addNodeToGraph(graph: MultiGraph, node: Node): void {
  graph.addNode(node.id, { ...node });
}

function addEdgeToGraph(graph: MultiGraph, edge: Edge): void {
  if (edge.source.kind !== "node" || edge.target.kind !== "node") return;
  graph.addEdgeWithKey(edge.id, edge.source.id, edge.target.id, { ...edge });
}

function mergedEdges(
  current: ReadonlyMap<string, Edge>,
  edge: Edge,
): Map<string, Edge> {
  const next = new Map(current);
  next.set(edge.id, edge);
  return next;
}
