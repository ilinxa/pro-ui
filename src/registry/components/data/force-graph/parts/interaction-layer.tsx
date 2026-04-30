"use client";

import { useEffect } from "react";
import type Sigma from "sigma";
import type { MultiGraph } from "graphology";
import type { ResolvedTheme } from "../types";
import type { GraphStore } from "../lib/store/store-creator";
import { useGraphActions } from "../hooks/use-graph-actions";
import { useDragHandler } from "../hooks/use-drag-handler";
import { useHoverDebounce } from "../hooks/use-hover-debounce";
import { useKeyboardShortcuts } from "../hooks/use-keyboard-shortcuts";

/**
 * Per v0.2 plan §4.6: the dedicated interaction layer.
 *
 * Wires Sigma DOM events to store actions (clickNode / clickEdge /
 * clickStage / enterNode / leaveNode / enterEdge / leaveEdge),
 * registers `nodeReducer` + `edgeReducer` for the focus-and-neighbors
 * hover dim per plan §6.2, and composes the supporting hooks (drag,
 * hover debounce, keyboard shortcuts).
 *
 * Mounted by `<ForceGraph.Canvas>` once the Sigma instance is ready —
 * before that there's nothing to listen to.
 *
 * Returns null — event-only component, no DOM of its own.
 */
interface InteractionLayerProps {
  sigma: Sigma;
  graph: MultiGraph;
  store: GraphStore;
  theme: ResolvedTheme;
}

export function InteractionLayer({
  sigma,
  graph,
  store,
  theme,
}: InteractionLayerProps) {
  const actions = useGraphActions();
  const setHover = useHoverDebounce(actions);

  // The Sigma container is set at construction; reading it during
  // render is a synchronous pure read off the instance — no state
  // needed. The keyboard hook re-binds when sigma's identity changes.
  const canvasRoot: HTMLElement | null = sigma.getContainer();

  useKeyboardShortcuts(canvasRoot, store, actions);
  useDragHandler(sigma, graph, store);

  // Sigma click + hover events.
  useEffect(() => {
    const onClickNode = ({ node }: { node: string }): void => {
      const ui = store.getState().ui;
      if (ui.linkingMode.active) {
        // v0.2: linking-mode click selects target & exits. v0.3 will
        // dispatch addEdge here using { source, target }.
        actions.exitLinkingMode();
        return;
      }
      actions.select({ kind: "node", id: node });
    };

    const onClickEdge = ({ edge }: { edge: string }): void => {
      if (store.getState().ui.linkingMode.active) return; // edges aren't link targets
      actions.select({ kind: "edge", id: edge });
    };

    const onClickStage = (): void => {
      if (store.getState().ui.linkingMode.active) {
        actions.exitLinkingMode();
        return;
      }
      actions.clearSelection();
    };

    const onEnterNode = ({ node }: { node: string }): void => {
      setHover({ kind: "node", id: node });
    };
    const onLeaveNode = (): void => setHover(null);
    const onEnterEdge = ({ edge }: { edge: string }): void => {
      setHover({ kind: "edge", id: edge });
    };
    const onLeaveEdge = (): void => setHover(null);

    sigma.on("clickNode", onClickNode);
    sigma.on("clickEdge", onClickEdge);
    sigma.on("clickStage", onClickStage);
    sigma.on("enterNode", onEnterNode);
    sigma.on("leaveNode", onLeaveNode);
    sigma.on("enterEdge", onEnterEdge);
    sigma.on("leaveEdge", onLeaveEdge);

    return () => {
      sigma.off("clickNode", onClickNode);
      sigma.off("clickEdge", onClickEdge);
      sigma.off("clickStage", onClickStage);
      sigma.off("enterNode", onEnterNode);
      sigma.off("leaveNode", onLeaveNode);
      sigma.off("enterEdge", onEnterEdge);
      sigma.off("leaveEdge", onLeaveEdge);
    };
  }, [sigma, store, actions, setHover]);

  // Linking-mode cursor swap. Re-grab the container inside the effect
  // closure (rather than off the hook arg) so React Compiler doesn't
  // flag the style mutation as modifying a hook input. The closure is
  // safe — sigma is the dep, and sigma's container identity doesn't
  // change across renders for a given Sigma instance.
  useEffect(() => {
    const root = sigma.getContainer();
    if (!root) return;
    root.style.cursor = store.getState().ui.linkingMode.active
      ? "crosshair"
      : "";
    const unsubscribe = store.subscribe(
      (s) => s.ui.linkingMode.active,
      (active) => {
        root.style.cursor = active ? "crosshair" : "";
      },
    );
    return () => {
      unsubscribe();
      root.style.cursor = "";
    };
  }, [sigma, store]);

  // Per plan §6.2: focus-and-neighbors highlight via Sigma reducers.
  // The reducers re-read store state on each render call; no need to
  // re-register them on hover changes. We DO re-register on theme
  // change (so dim color tracks the current palette).
  useEffect(() => {
    const dim = withAlpha(theme.edgeMuted, 0.35);

    sigma.setSetting("nodeReducer", (nodeKey, attrs) => {
      const ui = store.getState().ui;
      if (!ui.hovered) return attrs;
      if (ui.hovered.kind === "node") {
        if (ui.hovered.id === nodeKey) return attrs;
        if (graph.areNeighbors(ui.hovered.id, nodeKey)) return attrs;
      }
      return { ...attrs, color: dim, label: null };
    });

    sigma.setSetting("edgeReducer", (edgeKey, attrs) => {
      const ui = store.getState().ui;
      if (!ui.hovered) return attrs;
      if (ui.hovered.kind === "edge" && ui.hovered.id === edgeKey) {
        return attrs;
      }
      if (ui.hovered.kind === "node") {
        const [src, tgt] = graph.extremities(edgeKey);
        if (src === ui.hovered.id || tgt === ui.hovered.id) return attrs;
      }
      return { ...attrs, color: dim };
    });

    // Re-render so reducers apply to currently visible items.
    sigma.scheduleRefresh();

    // Reducers re-read store state per call, but Sigma needs a render
    // request to re-apply on hover changes — `scheduleRefresh` debounces
    // to the next animation frame so rapid hover movement doesn't stall.
    const unsubscribe = store.subscribe(
      (s) => s.ui.hovered,
      () => {
        sigma.scheduleRefresh();
      },
    );

    return () => {
      unsubscribe();
      // We intentionally don't restore identity reducers here. On
      // unmount, sigma-container's cleanup kills the Sigma instance —
      // calling `setSetting` on a killed instance schedules a
      // `requestAnimationFrame` that runs `render()` after `kill()`
      // wiped `nodePrograms`, throwing `could not find a suitable
      // program for node type "circle"`. Killed instances stop running
      // their render loop, so the reducer closure can't leak — there's
      // nothing to restore.
    };
  }, [sigma, graph, store, theme.edgeMuted]);

  return null;
}

/**
 * Apply an alpha multiplier to an `rgb(...)` / `rgba(...)` color
 * (which is what the theme pipeline produces after `toRenderableColor`
 * normalizes oklch / lab inputs). Falls back to the input string
 * unchanged for hex / unknown formats — Sigma will at least keep
 * rendering the underlying color even if dim doesn't apply.
 */
function withAlpha(color: string, alpha: number): string {
  const trimmed = color.trim();
  const rgbaMatch = trimmed.match(/^rgba?\(([^)]+)\)$/);
  if (!rgbaMatch) return trimmed;
  const parts = rgbaMatch[1].split(",").map((p) => p.trim());
  if (parts.length < 3) return trimmed;
  const [r, g, b] = parts;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
