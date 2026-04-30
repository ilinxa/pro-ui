"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MultiGraphCtor from "graphology";
import type { MultiGraph } from "graphology";
import { useStore } from "zustand";

import type { ForceGraphProviderProps } from "../types";
import {
  GraphStoreProvider,
  SourceStateProvider,
  type GraphStoreContextValue,
} from "../hooks/use-graph-store";
import { createGraphStore } from "../lib/store/store-creator";
import { useFA2Worker } from "../hooks/use-fa2-worker";
import { useThemeResolution } from "../hooks/use-theme-resolution";
import { useSourceAdapter } from "../hooks/use-source-adapter";

/**
 * Per v0.2 plan §3.1 + §4.1: the public Provider component.
 *
 * Owns the per-mount Zustand store + graphology MultiGraph + FA2 worker
 * and the resolved theme. Runs the source adapter (loadInitial +
 * subscribe) inside its own GraphStoreContext so any <Canvas> rendered
 * as a child can read both the store state AND the source-adapter
 * `loading` / `error` signal via `useSourceState`.
 *
 * Per [decision #35][1]: this component does NOT import any Tier 1
 * pro-component; sibling-hook composition with `properties-form` /
 * `detail-panel` happens at host or Tier 3 level only.
 *
 * [1]: ../../../../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index
 */
export function Provider({
  data,
  onChange,
  onError,
  onSelectionChange,
  theme = "dark",
  customColors,
  children,
}: ForceGraphProviderProps) {
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

  // Per v0.2 plan §3.5 + §5.4: fire the host's onSelectionChange callback
  // whenever ui.selection changes. Mirror through a ref so re-creating
  // the callback doesn't tear down + re-bind the subscription.
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);
  useEffect(() => {
    return store.subscribe(
      (s) => s.ui.selection,
      (selection) => {
        onSelectionChangeRef.current?.(selection);
      },
    );
  }, [store]);

  const ctxValue = useMemo<GraphStoreContextValue>(
    () => ({ store, graph, worker, theme: resolvedTheme }),
    [store, graph, worker, resolvedTheme],
  );

  return (
    <GraphStoreProvider value={ctxValue}>
      <SourceAdapterRunner data={data} onChange={onChange} onError={onError}>
        {children}
      </SourceAdapterRunner>
    </GraphStoreProvider>
  );
}

interface SourceAdapterRunnerProps {
  data: ForceGraphProviderProps["data"];
  onChange?: ForceGraphProviderProps["onChange"];
  onError?: ForceGraphProviderProps["onError"];
  children: ForceGraphProviderProps["children"];
}

/**
 * Inner component that runs `useSourceAdapter` — must live inside the
 * GraphStoreProvider because the adapter calls `useGraphologyAdapter`,
 * which reads the store + graph from context.
 */
function SourceAdapterRunner({
  data,
  onChange,
  onError,
  children,
}: SourceAdapterRunnerProps) {
  const sourceState = useSourceAdapter(data, { onChange, onError });
  return <SourceStateProvider value={sourceState}>{children}</SourceStateProvider>;
}
