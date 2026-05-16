"use client";

import { useEffect, useMemo, useRef } from "react";
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
  onEditRequest,
  ...rest
}: FlowCanvasProps) {
  // v0.2.1 — ref-mirror consumer's onEditRequest so its identity changing
  // doesn't invalidate the canvas-context memo on every render. Matches the
  // existing defensive posture in use-canvas-data.ts (which ref-mirrors
  // onChange / onBeforeConnect / etc.). Plan §4.3.2 (F-V5 lock).
  const onEditRequestRef = useRef(onEditRequest);
  useEffect(() => {
    onEditRequestRef.current = onEditRequest;
  });

  // Stable wrapper — identity flips ONLY when consumer transitions between
  // wired and unwired states, not when they pass a fresh function identity
  // each render. Common consumer pattern: inline arrow on every render.
  const wiredOnEditRequest = onEditRequest !== undefined;
  const stableOnEditRequest = useMemo<
    FlowCanvasContextValue["onEditRequest"]
  >(
    () =>
      wiredOnEditRequest
        ? (nodeId, subPath) => onEditRequestRef.current?.(nodeId, subPath)
        : undefined,
    [wiredOnEditRequest],
  );

  const ctx = useMemo<FlowCanvasContextValue>(
    () => ({
      renderers: mergeRenderers(renderers),
      portTypes: mergePortTypes(portTypes),
      edgeTypes: mergeEdgeTypes(edgeTypes),
      readOnly,
      selectionMode,
      onNodeUpdate,
      onEditRequest: stableOnEditRequest,
    }),
    [
      renderers,
      portTypes,
      edgeTypes,
      readOnly,
      selectionMode,
      onNodeUpdate,
      stableOnEditRequest,
    ],
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
