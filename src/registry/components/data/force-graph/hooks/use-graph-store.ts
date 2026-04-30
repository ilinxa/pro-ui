"use client";

import { createContext, useContext } from "react";
import type { MultiGraph } from "graphology";
import type { GraphStore } from "../lib/store/store-creator";
import type { ResolvedTheme } from "../types";

/**
 * Per plan §7.2: each <ForceGraph> instance owns its own Zustand store
 * + graphology MultiGraph + FA2 worker. We share these via React Context
 * so descendant hooks (useGraphSelector, useGraphActions, etc.) can read
 * them without prop-drilling.
 *
 * The Provider is rendered by the top-level <ForceGraph> in Phase B.
 *
 * `worker` is the FA2 control surface from `useFA2Worker`. v0.1 only
 * exposes start/stop/kick. v0.2+ adds a layout-settled callback.
 */

export interface FA2Controls {
  setEnabled(enabled: boolean): void;
  /** Explicit re-kick (e.g., from `rerunLayout()` action). */
  rerun(): void;
  /**
   * Settle-duration kick — used internally on mutation per plan §9.
   * Starts the worker, then stops it after `settings.layoutSettleDuration`.
   */
  kick(): void;
}

export interface GraphStoreContextValue {
  store: GraphStore;
  graph: MultiGraph;
  worker: FA2Controls;
  /**
   * The current resolved theme. Read by the graphology adapter at
   * edge-add / node-add time to compute Sigma rendering attributes
   * (color + size per [#38][1]). Read via a ref inside callbacks so the
   * adapter doesn't get re-memoized on every theme flip — that would
   * cascade through the source-adapter effect deps and force a
   * re-bootstrap.
   *
   * On theme flip, `ForceGraphInner` walks the graph and remerges
   * recomputed per-entity attributes — see the recolor effect there.
   *
   * [1]: ../../../../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index
   */
  theme: ResolvedTheme;
}

const GraphStoreContext = createContext<GraphStoreContextValue | null>(null);

export const GraphStoreProvider = GraphStoreContext.Provider;

/**
 * Throws if called outside a <ForceGraph> tree. Mirrors the
 * useDetailPanel hook posture from `detail-panel`'s context lock.
 */
export function useGraphStoreContext(): GraphStoreContextValue {
  const ctx = useContext(GraphStoreContext);
  if (!ctx) {
    throw new Error(
      "useGraphStoreContext must be called inside a <ForceGraph> tree",
    );
  }
  return ctx;
}
