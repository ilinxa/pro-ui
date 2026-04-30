import type { Node, NodeType, ResolvedTheme } from "../types";
import { toRenderableColor } from "./theme";

/**
 * Compute Sigma's required top-level node attributes from a Node +
 * type registry + theme. Sigma reads `x`, `y`, `size`, `color`, `label`
 * directly off the node's graphology attributes; without these,
 * `NodeCircleProgram` either falls back to defaults or refuses to
 * render.
 *
 * Position fallback: `node.position` if supplied, else a small random
 * spread around origin. FA2 will reposition either way; the random
 * spread just gives FA2 something non-degenerate to work from on first
 * tick.
 *
 * Color rule (v0.1):
 *   - doc-kind nodes render in `theme.edgeMuted` (matches the v0.5
 *     visual-language preview where doc-glyph reads as muted before
 *     IconNodeProgram lands).
 *   - normal nodes pick up their NodeType's `color`. Missing NodeType
 *     falls back to `theme.edgeDefault` — graceful degradation per
 *     decision #24's spirit.
 *
 * `fixed` mirrors `node.pinned` so FA2's worker honors pin state.
 */
export interface SigmaNodeAttributes {
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
  fixed: boolean;
}

export function sigmaNodeAttributes(
  node: Node,
  nodeTypes: ReadonlyMap<string, NodeType>,
  theme: ResolvedTheme,
  baseSize: number = 5,
): SigmaNodeAttributes {
  const x = node.position?.x ?? randomInRange(-50, 50);
  const y = node.position?.y ?? randomInRange(-50, 50);

  let color: string;
  if (node.kind === "doc") {
    color = theme.edgeMuted;
  } else {
    const nt = nodeTypes.get(node.nodeTypeId);
    color = nt?.color ?? theme.edgeDefault;
  }

  return {
    x,
    y,
    size: baseSize,
    color: toRenderableColor(color),
    label: node.label,
    fixed: node.pinned ?? false,
  };
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
