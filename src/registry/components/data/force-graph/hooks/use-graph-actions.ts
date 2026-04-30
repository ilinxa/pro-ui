"use client";

import { useMemo } from "react";
import type {
  ActionsV02,
  Edge,
  EndpointRef,
  GraphSnapshot,
  HistoryEntry,
  HoverState,
  Node,
  PrimitiveInverse,
  Selection,
} from "../types";
import { applyPrimitiveInverse } from "../lib/history/inverses";
import { buildHistoryEntry } from "../lib/history/composite";
import { useGraphologyAdapter } from "./use-graphology-adapter";
import { useGraphStoreContext } from "./use-graph-store";

/**
 * Per v0.2 plan §3.3: the action surface expands from V01 to V02 with
 * selection / hover / linking-mode / single-node-pin / undo / redo.
 *
 * Drag is INTERNAL: the interaction layer (A3) dispatches drag-coalesced
 * `HistoryEntry` pushes through `pushHistoryEntry` directly; there is
 * no public `drag` action.
 *
 * Per plan §9.1: only `setNodePositions(non-silent)` and `pinNode` push
 * history entries from this surface; selection / hover / linking are
 * "mode of operation" and intentionally NOT recorded.
 *
 * Per plan §9.4: `importSnapshot` clears history (replaces world). The
 * adapter does the data import; this wrapper appends the history reset.
 */
