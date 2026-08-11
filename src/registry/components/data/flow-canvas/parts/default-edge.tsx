"use client";

import { memo } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  useStore,
  type EdgeProps,
} from "@xyflow/react";
import { findPortInTree } from "../lib/port-walker";
import { usePortType } from "../registries/port-type-registry";
import type { EdgeRenderer, NodeData, Port } from "../types";

// M3 polish: pull the source port's type color and use it as the edge
// stroke. Each connection gets the visual identity of its data type — text
// edges = blue, image = emerald, card = lime — making the graph readable at
// a glance without requiring a legend.

// Narrow comparator for the source-port useStore selector. The returned
// shape is `Port | undefined`; only three fields (`id`, `type`, `multi`)
// affect this renderer — `type` drives the stroke color via portType
// lookup; `id` and `multi` are kept stable for identity guards. Without
// this, xyflow's store updates the nodeLookup Map reference per change
// and the default identity equality re-runs the selector + re-renders the
// edge for every node change anywhere in the canvas. v0.2.0 Tier 2 plan F-01.
const portEqual = (a?: Port, b?: Port) =>
  a === b || (a?.id === b?.id && a?.type === b?.type && a?.multi === b?.multi);

function DefaultEdgeImpl(props: EdgeProps) {
  const {
    id,
    source,
    sourceHandleId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerStart,
    markerEnd,
    style,
    selected,
  } = props;

  // Reactive lookup of the source port via xyflow's store. Recomputes if the
  // source node's data tree changes. `portEqual` narrows re-render triggers
  // to the three fields this renderer actually reads (see comparator above).
  const sourcePort: Port | undefined = useStore(
    (s) => {
      if (!source || !sourceHandleId) return undefined;
      const node = s.nodeLookup.get(source);
      if (!node) return undefined;
      return findPortInTree(node.data as NodeData, sourceHandleId)?.port;
    },
    portEqual,
  );

  const portType = usePortType(sourcePort?.type ?? "");
  const color = portType?.color;

  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <BaseEdge
      id={id}
      path={path}
      markerStart={markerStart}
      markerEnd={markerEnd}
      style={{
        stroke: selected ? "var(--ring)" : (color ?? "var(--xy-edge-stroke)"),
        strokeWidth: selected ? 2.5 : 1.5,
        ...style,
      }}
    />
  );
}

export const DefaultEdge = memo(DefaultEdgeImpl);

export const defaultEdgeRenderer: EdgeRenderer = {
  type: "smoothstep",
  label: "Smooth step",
  // For consumer-facing dispatch (M3 polish has wired this internally — the
  // single 'ilinxa-edge' xyflow type calls DefaultEdge directly). Custom
  // edge renderers via the edge-type registry are exposed in v0.2.
  render: () => null,
};
