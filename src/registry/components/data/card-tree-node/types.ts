// F-S1 lock (extended by card-tree-node's v0.1.0 smoke): use RELATIVE
// imports for cross-procomp types — shadcn's path rewriter has a bug where
// same-category cross-procomp imports of `<other-slug>/types` get the
// current procomp's slug substituted (`flow-canvas/types` →
// `card-tree-node/types`). Relative paths bypass the alias rewriter and
// translate verbatim through the producer→consumer tree (both have sibling
// procomp dirs at the same level).
import type { NodeData } from "../flow-canvas/types";
import type { CardTreeJsonNode } from "../card-tree/types";

// Public type re-export for consumer convenience
// (per Stage 1 description §3 "Type re-exports" in-scope)
export type { CardTreeJsonNode } from "../card-tree/types";

/**
 * The canvas-node form of a card-tree tree — intersection of `NodeData` (which
 * the flow-canvas renderer registry requires; `__type: string` + optional
 * `ports?: Port[]`) with card-tree's open-shape `CardTreeJsonNode` (`__rcid?` /
 * `__rcorder?` / `__rcmeta?` + index signature).
 *
 * Consumers writing typed canvas data should type their card-tree-bearing nodes
 * as `NodeRecord & { data: CardTreeCanvasNode }`. The renderer is registered as
 * `NodeRenderer<CardTreeCanvasNode>` (see parts/card-tree-viewer.tsx).
 *
 * F-V6 lock — see procomp plan §3.5 + §5.2. Precedent: `customJsonRenderer`'s
 * `type CustomJsonData = NodeData & { _label?: string }` in flow-canvas.
 */
export type CardTreeCanvasNode = NodeData & CardTreeJsonNode;

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
 * Editable port fields that consumer permission predicates can gate
 * individually via `PortEditorPermissions.canEditPortField`. Mirrors the
 * mutable subset of `Port` (id + type + side + dir + multi + label).
 *
 * v0.2.0 addition.
 */
export type PortField = "type" | "side" | "dir" | "multi" | "label" | "id";

/**
 * Optional consumer-supplied predicates that gate port editing affordances
 * in `<PortEditorStrip>`. Default: everything allowed when `editable=true`.
 * Same predicate-shape pattern as card-tree's permission predicates.
 *
 * v0.2.0 addition.
 */
export type PortEditorPermissions = {
  canAddPort?: (cardId: string) => boolean;
  canRemovePort?: (cardId: string, portId: string) => boolean;
  canEditPort?: (cardId: string, portId: string) => boolean;
  canEditPortField?: (cardId: string, portId: string, field: PortField) => boolean;
};
