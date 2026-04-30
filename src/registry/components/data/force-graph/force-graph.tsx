"use client";

import type { ForceGraphProps } from "./types";
import { Provider } from "./parts/provider";
import { Canvas } from "./parts/canvas";

/**
 * Force-directed graph component.
 *
 * v0.1 (shipped) — viewer core: pan/zoom + ForceAtlas2 layout + theme
 * integration + snapshot/source adapter + stock-Sigma rendering per
 * [decision #38][1].
 *
 * v0.2 (in progress) — selection / hover / drag-to-pin / linking-mode /
 * undo-redo / keyboard shortcuts. v0.2 also introduces the compound
 * Provider/Canvas API so Tier 1 panels (`properties-form`,
 * `detail-panel`, etc.) can read graph state via sibling hooks at the
 * host level — `<ForceGraph>` continues to work as a convenience
 * wrapper for hosts that don't need the split.
 *
 * Per [decision #35][1]: this component does NOT import any Tier 1
 * pro-component; composition happens at host or Tier 3 level only.
 *
 * [1]: ../../../../docs/systems/graph-system/graph-system-description.md#8-locked-decisions-index
 */
function ForceGraphRoot({
  data,
  onChange,
  onError,
  theme = "dark",
  customColors,
  ariaLabel = "Knowledge graph",
  className,
  ref,
}: ForceGraphProps) {
  return (
    <Provider
      data={data}
      onChange={onChange}
      onError={onError}
      theme={theme}
      customColors={customColors}
    >
      <Canvas ariaLabel={ariaLabel} className={className} ref={ref} />
    </Provider>
  );
}

export const ForceGraph = Object.assign(ForceGraphRoot, {
  Provider,
  Canvas,
});
