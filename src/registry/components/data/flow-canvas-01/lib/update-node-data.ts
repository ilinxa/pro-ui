import type { CanvasData, NodeData } from "../types";

/**
 * Walk-and-replace the `data` field of a single node by id. Returns a new
 * `CanvasData` reference (immutable update — does NOT mutate the input).
 * Returns the input unchanged if `nodeId` is not found.
 *
 * Shipped as a typed utility so consumers wiring `onEditRequest` + a dialog
 * don't reinvent it. See the `rich-card-in-flow` procomp guide for the
 * canonical popup-edit pattern. v0.2.1 addition.
 *
 * @example
 *   const next = updateNodeData(canvas, editingNodeId, newRichCardTree);
 *   setCanvas(next);
 */
export function updateNodeData(
  canvas: CanvasData,
  nodeId: string,
  nextData: NodeData,
): CanvasData {
  const idx = canvas.nodes.findIndex((n) => n.id === nodeId);
  if (idx < 0) return canvas;
  const nextNodes = canvas.nodes.slice();
  nextNodes[idx] = { ...nextNodes[idx], data: nextData };
  return { ...canvas, nodes: nextNodes };
}
