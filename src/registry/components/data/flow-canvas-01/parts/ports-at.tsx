"use client";

import { memo, type CSSProperties } from "react";
import type { Port, PortSide, PortsAtProps } from "../types";
import { PortHandle } from "./port-handle";

// Layout helper: stacks handles along an edge of the renderer's bounding
// box. Handles are direct DOM children of the node (xyflow's <Handle> is
// `position: absolute` and uses its own `position` prop to anchor; wrapping
// it in another absolute div would break that). We stack by computing
// `top` (for left/right edges) or `left` (for top/bottom edges) inline.
//
// For the easy case — a node has 1–N ports on each edge, evenly stacked.
// For complex layouts (per-sub-object positioning), emit <PortHandle /> in
// the renderer directly with your own style overrides.

function isVertical(side: PortSide): boolean {
  return side === "left" || side === "right";
}

function offsetFor(
  position: PortSide,
  index: number,
  count: number,
  spacing: number,
): CSSProperties {
  // Centered stack: middle item at 50%, others spaced by `spacing` px.
  const centered = (index - (count - 1) / 2) * spacing;
  if (isVertical(position)) {
    return { top: `calc(50% + ${centered}px)` };
  }
  return { left: `calc(50% + ${centered}px)` };
}

function PortsAtImpl({ ports, position, spacing = 24 }: PortsAtProps) {
  if (!ports || ports.length === 0) return null;
  const filtered = ports.filter((p: Port) => p.side === position);
  if (filtered.length === 0) return null;

  return (
    <>
      {filtered.map((p, i) => (
        <PortHandle
          key={p.id}
          port={p}
          style={offsetFor(position, i, filtered.length, spacing)}
        />
      ))}
    </>
  );
}

export const PortsAt = memo(PortsAtImpl);
