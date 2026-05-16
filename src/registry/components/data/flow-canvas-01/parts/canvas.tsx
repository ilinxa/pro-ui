"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  onlyRenderVisibleElements = true,
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

  // Honor an explicit initial viewport from CanvasData. When the consumer
  // supplies one (e.g. the stress fixture starts at zoom 0.9), we hand it
  // to ReactFlow as `defaultViewport` and disable `fitView` — otherwise
  // fitView wins and every node ends up on-screen, defeating
  // `onlyRenderVisibleElements` culling. Snapshot at mount with
  // useState(initializer) so subsequent pans/zooms don't reset the viewport.
  const [initialViewport] = useState(
    () => data?.viewport ?? defaultData?.viewport,
  );

  // Refs mirror latest xyNodes/xyEdges so isValidConnection — a stable
  // <ReactFlow> prop — can read fresh state without rebuilding on every
  // drag tick. Without this, at 200+ nodes ReactFlow reconciles every
  // tick (see xyflow-react-pro skill "Performance" + the v0.1.2 perf patch).
  const nodesRef = useRef(canvas.xyNodes);
  const edgesRef = useRef(canvas.xyEdges);
  useEffect(() => {
    nodesRef.current = canvas.xyNodes;
  }, [canvas.xyNodes]);
  useEffect(() => {
    edgesRef.current = canvas.xyEdges;
  }, [canvas.xyEdges]);

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

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const srcNode = nodes.find((n) => n.id === source);
      const tgtNode = nodes.find((n) => n.id === target);
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
        countEdgesAtPort(edges, source, sourceHandle, "source") > 0
      ) {
        return false;
      }
      if (
        !tgtFound.port.multi &&
        countEdgesAtPort(edges, target, targetHandle, "target") > 0
      ) {
        return false;
      }
      return true;
    },
    [],
  );

  // Actions wrapper for the context menu. Stable object reference — its
  // members are already stable from useCanvasData's ref-based callbacks.
  const menuActions = useMemo(
    () => ({
      duplicateNode: canvas.duplicateNode,
      deleteNode: canvas.deleteNode,
      deleteEdge: canvas.deleteEdge,
      updateNodeData: canvas.updateNodeData,
      extractSubObject: canvas.extractSubObject,
      appendNode: canvas.appendNode,
    }),
    [
      canvas.duplicateNode,
      canvas.deleteNode,
      canvas.deleteEdge,
      canvas.updateNodeData,
      canvas.extractSubObject,
      canvas.appendNode,
    ],
  );

  return (
    <CanvasContextMenu
      readOnly={readOnly}
      menuItems={menuItems}
      getNodeById={canvas.getNodeById}
      getEdgeById={canvas.getEdgeById}
      actions={menuActions}
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
          onNodeDragStart={canvas.onNodeDragStart}
          onNodeDragStop={canvas.onNodeDragStop}
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
          defaultViewport={initialViewport}
          fitView={!initialViewport}
        >
          <Controls position="bottom-left" />
        </ReactFlow>
      </div>
    </CanvasContextMenu>
  );
}
