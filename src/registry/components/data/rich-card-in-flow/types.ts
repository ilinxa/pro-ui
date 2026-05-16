import type { NodeData } from "@/registry/components/data/flow-canvas-01";
import type { RichCardJsonNode } from "@/registry/components/data/rich-card";

// Public type re-exports for consumer convenience
// (per Stage 1 description §3 "Type re-exports" in-scope)
export type { RichCardJsonNode } from "@/registry/components/data/rich-card";

/**
 * The canvas-node form of a rich-card tree — intersection of `NodeData` (which
 * the flow-canvas-01 renderer registry requires; `__type: string` + optional
 * `ports?: Port[]`) with rich-card's open-shape `RichCardJsonNode` (`__rcid?` /
 * `__rcorder?` / `__rcmeta?` + index signature).
 *
 * Consumers writing typed canvas data should type their rich-card-bearing nodes
 * as `NodeRecord & { data: RichCardCanvasNode }`. The renderer is registered as
 * `NodeRenderer<RichCardCanvasNode>` (see parts/rich-card-viewer.tsx).
 *
 * F-V6 lock — see procomp plan §3.5 + §5.2. Precedent: `customJsonRenderer`'s
 * `type CustomJsonData = NodeData & { _label?: string }` in flow-canvas-01.
 */
export type RichCardCanvasNode = NodeData & RichCardJsonNode;

/**
 * Flat-field value classification for the viewer's type-aware rendering.
 * Used by `lib/derive-flat-fields.ts` + `lib/format-value.ts`.
 */
export type FlatFieldType = "string" | "number" | "boolean" | "date";

export type FlatField = {
  key: string;
  value: unknown;
  type: FlatFieldType;
};
