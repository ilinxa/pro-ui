import { create, type StoreApi, type UseBoundStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  Edge,
  EdgeType,
  Group,
  Node,
  NodeType,
} from "../../types";
import {
  createGroupEdgesSlice,
  type GroupEdgesSlice,
} from "./slices/group-edges-slice";
import { createUiSlice, type UiSlice } from "./slices/ui-slice";
import {
  createHistorySlice,
  type HistorySlice,
} from "./slices/history-slice";
import {
  createSettingsSlice,
  type SettingsSlice,
} from "./slices/settings-slice";

/**
 * Central Zustand store for force-graph.
 *
 * Per plan §7.2 + decision #3 + decision #4:
 *   - graphVersion is a monotonic counter bumped on every mutation that
 *     affects rendering. useGraphSelector observes it; consumers don't.
 *   - edgeOrder is a single array tracking edge IDs across both storage
 *     layers (graphology native + groupEdges slice).
 *   - subscribeWithSelector middleware enables fine-grained slice
 *     subscriptions (per plan §17.5 #1 — required for the panel-density
 *     use case from spec §5.4).
 *
 * Note: graphology MultiGraph instance lives OUTSIDE the Zustand store
 * (Q-P1: useRef inside the component). The store mirrors graphology's
 * node + edge data into reactive Maps so React panels can subscribe
 * without needing graphology APIs directly.
 */

export interface GraphStoreState
  extends GroupEdgesSlice,
    UiSlice,
    HistorySlice,
    SettingsSlice {
  // Reactive mirrors of graphology + type registries
  nodes: Map<string, Node>;
  edges: Map<string, Edge>; // unified — node↔node + group-involving merged for read
  groups: Map<string, Group>;
  nodeTypes: Map<string, NodeType>;
  edgeTypes: Map<string, EdgeType>;

  // Single edge order across both storage layers per #3
  edgeOrder: string[];

  // Bumped on every rendering-affecting mutation per #4
  graphVersion: number;

  // Internal mutators
  bumpGraphVersion(): void;
  setNodes(nodes: Map<string, Node>): void;
  setEdges(edges: Map<string, Edge>): void;
  setGroups(groups: Map<string, Group>): void;
  setNodeTypes(types: Map<string, NodeType>): void;
  setEdgeTypes(types: Map<string, EdgeType>): void;
  setEdgeOrder(order: string[]): void;
  resetGraph(): void;
}

export type GraphStore = UseBoundStore<StoreApi<GraphStoreState>>;

export function createGraphStore(): GraphStore {
  return create<GraphStoreState>()(
    subscribeWithSelector((set, get, api) => ({
      ...createGroupEdgesSlice(set, get, api),
      ...createUiSlice(set, get, api),
      ...createHistorySlice(set, get, api),
      ...createSettingsSlice(set, get, api),

      nodes: new Map(),
      edges: new Map(),
      groups: new Map(),
      nodeTypes: new Map(),
      edgeTypes: new Map(),
      edgeOrder: [],
      graphVersion: 0,

      bumpGraphVersion: () =>
        set((state) => ({ graphVersion: state.graphVersion + 1 })),

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setGroups: (groups) => set({ groups }),
      setNodeTypes: (nodeTypes) => set({ nodeTypes }),
      setEdgeTypes: (edgeTypes) => set({ edgeTypes }),
      setEdgeOrder: (edgeOrder) => set({ edgeOrder }),

      resetGraph: () =>
        set((state) => ({
          nodes: new Map(),
          edges: new Map(),
          groups: new Map(),
          nodeTypes: new Map(),
          edgeTypes: new Map(),
          edgeOrder: [],
          groupEdges: new Map(),
          graphVersion: state.graphVersion + 1,
        })),
    })),
  );
}
