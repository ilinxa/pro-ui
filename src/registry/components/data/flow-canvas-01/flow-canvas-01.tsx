"use client";

import { useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./parts/canvas";
import {
  FlowCanvasContextProvider,
  type FlowCanvasContextValue,
} from "./registries/canvas-context";
import { defaultPortTypes } from "./registries/port-type-registry";
import { mergeRenderers } from "./registries/renderer-registry";
import { mergeEdgeTypes } from "./registries/edge-type-registry";
import type { FlowCanvasProps, PortType } from "./types";

import "@xyflow/react/dist/style.css";

function mergePortTypes(consumer: PortType[] | undefined): PortType[] {
  const merged: PortType[] = [...defaultPortTypes];
  const seen = new Set<string>(merged.map((p) => p.id));
  for (const p of consumer ?? []) {
    if (seen.has(p.id) && process.env.NODE_ENV !== "production") {
      console.warn(
        `[flow-canvas-01] port type collision for "${p.id}" — last-wins`,
      );
    }
    const idx = merged.findIndex((m) => m.id === p.id);
    if (idx >= 0) merged[idx] = p;
    else merged.push(p);
    seen.add(p.id);
  }
  return merged;
}

export function FlowCanvas({
  renderers,
  portTypes,
  edgeTypes,
  readOnly = false,
  selectionMode = "multi",
  onNodeUpdate,
  ...rest
}: FlowCanvasProps) {
  const ctx = useMemo<FlowCanvasContextValue>(
    () => ({
      renderers: mergeRenderers(renderers),
      portTypes: mergePortTypes(portTypes),
      edgeTypes: mergeEdgeTypes(edgeTypes),
      readOnly,
      selectionMode,
      onNodeUpdate,
    }),
    [renderers, portTypes, edgeTypes, readOnly, selectionMode, onNodeUpdate],
  );

  return (
    <ReactFlowProvider>
      <FlowCanvasContextProvider value={ctx}>
        <Canvas
          data={rest.data}
          defaultData={rest.defaultData}
          onChange={rest.onChange}
          onBeforeDrop={rest.onBeforeDrop}
          onBeforeConnect={rest.onBeforeConnect}
          onNodeCreate={rest.onNodeCreate}
          onNodeUpdate={onNodeUpdate}
          onNodeDelete={rest.onNodeDelete}
          onEdgeCreate={rest.onEdgeCreate}
          onEdgeDelete={rest.onEdgeDelete}
          onSubObjectExtract={rest.onSubObjectExtract}
          menuItems={rest.menuItems}
          panOnDrag={rest.panOnDrag}
          zoomOnScroll={rest.zoomOnScroll}
          selectionMode={selectionMode}
          readOnly={readOnly}
          onlyRenderVisibleElements={rest.onlyRenderVisibleElements}
          exportRef={rest.exportRef}
          backgroundConfig={rest.background}
          ariaLabel={rest["aria-label"]}
          className={rest.className}
        />
      </FlowCanvasContextProvider>
    </ReactFlowProvider>
  );
}
