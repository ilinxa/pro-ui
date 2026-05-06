"use client";

import { useCallback, useMemo } from "react";
import {
  ConnectionMode,
  Controls,
  ReactFlow,
  type Connection,
  type Edge as XyEdge,
  type IsValidConnection,
  type Node as XyNode,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useCanvasData } from "../hooks/use-canvas-data";
import { useDropPipeline } from "../hooks/use-drop-pipeline";
import { useExportHandle } from "../hooks/use-export";
import { countEdgesAtPort, findPortInTree } from "../lib/port-walker";
import { useFlowCanvasContext } from "../registries/canvas-context";
import type {
  FlowCanvasBackgroundConfig,
  FlowCanvasProps,
  NodeData,
} from "../types";
import { FlowCanvasBackground } from "./background";
import { CanvasContextMenu } from "./canvas-context-menu";
import { DefaultEdge } from "./default-edge";
import { NodeAdapter } from "./node-adapter";

// Module-scope nodeTypes / edgeTypes — required (see xyflow-react-pro skill).
// Recreating these in render would tear down + remount every node.
const NODE_TYPES = { "ilinxa-node": NodeAdapter };
const EDGE_TYPES = { "ilinxa-edge": DefaultEdge };

type CanvasInnerProps = Pick<
  FlowCanvasProps,
  | "data"
  | "defaultData"
  | "onChange"
  | "onBeforeDrop"
  | "onBeforeConnect"
  | "onNodeCreate"
  | "onNodeUpdate"
  | "onNodeDelete"
  | "onEdgeCreate"
  | "onEdgeDelete"
  | "onSubObjectExtract"
  | "menuItems"
  | "panOnDrag"
  | "zoomOnScroll"
  | "selectionMode"
  | "readOnly"
  | "onlyRenderVisibleElements"
  | "exportRef"
  | "background"
  | "className"
> & {
  ariaLabel?: string;
  backgroundConfig: FlowCanvasBackgroundConfig | undefined;
};

export function Canvas({
  data,
  defaultData,
  onChange,
  onBeforeDrop,
  onBeforeConnect,
  onNodeCreate,
  onNodeUpdate,
  onNodeDelete,
  onEdgeCreate,
  onEdgeDelete,
  onSubObjectExtract,
  menuItems,
  panOnDrag = true,
  zoomOnScroll = true,
  selectionMode = "multi",
  readOnly = false,
  onlyRenderVisibleElements = false,
  exportRef,
  ariaLabel,
  backgroundConfig,
  className,
}: CanvasInnerProps) {
  const canvas = useCanvasData({
    data,
    defaultData,
    onChange,
    onBeforeConnect,
    onNodeCreate,
    onNodeUpdate,
    onNodeDelete,
    onEdgeCreate,
    onEdgeDelete,
    onSubObjectExtract,
  });
  const { renderers } = useFlowCanvasContext();
  const drop = useDropPipeline({
    renderers,
    appendNode: canvas.appendNode,
    extractSubObject: canvas.extractSubObject,
    onBeforeDrop,
    onNodeCreate,
  });

  useExportHandle(exportRef, canvas.snapshot);

  const interactive = !readOnly;
  const multiSelectionKeyCode = useMemo(
    () => (selectionMode === "multi" ? "Shift" : null),
    [selectionMode],
  );

  // M3 typed-connection validator. Same `type` on both ends + opposite dirs
  // (out → in). Enforces `multi: false` by counting existing edges at the
  // candidate port. Per-handle override hooks land in plan §3.4 layer 3.
  const isValidConnection = useCallback<IsValidConnection<XyEdge>>(
    (c: Connection | XyEdge) => {
      const source = c.source;
      const target = c.target;
      const sourceHandle = c.sourceHandle ?? "";
      const targetHandle = c.targetHandle ?? "";
      if (!source || !target || !sourceHandle || !targetHandle) return false;

      const srcNode = canvas.xyNodes.find((n) => n.id === source);
      const tgtNode = canvas.xyNodes.find((n) => n.id === target);
      if (!srcNode || !tgtNode) return false;

      const srcFound = findPortInTree(srcNode.data as NodeData, sourceHandle);
      const tgtFound = findPortInTree(tgtNode.data as NodeData, targetHandle);
      if (!srcFound || !tgtFound) return false;

      // Direction: source handle must be `out`, target handle must be `in`.
      if (srcFound.port.dir !== "out" || tgtFound.port.dir !== "in") return false;

      // Type match.
      if (srcFound.port.type !== tgtFound.port.type) return false;

      // multi: false enforcement.
      if (
        !srcFound.port.multi &&
        countEdgesAtPort(canvas.xyEdges, source, sourceHandle, "source") > 0
      ) {
        return false;
      }
      if (
        !tgtFound.port.multi &&
        countEdgesAtPort(canvas.xyEdges, target, targetHandle, "target") > 0
      ) {
        return false;
      }
      return true;
    },
    [canvas.xyNodes, canvas.xyEdges],
  );

  return (
    <CanvasContextMenu
      readOnly={readOnly}
      menuItems={menuItems}
      nodes={useMemo(() => canvas.xyNodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: n.data as NodeData,
        selected: n.selected,
        locked: n.draggable === false ? true : undefined,
      })), [canvas.xyNodes])}
      edges={useMemo(() => canvas.xyEdges.map((e) => ({
        id: e.id,
        source: `${e.source}:${e.sourceHandle ?? ""}` as `${string}:${string}`,
        target: `${e.target}:${e.targetHandle ?? ""}` as `${string}:${string}`,
        type: e.type === "ilinxa-edge" ? undefined : e.type,
        selected: e.selected,
      })), [canvas.xyEdges])}
      actions={{
        duplicateNode: canvas.duplicateNode,
        deleteNode: canvas.deleteNode,
        deleteEdge: canvas.deleteEdge,
        updateNodeData: canvas.updateNodeData,
        extractSubObject: canvas.extractSubObject,
        appendNode: canvas.appendNode,
      }}
    >
      <div
        role="region"
        aria-label={ariaLabel ?? "Flow canvas"}
        data-flow-canvas-root=""
        tabIndex={0}
        className={cn(
          "relative h-full w-full overflow-hidden rounded-lg border border-border bg-background",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          className,
        )}
        onDragOver={interactive ? drop.onDragOver : undefined}
        onDrop={interactive ? drop.onDrop : undefined}
        onPaste={interactive ? drop.onPaste : undefined}
      >
        <FlowCanvasBackground config={backgroundConfig} />
        <ReactFlow<XyNode<NodeData>, XyEdge>
          nodes={canvas.xyNodes}
          edges={canvas.xyEdges}
          onNodesChange={canvas.onNodesChange}
          onEdgesChange={canvas.onEdgesChange}
          onConnect={canvas.onConnect}
          isValidConnection={isValidConnection}
          connectionMode={ConnectionMode.Strict}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          panOnDrag={panOnDrag}
          zoomOnScroll={zoomOnScroll}
          nodesDraggable={interactive}
          nodesConnectable={interactive}
          elementsSelectable={interactive}
          deleteKeyCode={interactive ? ["Backspace", "Delete"] : null}
          multiSelectionKeyCode={multiSelectionKeyCode}
          onlyRenderVisibleElements={onlyRenderVisibleElements}
          proOptions={{ hideAttribution: true }}
          fitView
        >
          <Controls position="bottom-left" />
        </ReactFlow>
      </div>
    </CanvasContextMenu>
  );
}