export function useGraphActions(): ActionsV02 {
  const adapter = useGraphologyAdapter();
  const { store, graph, worker } = useGraphStoreContext();

  return useMemo<ActionsV02>(
    () => ({
      // ── v0.1 actions (unchanged behavior except setNodePositions now records)
      importSnapshot(snapshot) {
        adapter.importSnapshot(snapshot);
        // v0.2: snapshot import clears both undo and redo stacks.
        store.setState({
          history: {
            entries: [],
            cursor: 0,
            canUndo: false,
            canRedo: false,
          },
        });
      },

      exportSnapshot(): GraphSnapshot {
        const state = store.getState();
        const nodes: Node[] = Array.from(state.nodes.values()).map((n) => {
          if (!graph.hasNode(n.id)) return n;
          const x = graph.getNodeAttribute(n.id, "x");
          const y = graph.getNodeAttribute(n.id, "y");
          if (typeof x === "number" && typeof y === "number") {
            return { ...n, position: { x, y } } as Node;
          }
          return n;
        });

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
        // Bulk pin is mode-of-operation (per Q-P6 + plan §9.1) — NOT
        // recorded.
        const state = store.getState();
        const nextNodes = new Map(state.nodes);
        for (const node of state.nodes.values()) {
          nextNodes.set(node.id, { ...node, pinned: true } as Node);
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
        const silent = options?.silent ?? false;
        const state = store.getState();
        const nextNodes = new Map(state.nodes);

        const inverses: PrimitiveInverse[] = [];
        const forwards: PrimitiveInverse[] = [];

        for (const { id, x, y } of batch) {
          if (!graph.hasNode(id)) continue;
          if (!silent) {
            const beforeX = numberOr(graph.getNodeAttribute(id, "x"), 0);
            const beforeY = numberOr(graph.getNodeAttribute(id, "y"), 0);
            inverses.push({ type: "setNodePosition", id, x: beforeX, y: beforeY });
            forwards.push({ type: "setNodePosition", id, x, y });
          }
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

        if (!silent && inverses.length > 0) {
          pushHistoryEntry(store, {
            label:
              batch.length === 1
                ? `Move node`
                : `Move ${batch.length} nodes`,
            inverses,
            forwards,
          });
        }
      },

      // ── v0.2 selection / hover (no graphVersion bump — plan §5.3)
      select(target: Selection) {
        store.setState((s) => ({ ui: { ...s.ui, selection: target } }));
      },

      clearSelection() {
        store.setState((s) => ({ ui: { ...s.ui, selection: null } }));
      },

      hover(target: HoverState) {
        store.setState((s) => ({ ui: { ...s.ui, hovered: target } }));
      },

      // ── v0.2 linking mode (no graphVersion bump — mode of operation)
      enterLinkingMode(source: EndpointRef) {
        store.setState((s) => ({
          ui: { ...s.ui, linkingMode: { active: true, source } },
        }));
      },

      exitLinkingMode() {
        store.setState((s) => ({
          ui: { ...s.ui, linkingMode: { active: false, source: null } },
        }));
      },

      // ── v0.2 single-node pin (recorded per plan §9.1)
      pinNode(id, pinned) {
        if (!graph.hasNode(id)) return;
        const before = graph.getNodeAttribute(id, "pinned") === true;
        if (before === pinned) return;

        graph.setNodeAttribute(id, "fixed", pinned);
        graph.setNodeAttribute(id, "pinned", pinned);

        const state = store.getState();
        const node = state.nodes.get(id);
        const nextNodes = new Map(state.nodes);
        if (node) {
          nextNodes.set(id, { ...node, pinned } as Node);
        }
        store.setState((s) => ({
          nodes: nextNodes,
          graphVersion: s.graphVersion + 1,
        }));

        const label = node?.label ?? id;
        pushHistoryEntry(
          store,
          buildHistoryEntry(`${pinned ? "Pin" : "Unpin"} ${label}`, [
            { type: "pinNode", id, before, after: pinned },
          ]),
        );
      },

      // ── v0.2 undo / redo
      undo() {
        const state = store.getState();
        if (state.history.cursor === 0) return;
        const entry = state.history.entries[state.history.cursor - 1];
        // Apply inverses in REVERSE order — per plan §9.2.
        for (let i = entry.inverses.length - 1; i >= 0; i--) {
          applyPrimitiveInverse(entry.inverses[i], { store, graph });
        }
        store.setState((s) => {
          const nextCursor = s.history.cursor - 1;
          return {
            history: {
              ...s.history,
              cursor: nextCursor,
              canUndo: nextCursor > 0,
              canRedo: nextCursor < s.history.entries.length,
            },
            graphVersion: s.graphVersion + 1,
          };
        });
      },

      redo() {
        const state = store.getState();
        if (state.history.cursor === state.history.entries.length) return;
        const entry = state.history.entries[state.history.cursor];
        // Apply forwards in FORWARD order — per plan §9.2 + Q-P6.
        for (const fwd of entry.forwards) {
          applyPrimitiveInverse(fwd, { store, graph });
        }
        store.setState((s) => {
          const nextCursor = s.history.cursor + 1;
          return {
            history: {
              ...s.history,
              cursor: nextCursor,
              canUndo: nextCursor > 0,
              canRedo: nextCursor < s.history.entries.length,
            },
            graphVersion: s.graphVersion + 1,
          };
        });
      },

      canUndo() {
        return store.getState().history.canUndo;
      },

      canRedo() {
        return store.getState().history.canRedo;
      },
    }),
    [adapter, store, graph, worker],
  );
}

/**
 * Per v0.2 plan §4.4: `push` truncates the redo stack if mid-history,
 * appends, and trims the oldest entry if at capacity. Internal helper —
 * the interaction layer (drag handler) calls this directly to commit
 * drag-coalesced entries; the action layer above goes through it for
 * `pinNode` and `setNodePositions`.
 */
export function pushHistoryEntry(
  store: ReturnType<typeof useGraphStoreContext>["store"],
  entry: HistoryEntry,
): void {
  store.setState((s) => {
    const capacity = s.settings.undoBufferSize;
    let entries = s.history.entries;

    // Truncate redo stack if pushing mid-history.
    if (s.history.cursor < entries.length) {
      entries = entries.slice(0, s.history.cursor);
    }

    entries = [...entries, entry];

    // Ring-buffer trim: drop the OLDEST entry when over capacity.
    if (entries.length > capacity) {
      entries = entries.slice(entries.length - capacity);
    }

    const cursor = entries.length;
    return {
      history: {
        entries,
        cursor,
        canUndo: cursor > 0,
        canRedo: false,
      },
    };
  });
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
