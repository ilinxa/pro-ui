import type { StateCreator } from "zustand";
import type { Edge } from "../../../types";

/**
 * Per spec §3.4 + plan §7.2: group-involving edges (one or both endpoints
 * are groups) live in a parallel store slice, not in graphology's
 * MultiGraph. Externally callers see one unified `edges[]`; internally
 * we partition.
 *
 * `edgeOrder` (single array, decision #3) lives in the central store —
 * not here. This slice tracks the edge data only.
 */

export interface GroupEdgesSlice {
  groupEdges: Map<string, Edge>;
  addGroupEdge(edge: Edge): void;
  updateGroupEdge(id: string, patch: Partial<Edge>): void;
  removeGroupEdge(id: string): void;
  clearGroupEdges(): void;
  setGroupEdges(edges: Map<string, Edge>): void;
}

export const createGroupEdgesSlice: StateCreator<
  GroupEdgesSlice,
  [],
  [],
  GroupEdgesSlice
> = (set) => ({
  groupEdges: new Map(),
  addGroupEdge: (edge) =>
    set((state) => {
      const next = new Map(state.groupEdges);
      next.set(edge.id, edge);
      return { groupEdges: next };
    }),
  updateGroupEdge: (id, patch) =>
    set((state) => {
      const existing = state.groupEdges.get(id);
      if (!existing) return state;
      const next = new Map(state.groupEdges);
      next.set(id, { ...existing, ...patch });
      return { groupEdges: next };
    }),
  removeGroupEdge: (id) =>
    set((state) => {
      const next = new Map(state.groupEdges);
      next.delete(id);
      return { groupEdges: next };
    }),
  clearGroupEdges: () => set({ groupEdges: new Map() }),
  setGroupEdges: (edges) => set({ groupEdges: edges }),
});

export function isGroupInvolvingEdge(edge: Edge): boolean {
  return edge.source.kind === "group" || edge.target.kind === "group";
}
