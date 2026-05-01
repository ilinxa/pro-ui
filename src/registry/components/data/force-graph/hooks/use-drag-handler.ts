"use client";

import { useEffect } from "react";
import type Sigma from "sigma";
import type { MultiGraph } from "graphology";
import type { Node, PrimitiveInverse } from "../types";
import type { GraphStore } from "../lib/store/store-creator";
import { pushHistoryEntry } from "../lib/history/push";
import { useGraphStoreContext } from "./use-graph-store";

/**
 * Per v0.2 plan §7: drag-to-pin with drag-coalesced history.
 *
 * Lifecycle:
 *   1. `downNode` → capture start position; mark graphology `fixed:
 *      true` so FA2 stops fighting the cursor; record `dragState` in
 *      the UI slice; call `event.preventSigmaDefault()` so Sigma's
 *      stage-pan doesn't engage simultaneously.
 *   2. `moveBody` → translate the cursor to graph coords and update
 *      the dragged node's x/y. No graphVersion bump during the drag —
 *      Sigma re-renders via its own subscription to graphology events;
 *      React panels stay quiet.
 *   3. `getMouseCaptor() mouseup` → auto-pin on drop, push ONE history
 *      entry coalescing position + (optional) pin change, bump
 *      graphVersion once, clear dragState.
 *
 * Per plan §7.3: the drag flow uses `graph.setNodeAttribute` directly
 * — it does NOT route through the `setNodePositions` action (which is
 * for procedural placement). The action / history surfaces stay
 * decoupled.
 *
 * Coordinate note: `event.x` / `event.y` from Sigma's mouse captor are
 * already CONTAINER-relative (Sigma applies `getBoundingClientRect()`
 * in `getMouseCoords`). Passing them straight to `viewportToGraph`
 * gives the right graph-space position. Using raw `clientX/Y` from
 * window pointer events would teleport the node by the container's
 * offset.
 *
 * FA2 suspension: `graphology-layout-forceatlas2/worker` builds its
 * position matrix once at `start()` and only re-reads the graph on
 * add/drop events — `nodeAttributesUpdated` is NOT observed. Setting
 * `fixed: true` mid-flight is therefore invisible to the worker, and
 * its `assignLayoutChanges` writes the matrix's stale position back to
 * the dragged node every iteration, fighting the cursor (visible flicker
 * during drag; node "snaps back" on release because FA2 keeps writing
 * its pre-drag position). We pause the worker on `downNode` and resume
 * on `mouseup` — `setEnabled(true)` triggers `start()` which rebuilds
 * the matrix and picks up the new `fixed`/`pinned` state.
 */
