"use client";

import { useEffect, useRef, useState } from "react";
import type SigmaType from "sigma";
import type { MultiGraph } from "graphology";
import type { GraphSettings, ResolvedTheme } from "../types";
import { makeDrawNodeHover } from "../lib/draw-node-hover";

/**
 * Per plan §8.1 + #38: Sigma instance lifecycle. v0.1 ships stock-Sigma
 * edge rendering — `EdgeRectangleProgram` (default for undirected) +
 * `EdgeArrowProgram` (for directed/reverse/bidirectional). Per-edge
 * `type` attribute selects the program; `color` + `size` come from
 * `softEdgeAttributes()` at edge-add time. Node rendering is stock
 * `NodeCircleProgram` until v0.5 ships `IconNodeProgram`.
 *
 * **SSR posture (v0.1):** `sigma/rendering` references
 * `WebGL2RenderingContext` at module-evaluation, which doesn't exist
 * under Node. Top-level imports of `sigma` and `sigma/rendering` are
 * therefore replaced with a dynamic `import()` inside the construction
 * effect — types are kept as `import type` (erased at compile time).
 * Next.js prerender runs the module-graph but never the effects, so the
 * dynamic import never executes server-side.
 *
 * Per HANDOFF §5.3: track the DOM container via `useState`, not `useRef`.
 * Per HANDOFF §5.2: Sigma instance lives in a ref read post-commit
 * (inside useEffect, never during render).
 *
 * Lifecycle:
 *   - Construction effect: keyed on (container, graph). Mount creates
 *     Sigma asynchronously after the dynamic import; unmount kills it
 *     (and cancels a pending mount via the cancellation flag). Theme +
 *     settings are NOT keys — Sigma stays mounted across them.
 *   - Update effects: keyed on theme + on label-affecting settings;
 *     call `sigma.setSetting()` to apply without remount. Bail when
 *     `sigmaRef.current` is null (mid-async-import).
 *
 * The `<svg>` overlay (hulls in v0.4, multi-edge badges in v0.6) is
 * mounted as a sibling by the parent component — not here.
 */

interface SigmaContainerProps {
  graph: MultiGraph;
  settings: GraphSettings;
  theme: ResolvedTheme;
  ariaLabel: string;
  className?: string;
  /**
   * Fires post-mount with the Sigma instance, and post-unmount with
   * `null`. Lets the parent expose the instance through the imperative
   * handle (`getSigmaInstance()` per plan §4.2 + description §8.5 #4).
   */
  onSigmaReady?: (sigma: SigmaType | null) => void;
}

