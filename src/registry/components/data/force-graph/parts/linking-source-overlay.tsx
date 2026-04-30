"use client";

import { useEffect, useReducer } from "react";
import type Sigma from "sigma";
import type { MultiGraph } from "graphology";
import type { ResolvedTheme } from "../types";
import { useGraphSelector } from "../hooks/use-graph-selector";

/**
 * Per v0.2 plan §8.2: when linking-mode is active, the source endpoint
 * gets a "selected as source" ring as a visual cue. Decision #38
 * dropped the custom edge program; per plan §8.2 the ring is rendered
 * as a small SVG overlay positioned at the source node's screen
 * coordinates and re-projected on each Sigma frame so it tracks
 * pan/zoom + FA2 settle motion.
 *
 * Pattern note (per HANDOFF §5.1): we avoid setState-in-effect by
 * computing the projected position fresh on every render and using a
 * `forceUpdate` reducer to schedule a re-render when Sigma fires
 * `afterRender`. Subscription is gated on linking being active so the
 * 60fps re-render loop only runs when the ring is actually shown.
 *
 * v0.2 only renders for `kind: "node"` sources — group endpoints land
 * with the v0.4 hull system. The visual radius is currently a fixed
 * pixel value; v0.6 perf-pass can refine to track per-node display
 * size if needed.
 */
interface LinkingSourceOverlayProps {
  sigma: Sigma | null;
  graph: MultiGraph;
  theme: ResolvedTheme;
}

const RING_RADIUS_PX = 18;

export function LinkingSourceOverlay({
  sigma,
  graph,
  theme,
}: LinkingSourceOverlayProps) {
  const linkingMode = useGraphSelector((s) => s.ui.linkingMode);
  const [, forceRender] = useReducer((n: number) => n + 1, 0);

  const shouldShow =
    !!sigma &&
    linkingMode.active &&
    linkingMode.source !== null &&
    linkingMode.source.kind === "node";

  // Re-render on each Sigma frame while the ring is visible so it
  // tracks camera pan / zoom / layout settle.
  useEffect(() => {
    if (!shouldShow || !sigma) return;
    sigma.on("afterRender", forceRender);
    return () => {
      sigma.off("afterRender", forceRender);
    };
  }, [shouldShow, sigma]);

  if (!shouldShow || !sigma || !linkingMode.source) return null;
  const sourceId = linkingMode.source.id;
  if (!graph.hasNode(sourceId)) return null;
  const x = graph.getNodeAttribute(sourceId, "x");
  const y = graph.getNodeAttribute(sourceId, "y");
  if (typeof x !== "number" || typeof y !== "number") return null;
  const screen = sigma.graphToViewport({ x, y });

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <circle
        cx={screen.x}
        cy={screen.y}
        r={RING_RADIUS_PX}
        fill="none"
        stroke={theme.selectionRing}
        strokeWidth={2}
        strokeDasharray="4 3"
      />
    </svg>
  );
}
