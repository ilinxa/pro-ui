"use client";

import { useEffect, useMemo, useRef } from "react";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import type { MultiGraph } from "graphology";
import type { GraphSettings } from "../types";
import type { FA2Controls } from "./use-graph-store";

/**
 * Per plan §9: ForceAtlas2 layout runs in a Web Worker via
 * `graphology-layout-forceatlas2/worker`. One worker per <ForceGraph>
 * instance.
 *
 * Lifecycle:
 *   - Worker is recreated when (graph instance OR force settings) change.
 *   - `enabled` prop drives start/stop without recreating the worker.
 *   - `kick()` runs a settle-duration pass on mutation (start, then stop
 *     after settings.layoutSettleDuration).
 *
 * The returned `FA2Controls` are stable across re-renders; consumers
 * (use-graph-actions, the cascade in apply-delta) can safely close over
 * them.
 *
 * Per HANDOFF §5: `workerRef` is read inside event-time callbacks
 * (setEnabled / rerun / kick) — never during render. The lint passes.
 */
export function useFA2Worker(
  graph: MultiGraph,
  settings: GraphSettings,
  enabled: boolean,
): FA2Controls {
  const workerRef = useRef<FA2Layout | null>(null);
  const settleDurationRef = useRef(settings.layoutSettleDuration);

  // Mirror the latest settle duration into the ref post-commit so the
  // stable `kick` callback sees fresh values without re-memoization.
  useEffect(() => {
    settleDurationRef.current = settings.layoutSettleDuration;
  }, [settings.layoutSettleDuration]);

  // Recreate the worker when graph or force config changes.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let worker: FA2Layout;
    try {
      worker = new FA2Layout(graph, {
        settings: {
          linLogMode: false,
          outboundAttractionDistribution: false,
          gravity: settings.forces.centerGravity,
          scalingRatio: settings.forces.repulsion / 10,
          slowDown: 1,
        },
      });
    } catch {
      // Worker unavailable (SSR / jsdom / no Worker support) — leave
      // workerRef null; controls become no-ops. v0.6 perf hardening
      // adds a fallback path; v0.1 silently degrades.
      return;
    }

    workerRef.current = worker;
    if (enabled) worker.start();

    return () => {
      worker.kill();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }
    };
    // Note: `settings.forces.linkDistance` is host-side metadata only —
    // FA2 has no `linkDistance` setting (verified in
    // graphology-layout-forceatlas2/defaults.js). Don't list it as a dep
    // or every linkDistance nudge would tear down + rebuild the worker
    // for nothing.
  }, [
    graph,
    settings.forces.repulsion,
    settings.forces.centerGravity,
    enabled,
  ]);

  return useMemo<FA2Controls>(
    () => ({
      setEnabled(next) {
        const w = workerRef.current;
        if (!w) return;
        if (next) w.start();
        else w.stop();
      },
      rerun() {
        workerRef.current?.start();
      },
      kick() {
        const w = workerRef.current;
        if (!w) return;
        w.start();
        const duration = settleDurationRef.current;
        if (duration > 0) {
          window.setTimeout(() => {
            // Re-read the worker — could have been torn down.
            const stillCurrent = workerRef.current;
            if (stillCurrent === w) w.stop();
          }, duration);
        }
      },
    }),
    [],
  );
}