export function useDragHandler(
  sigma: Sigma | null,
  graph: MultiGraph,
  store: GraphStore,
): void {
  const { worker } = useGraphStoreContext();
  useEffect(() => {
    if (!sigma) return;
    let suspended = false;

    interface SigmaMouseCoords {
      x: number;
      y: number;
      preventSigmaDefault: () => void;
      original: Event;
    }
    interface SigmaNodeEvent {
      node: string;
      event: SigmaMouseCoords;
      preventSigmaDefault: () => void;
    }
    interface SigmaMoveBodyEvent {
      event: SigmaMouseCoords;
      preventSigmaDefault: () => void;
    }

    const onDownNode = (payload: SigmaNodeEvent): void => {
      const node = payload.node;
      const startX = numberOr(graph.getNodeAttribute(node, "x"), 0);
      const startY = numberOr(graph.getNodeAttribute(node, "y"), 0);
      // Suppress FA2 layout for the dragged node during drag. The
      // graphology attribute is the persistent record (used by
      // `sigmaNodeAttributes` and the worker's matrix on next `start()`);
      // pausing the worker is what actually stops it from overwriting
      // the cursor position this gesture.
      graph.setNodeAttribute(node, "fixed", true);
      if (store.getState().settings.layoutEnabled) {
        worker.setEnabled(false);
        suspended = true;
      }
      store.setState((s) => ({
        ui: { ...s.ui, dragState: { activeNodeId: node, startX, startY } },
      }));
      // Suppress Sigma's stage panning for the duration of the drag.
      payload.event.preventSigmaDefault();
      payload.event.original.preventDefault?.();
    };

    const onMoveBody = (payload: SigmaMoveBodyEvent): void => {
      const dragState = store.getState().ui.dragState;
      if (!dragState) return;
      // event.x / event.y are container-relative — pass directly.
      const pos = sigma.viewportToGraph({
        x: payload.event.x,
        y: payload.event.y,
      });
      graph.setNodeAttribute(dragState.activeNodeId, "x", pos.x);
      graph.setNodeAttribute(dragState.activeNodeId, "y", pos.y);
      payload.event.preventSigmaDefault();
    };

    const captor = sigma.getMouseCaptor();
    const onMouseUp = (): void => {
      const state = store.getState();
      const dragState = state.ui.dragState;
      if (!dragState) return;
      const { activeNodeId, startX, startY } = dragState;
      const endX = numberOr(graph.getNodeAttribute(activeNodeId, "x"), 0);
      const endY = numberOr(graph.getNodeAttribute(activeNodeId, "y"), 0);
      const wasPinned = graph.getNodeAttribute(activeNodeId, "pinned") === true;
      const moved =
        Math.abs(endX - startX) > 0.0001 || Math.abs(endY - startY) > 0.0001;

      if (!moved) {
        // Pure click on a node — restore `fixed` to mirror `pinned` (we
        // forced fixed:true at downNode for the drag suppression) and
        // clear dragState. No history entry, no auto-pin.
        graph.setNodeAttribute(activeNodeId, "fixed", wasPinned);
        store.setState((s) => ({
          ui: { ...s.ui, dragState: null },
        }));
        if (suspended) {
          worker.setEnabled(true);
          suspended = false;
        }
        return;
      }

      // Snap-back path: when the host has set `pinnedDragMode: "snap-back"`
      // AND the node was already pinned at drag-start, dragging is a
      // preview gesture only — we revert graphology's x/y to the start
      // position, leave pin/store/history untouched, and clear dragState.
      // No FA2 resume (this mode is typically used with layoutEnabled:
      // false, so the worker isn't even running).
      const pinnedDragMode = state.settings.pinnedDragMode;
      if (wasPinned && pinnedDragMode === "snap-back") {
        graph.setNodeAttribute(activeNodeId, "x", startX);
        graph.setNodeAttribute(activeNodeId, "y", startY);
        graph.setNodeAttribute(activeNodeId, "fixed", true);
        store.setState((s) => ({
          ui: { ...s.ui, dragState: null },
        }));
        if (suspended) {
          worker.setEnabled(true);
          suspended = false;
        }
        return;
      }

      // Auto-pin on drop (per plan §7.1). graphology `fixed` stays true
      // since pinned nodes are fixed.
      graph.setNodeAttribute(activeNodeId, "pinned", true);

      // Mirror final position + pin into the store's nodes Map.
      const node = state.nodes.get(activeNodeId);
      const nextNodes = new Map(state.nodes);
      if (node) {
        nextNodes.set(activeNodeId, {
          ...node,
          position: { x: endX, y: endY },
          pinned: true,
        } as Node);
      }

      const inverses: PrimitiveInverse[] = [
        { type: "setNodePosition", id: activeNodeId, x: startX, y: startY },
      ];
      const forwards: PrimitiveInverse[] = [
        { type: "setNodePosition", id: activeNodeId, x: endX, y: endY },
      ];
      if (!wasPinned) {
        inverses.push({ type: "pinNode", id: activeNodeId, pinned: false });
        forwards.push({ type: "pinNode", id: activeNodeId, pinned: true });
      }

      const label = node?.label ?? activeNodeId;
      pushHistoryEntry(store, {
        label: `Drag ${label}`,
        inverses,
        forwards,
      });

      store.setState((s) => ({
        nodes: nextNodes,
        ui: { ...s.ui, dragState: null },
        graphVersion: s.graphVersion + 1,
      }));

      if (suspended) {
        // Drag is purely manual: the dragged node is now pinned at the
        // drop position, and we deliberately do NOT resume FA2. Resuming
        // (even via bounded `kick()`) would force every other non-fixed
        // node to re-equilibrate around the new pin during the settle
        // window — visible as a "whole graph re-arranges" cascade,
        // which is not what users expect from a drag gesture.
        //
        // After this point the worker stays paused. To force a re-flow
        // call `rerunLayout()` on the imperative handle, or toggle
        // `setLayoutEnabled` off → on.
        suspended = false;
      }
    };

    sigma.on("downNode", onDownNode);
    sigma.on("moveBody", onMoveBody);
    captor.on("mouseup", onMouseUp);

    return () => {
      sigma.off("downNode", onDownNode);
      sigma.off("moveBody", onMoveBody);
      captor.off("mouseup", onMouseUp);
      // Defensive: if the component unmounts mid-drag (e.g., tab switch
      // before mouseup), restore FA2 so it doesn't stay paused on a
      // dangling reference. setEnabled is a no-op if the worker is null
      // (already torn down by useFA2Worker's cleanup running in parallel).
      if (suspended) {
        worker.setEnabled(true);
      }
    };
  }, [sigma, graph, store, worker]);
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