export function SigmaContainer({
  graph,
  settings,
  theme,
  ariaLabel,
  className,
  onSigmaReady,
}: SigmaContainerProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const sigmaRef = useRef<SigmaType | null>(null);
  const onSigmaReadyRef = useRef(onSigmaReady);
  const themeRef = useRef(theme);
  const settingsRef = useRef(settings);

  // Mirror the latest callback + initial-mount values into refs so the
  // construction effect's deps stay `[container, graph]`. Passing
  // theme/settings as deps would tear down + re-mount Sigma on every
  // host theme flip or settings nudge — instead, we let the update
  // effects below apply changes via `sigma.setSetting()`. Mirrors the
  // markdown-editor deviation #3 (mount-time prop snapshot pattern).
  useEffect(() => {
    onSigmaReadyRef.current = onSigmaReady;
  }, [onSigmaReady]);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!container) {
      sigmaRef.current = null;
      onSigmaReadyRef.current?.(null);
      return;
    }

    let cancelled = false;
    let instance: SigmaType | null = null;

    Promise.all([import("sigma"), import("sigma/rendering")]).then(
      ([sigmaMod, renderingMod]) => {
        if (cancelled) return;

        const SigmaClass = sigmaMod.default;
        const { EdgeRectangleProgram, EdgeArrowProgram, NodeCircleProgram } =
          renderingMod;

        const initialTheme = themeRef.current;
        const initialSettings = settingsRef.current;

        instance = new SigmaClass(graph, container, {
          defaultEdgeType: "rectangle",
          defaultNodeColor: initialTheme.edgeDefault,
          defaultEdgeColor: initialTheme.edgeDefault,
          labelColor: { color: initialTheme.labelColor },
          edgeLabelColor: { color: initialTheme.labelColor },
          labelFont: initialSettings.labelFont,
          labelDensity: initialSettings.labelDensity,
          // Sigma's labelRenderedSizeThreshold is in pixels; map our 0–1
          // labelZoomThreshold to a sensible pixel band (8–24 px). v0.6
          // perf may revisit this mapping.
          labelRenderedSizeThreshold:
            8 +
            Math.max(0, Math.min(1, 1 - initialSettings.labelZoomThreshold)) *
              16,
          hideEdgesOnMove: initialSettings.hideEdgesOnMove,
          renderEdgeLabels: initialSettings.renderEdgeLabels,
          // Default node type is "circle" (Sigma's default). When we
          // override `edgeProgramClasses`, the bundled node-program
          // registry doesn't auto-populate, so we have to register
          // NodeCircleProgram explicitly. v0.5 swaps in IconNodeProgram.
          defaultNodeType: "circle",
          nodeProgramClasses: {
            circle: NodeCircleProgram,
          },
          edgeProgramClasses: {
            rectangle: EdgeRectangleProgram,
            arrow: EdgeArrowProgram,
          },
          // Theme-aware hover card — replaces Sigma's stock white-box
          // hover renderer that's unreadable on a dark canvas.
          defaultDrawNodeHover: makeDrawNodeHover(initialTheme),
          // Allow invalid container during the brief moment between
          // ref-attach and CSS layout settling. Without this, Sigma may
          // throw on a 0-size container on the first render frame.
          allowInvalidContainer: true,
          // Camera zoom limits: keep the user inside a sensible range.
          // 0.05 (very zoomed out) to 10 (very zoomed in). Without these
          // a trackpad pinch can zoom past the graph entirely or down
          // into single-pixel territory.
          minCameraRatio: 0.05,
          maxCameraRatio: 10,
        });

        sigmaRef.current = instance;
        onSigmaReadyRef.current?.(instance);
      },
    );

    return () => {
      cancelled = true;
      if (instance) {
        instance.kill();
      }
      sigmaRef.current = null;
      onSigmaReadyRef.current?.(null);
    };
  }, [container, graph]);

  // Theme update — sigmaRef may still be null during the dynamic-import
  // window; bail until ready. Initial values are baked in at construction.
  useEffect(() => {
    const sigma = sigmaRef.current;
    if (!sigma) return;
    sigma.setSetting("defaultNodeColor", theme.edgeDefault);
    sigma.setSetting("defaultEdgeColor", theme.edgeDefault);
    sigma.setSetting("labelColor", { color: theme.labelColor });
    sigma.setSetting("edgeLabelColor", { color: theme.labelColor });
    sigma.setSetting("defaultDrawNodeHover", makeDrawNodeHover(theme));
    // Per-entity color recompute on theme flip happens in the parent's
    // graph-walk effect (force-graph.tsx); this effect only updates
    // Sigma's own defaults + triggers a redraw.
    sigma.refresh();
  }, [theme]);

  // Settings update — only label-affecting settings live-update. v0.6
  // adds more granular updates as user-facing settings panel lands.
  useEffect(() => {
    const sigma = sigmaRef.current;
    if (!sigma) return;
    sigma.setSetting("labelFont", settings.labelFont);
    sigma.setSetting("labelDensity", settings.labelDensity);
    sigma.setSetting(
      "labelRenderedSizeThreshold",
      8 + Math.max(0, Math.min(1, 1 - settings.labelZoomThreshold)) * 16,
    );
    sigma.setSetting("hideEdgesOnMove", settings.hideEdgesOnMove);
    sigma.setSetting("renderEdgeLabels", settings.renderEdgeLabels);
  }, [
    settings.labelFont,
    settings.labelDensity,
    settings.labelZoomThreshold,
    settings.hideEdgesOnMove,
    settings.renderEdgeLabels,
  ]);

  return (
    <div
      ref={setContainer}
      className={className ?? "absolute inset-0"}
      tabIndex={0}
      role="application"
      aria-label={ariaLabel}
    />
  );
}
