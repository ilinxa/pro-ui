"use client";

import { memo, useCallback, useMemo } from "react";
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
  const { renderers, readOnly, onEditRequest } = useFlowCanvasContext();

  const nodeData = data as NodeData;
  const renderer =
    findRenderer(renderers, nodeData.__type) ?? customJsonRenderer;

  const renderChild = useMemo(
    () => makeRenderChild(renderers, id, readOnly),
    [renderers, id, readOnly],
  );

  // v0.2.1 — bind canvas-level onEditRequest to this node's id so renderers
  // fire `ctx.onEditRequest(subPath?)` without knowing their own nodeId.
  // `onEditRequest` from context is itself stable (ref-mirrored in
  // flow-canvas-01.tsx, F-V5 lock); identity flips only on wired/unwired.
  const handleEditRequest = useCallback(
    (subPath?: string) => onEditRequest?.(id, subPath),
    [onEditRequest, id],
  );

  const ctx: RenderContext = {
    nodeId: id,
    isSelected: !!selected,
    isDragging: !!dragging,
    isReadOnly: readOnly,
    renderChild,
    // Leave undefined when consumer hasn't wired onEditRequest so renderers
    // can gate their click affordances via `if (ctx.onEditRequest)`.
    onEditRequest: onEditRequest ? handleEditRequest : undefined,
  };

  return (
    <NodeShell isLocked={draggable === false}>
      {renderer.render(nodeData, ctx)}
    </NodeShell>
  );
}

export const NodeAdapter = memo(NodeAdapterImpl);
