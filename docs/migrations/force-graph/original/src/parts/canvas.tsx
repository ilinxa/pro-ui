"use client";

import { useEffect, useImperativeHandle, useState } from "react";
import type Sigma from "sigma";
import { cn } from "@/lib/utils";

import type {
  ForceGraphCanvasProps,
  Selection,
  ValidationError,
} from "../types";
import {
  useGraphStoreContext,
  useSourceState,
} from "../hooks/use-graph-store";
import { useGraphActions } from "../hooks/use-graph-actions";
import { useGraphSelector } from "../hooks/use-graph-selector";
import { softEdgeAttributes } from "../lib/edge-attributes";
import { sigmaNodeAttributes } from "../lib/node-attributes";
import { SigmaContainer } from "./sigma-container";
import { SvgOverlay } from "./svg-overlay";
import { InteractionLayer } from "./interaction-layer";
import { LinkingSourceOverlay } from "./linking-source-overlay";

/**
 * Per v0.2 plan §3.1 + §4.1: the public Canvas component.
 *
 * Reads store + graph + worker + theme from `useGraphStoreContext`
 * (provided by `<ForceGraph.Provider>`) and the source-adapter status
 * from `useSourceState`. Holds the local Sigma instance, wires the
 * imperative ref handle, and renders the WebGL canvas + SVG overlay +
 * loading/error overlays.
 *
 * Per [decision #38][1]: edge rendering is stock Sigma
 * `EdgeRectangleProgram` + `EdgeArrowProgram` (registered inside
 * `<SigmaContainer>`), with per-edge `color` / `size` attributes
 * computed by `softEdgeAttributes` at edge-add time and remerged on
 * theme change by the recolor effect below.
 *
 * [1]: ../../../../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index
 */
export function Canvas({
  ariaLabel = "Knowledge graph",
  className,
  ref,
}: ForceGraphCanvasProps) {
  const { store, graph, theme: resolvedTheme } = useGraphStoreContext();
  const settings = useGraphSelector((s) => s.settings);
  const sourceState = useSourceState();
  const actions = useGraphActions();

  const [sigma, setSigma] = useState<Sigma | null>(null);

  // Recolor existing nodes + edges when the resolved theme changes
  // (theme prop or customColors update). Per-entity color/size were
  // captured at add-time by the graphology adapter; on theme change we
  // walk the graph and recompute against the latest theme + store
  // snapshot, then ask Sigma to redraw.
  useEffect(() => {
    const state = store.getState();
    graph.forEachNode((nodeId) => {
      const node = state.nodes.get(nodeId);
      if (!node) return;
      const attrs = sigmaNodeAttributes(
        node,
        state.nodeTypes,
        resolvedTheme,
        settings.nodeBaseSize,
      );
      graph.mergeNodeAttributes(nodeId, attrs);
    });
    graph.forEachEdge((edgeId) => {
      const edge = state.edges.get(edgeId);
      if (!edge) return;
      const attrs = softEdgeAttributes(edge, {
        nodes: state.nodes,
        groups: state.groups,
        edgeTypes: state.edgeTypes,
        theme: resolvedTheme,
      });
      graph.mergeEdgeAttributes(edgeId, attrs);
    });
    if (sigma) sigma.refresh();
  }, [resolvedTheme, graph, store, sigma, settings.nodeBaseSize]);

  useImperativeHandle(
    ref,
    () => ({
      getSnapshot: () => actions.exportSnapshot(),
      importSnapshot: (snapshot) => actions.importSnapshot(snapshot),
      resetCamera: (options) => {
        if (!sigma) return;
        const camera = sigma.getCamera();
        if (options?.animate === false) {
          camera.setState({ x: 0.5, y: 0.5, ratio: 1, angle: 0 });
        } else {
          camera.animate(
            { x: 0.5, y: 0.5, ratio: 1, angle: 0 },
            { duration: 250 },
          );
        }
      },
      setLayoutEnabled: (enabled) => actions.setLayoutEnabled(enabled),
      rerunLayout: () => actions.rerunLayout(),
      pinAllPositions: () => actions.pinAllPositions(),
      setNodePositions: (batch, options) =>
        actions.setNodePositions(batch, options),
      getNodePositions: () =>
        graph.nodes().map((id) => ({
          id,
          x: numberOr(graph.getNodeAttribute(id, "x"), 0),
          y: numberOr(graph.getNodeAttribute(id, "y"), 0),
        })),
      // v0.2: focus camera on a specific node / group. Group focusing
      // doesn't have a hull yet (v0.4) — for now we approximate by
      // averaging member node positions.
      focusNode: (id, options) => {
        if (!sigma || !graph.hasNode(id)) return;
        focusOnGraphPoint(
          sigma,
          numberOr(graph.getNodeAttribute(id, "x"), 0),
          numberOr(graph.getNodeAttribute(id, "y"), 0),
          options,
        );
      },
      focusGroup: (id, options) => {
        if (!sigma) return;
        const group = store.getState().groups.get(id);
        if (!group || group.memberNodeIds.length === 0) return;
        let sx = 0;
        let sy = 0;
        let n = 0;
        for (const memberId of group.memberNodeIds) {
          if (!graph.hasNode(memberId)) continue;
          sx += numberOr(graph.getNodeAttribute(memberId, "x"), 0);
          sy += numberOr(graph.getNodeAttribute(memberId, "y"), 0);
          n++;
        }
        if (n === 0) return;
        focusOnGraphPoint(sigma, sx / n, sy / n, options);
      },
      select: (target: Selection) => actions.select(target),
      getSelection: () => store.getState().ui.selection,
      getSigmaInstance: () => {
        if (!sigma) {
          throw new Error(
            "ForceGraph: Sigma instance not yet mounted (call after useEffect)",
          );
        }
        return sigma;
      },
      getGraphologyInstance: () => graph,
    }),
    [actions, graph, sigma, store],
  );

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-md border border-border",
        className,
      )}
      style={{ backgroundColor: resolvedTheme.background }}
    >
      <SigmaContainer
        graph={graph}
        settings={settings}
        theme={resolvedTheme}
        ariaLabel={ariaLabel}
        onSigmaReady={setSigma}
      />
      <SvgOverlay />
      {sigma ? (
        <>
          <InteractionLayer
            sigma={sigma}
            graph={graph}
            store={store}
            theme={resolvedTheme}
          />
          <LinkingSourceOverlay
            sigma={sigma}
            graph={graph}
            theme={resolvedTheme}
          />
        </>
      ) : null}

      {sourceState.status === "loading" ? (
        <SourceLoadingOverlay />
      ) : sourceState.status === "error" ? (
        <SourceErrorOverlay error={sourceState.error} />
      ) : null}
    </div>
  );
}

