// F-S1 lock (extended by rich-card-in-flow's v0.1.0 smoke): use RELATIVE
// imports for cross-procomp types — shadcn's path rewriter has a bug where
// same-category cross-procomp imports of `<other-slug>/types` get the
// current procomp's slug substituted (`flow-canvas-01/types` →
// `rich-card-in-flow/types`). Relative paths bypass the alias rewriter and
// translate verbatim through the producer→consumer tree (both have sibling
// procomp dirs at the same level).
import type { NodeData } from "../flow-canvas-01/types";
import type { RichCardJsonNode } from "../rich-card/types";

// Public type re-export for consumer convenience
// (per Stage 1 description §3 "Type re-exports" in-scope)
export type { RichCardJsonNode } from "../rich-card/types";

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

/* ───────── v0.2 — PortEditorStrip ───────── */

/**
 * Optional consumer-supplied predicates that gate port editing affordances
 * in `<PortEditorStrip>`. Default: everything allowed when `editable=true`.
 * Same predicate-shape pattern as rich-card's permission predicates.
 *
 * v0.2.0 addition.
 */
export type PortEditorPermissions = {
  canAddPort?: (cardId: string) => boolean;
  canRemovePort?: (cardId: string, portId: string) => boolean;
  canEditPort?: (cardId: string, portId: string) => boolean;
  canEditPortField?: (
    cardId: string,
    portId: string,
    field: "type" | "side" | "dir" | "multi" | "label" | "id",
  ) => boolean;
};
