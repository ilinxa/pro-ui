"use client";

import { memo, useMemo } from "react";
import type { NodeProps } from "@xyflow/react";
import { useFlowCanvasContext } from "../registries/canvas-context";
import { findRenderer } from "../registries/renderer-registry";
import type { NodeData, NodeRenderer, RenderContext } from "../types";
import { customJsonRenderer } from "./custom-json-node";
import { NodeShell } from "./node-shell";

// Build a self-referential renderChild via function declaration. Function
// declarations are hoisted within their own body so `rc` can reference itself
// without React Compiler's temporal-dead-zone warning.
function makeRenderChild(
  renderers: NodeRenderer[],
  nodeId: string,
  readOnly: boolean,
): RenderContext["renderChild"] {
  function rc(childData: NodeData) {
    const childRenderer =
      findRenderer(renderers, childData.__type) ?? customJsonRenderer;
    const childCtx: RenderContext = {
      nodeId,
      isSelected: false,
      isDragging: false,
      isReadOnly: readOnly,
      renderChild: rc,
    };
    return childRenderer.render(childData, childCtx);
  }
  return rc;
}

function NodeAdapterImpl(props: NodeProps) {
  const { id, data, selected, dragging, draggable } = props;
  const { renderers, readOnly } = useFlowCanvasContext();

  const nodeData = data as NodeData;
  const renderer =
    findRenderer(renderers, nodeData.__type) ?? customJsonRenderer;

  const renderChild = useMemo(
    () => makeRenderChild(renderers, id, readOnly),
    [renderers, id, readOnly],
  );

  const ctx: RenderContext = {
    nodeId: id,
    isSelected: !!selected,
    isDragging: !!dragging,
    isReadOnly: readOnly,
    renderChild,
  };

  return (
    <NodeShell isLocked={draggable === false}>
      {renderer.render(nodeData, ctx)}
    </NodeShell>
  );
}

export const NodeAdapter = memo(NodeAdapterImpl);