/**
 * Per v0.2 plan §3.4 + spec: pan the camera to center on a graph-space
 * point with optional smooth animation + zoom.
 */
function focusOnGraphPoint(
  sigma: import("sigma").default,
  x: number,
  y: number,
  options?: { animate?: boolean; zoom?: number },
): void {
  const camera = sigma.getCamera();
  // Sigma cameras operate in normalized [0,1]² space — convert via the
  // current normalization function exposed through the framedGraphToViewport
  // helper. Easiest robust path: use viewportToGraph in reverse via a
  // round-trip through Sigma's transform.
  const viewport = sigma.graphToViewport({ x, y });
  const dim = sigma.getDimensions();
  // Translate so the point sits at viewport center; convert back to a
  // camera state via the inverse of graphToViewport — Sigma exposes a
  // `getCamera().animate({x, y, ratio})` that takes normalized coords.
  // The simplest, robust approach is `sigma.getCamera().animatedReset`
  // is no good here; build the target state from the existing camera.
  const cur = camera.getState();
  const dx = (viewport.x - dim.width / 2) / dim.width;
  const dy = (viewport.y - dim.height / 2) / dim.height;
  const target = {
    x: cur.x + dx * cur.ratio,
    y: cur.y + dy * cur.ratio,
    ratio: options?.zoom ?? cur.ratio,
    angle: cur.angle,
  };
  if (options?.animate === false) {
    camera.setState(target);
  } else {
    camera.animate(target, { duration: 280 });
  }
}

function SourceLoadingOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      Loading graph…
    </div>
  );
}

function SourceErrorOverlay({
  error,
}: {
  error: ValidationError | { code: string; message: string } | undefined;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/80 p-6 text-center"
      role="alert"
    >
      <span className="text-sm font-semibold text-destructive">
        Could not load graph
      </span>
      <span className="text-xs text-muted-foreground">
        {error?.message ?? "Unknown error"}
      </span>
    </div>
  );
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
