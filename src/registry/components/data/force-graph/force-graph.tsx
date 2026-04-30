"use client";

import { useEffect, useImperativeHandle, useMemo, useState } from "react";
import type { Ref } from "react";
import MultiGraphCtor from "graphology";
import type { MultiGraph } from "graphology";
import type Sigma from "sigma";
import { useStore } from "zustand";
import { cn } from "@/lib/utils";

import type {
  ForceGraphHandle,
  ForceGraphProps,
  GraphInput,
  GraphSettings,
  ResolvedTheme,
  ValidationError,
} from "./types";
import {
  GraphStoreProvider,
  useGraphStoreContext,
  type GraphStoreContextValue,
} from "./hooks/use-graph-store";
import { createGraphStore } from "./lib/store/store-creator";
import { useFA2Worker } from "./hooks/use-fa2-worker";
import { useThemeResolution } from "./hooks/use-theme-resolution";
import { useSourceAdapter } from "./hooks/use-source-adapter";
import { useGraphActions } from "./hooks/use-graph-actions";
import { softEdgeAttributes } from "./lib/edge-attributes";
import { sigmaNodeAttributes } from "./lib/node-attributes";
import { SigmaContainer } from "./parts/sigma-container";
import { SvgOverlay } from "./parts/svg-overlay";

/**
 * Force-directed graph component (v0.1 — viewer core).
 *
 * v0.1 ships read-only viewing: pan/zoom, ForceAtlas2 layout in a Web
 * Worker, theme integration, snapshot/source adapter contract,
 * stock-Sigma rendering substrate per [decision #38][1]. Editing,
 * selection, hover, drag, undo/redo, search, and groups land in
 * v0.2–v0.6.
 *
 * [1]: ../../../../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index
 *
 * Architecture (per plan §7):
 *   - Outer `<ForceGraph>` creates the per-mount store + graphology
 *     MultiGraph + FA2 worker, and provides them via Context.
 *   - Inner `<ForceGraphInner>` consumes the Context, runs the source
 *     adapter (loadInitial / subscribe / delta dispatch), wires the
 *     imperative ref handle, and renders the Sigma container + SVG
 *     overlay.
 *
 * Per [decision #35][1]: this component does NOT import any Tier 1
 * pro-component. Composition with `properties-form` / `detail-panel` /
 * etc. happens at host or Tier 3 level only.
 */
export function ForceGraph({
  data,
  onChange,
  onError,
  theme = "dark",
  customColors,
  ariaLabel = "Knowledge graph",
  className,
  ref,
}: ForceGraphProps) {
  // Stable per-mount instances. `useState` lazy initializer guarantees
  // a single creation across re-renders and Strict Mode double-invokes.
  const [store] = useState(() => createGraphStore());
  const [graph] = useState<MultiGraph>(
    () => new MultiGraphCtor() as unknown as MultiGraph,
  );

  // Settings live in the reactive store; subscribe so theme/worker
  // updates re-fire when host changes them. v0.1 has no public setter
  // for forces — settings come from the imported snapshot's `settings`
  // field (per plan §5.4).
  const settings = useStore(store, (s) => s.settings);

  const resolvedTheme = useThemeResolution(theme, customColors);

  const worker = useFA2Worker(graph, settings, settings.layoutEnabled);

  const ctxValue = useMemo<GraphStoreContextValue>(
    () => ({ store, graph, worker, theme: resolvedTheme }),
    [store, graph, worker, resolvedTheme],
  );

  return (
    <GraphStoreProvider value={ctxValue}>
      <ForceGraphInner
        data={data}
        onChange={onChange}
        onError={onError}
        ariaLabel={ariaLabel}
        className={className}
        graph={graph}
        settings={settings}
        resolvedTheme={resolvedTheme}
        ref={ref}
      />
    </GraphStoreProvider>
  );
}

interface InnerProps {
  data: GraphInput;
  onChange?: ForceGraphProps["onChange"];
  onError?: ForceGraphProps["onError"];
  ariaLabel: string;
  className?: string;
  graph: MultiGraph;
  settings: GraphSettings;
  resolvedTheme: ResolvedTheme;
  ref?: Ref<ForceGraphHandle>;
}

function ForceGraphInner({
  data,
  onChange,
  onError,
  ariaLabel,
  className,
  graph,
  settings,
  resolvedTheme,
  ref,
}: InnerProps) {
  const [sigma, setSigma] = useState<Sigma | null>(null);
  const { store } = useGraphStoreContext();

  const sourceState = useSourceAdapter(data, { onChange, onError });
  const actions = useGraphActions();

  // Recolor existing nodes + edges when the resolved theme changes
  // (light↔dark flip, or customColors update). Per-entity color/size
  // were captured at add-time by the graphology adapter; on theme flip
  // we walk the graph and recompute against the latest theme + store
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
