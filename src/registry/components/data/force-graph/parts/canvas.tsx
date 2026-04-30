"use client";

import { useEffect, useImperativeHandle, useState } from "react";
import type Sigma from "sigma";
import { cn } from "@/lib/utils";

import type {
  ForceGraphCanvasProps,
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
    [actions, graph, sigma],
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

      {sourceState.status === "loading" ? (
        <SourceLoadingOverlay />
      ) : sourceState.status === "error" ? (
        <SourceErrorOverlay error={sourceState.error} />
      ) : null}
    </div>
  );
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
