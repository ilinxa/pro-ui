// F-S1 lock (extended by card-tree-node's v0.1.0 smoke): use RELATIVE
// imports for cross-procomp types — shadcn's path rewriter has a bug where
// same-category cross-procomp imports of `<other-slug>/types` get the
// current procomp's slug substituted (`flow-canvas/types` →
// `card-tree-node/types`). Relative paths bypass the alias rewriter and
// translate verbatim through the producer→consumer tree (both have sibling
// procomp dirs at the same level).
import type { NodeData } from "../flow-canvas/types";
import type {
  CardTreeJsonNode,
  CustomPredefinedKey,
  PredefinedKey,
} from "../card-tree/types";

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

/* ───────── v0.4 — predefined + custom blocks (FU-2) ───────── */

/**
 * Which block a `NodeBlock` came from: one of card-tree's five built-in
 * predefined keys, or `"custom"` for anything the host registered through
 * `customPredefinedKeys`.
 *
 * v0.4.0 addition.
 */
export type BlockKind = PredefinedKey | "custom";

/**
 * A card-tree block as the canvas viewer sees it. `summary` is a compact
 * one-line description sized for a node chip (`"2 x 3"`, `"3 items"`);
 * `value` is the untouched payload, handed back to the host's own `render`
 * when `renderCustomBlocks` is on.
 *
 * v0.4.0 addition — see `lib/derive-blocks.ts`.
 */
export type NodeBlock = {
  key: string;
  kind: BlockKind;
  value: unknown;
  summary: string;
};

/**
 * Options for `createCardTreeViewerRenderer()`. Every field is optional; the
 * zero-argument call reproduces the shipped `cardTreeViewerRenderer` exactly.
 *
 * The three `max*` caps were hardcoded constants through v0.3 (Q6, "v0.2 may
 * open these as CardTreeViewerOptions"). v0.4.0 opens them.
 *
 * v0.4.0 addition.
 */
export type CardTreeViewerOptions = {
  /**
   * The same registrations the consumer passes to `<CardTree>`. The viewer
   * reads `key` (to classify the block) and, when `renderCustomBlocks` is on,
   * `render`. Pass a stable reference — an inline literal re-allocates every
   * render (the hazard card-tree v0.6.0 hit).
   */
  customPredefinedKeys?: readonly CustomPredefinedKey[];
  /**
   * Call each registration's own `render()` instead of showing a summary chip.
   * Off by default: a canvas node is a summary surface, and host render code
   * sized for a full-width editor rarely fits a 240px node. Host output is
   * wrapped in an error boundary either way.
   */
  renderCustomBlocks?: boolean;
  /** Built-ins to treat as ordinary fields/children — mirrors card-tree's prop. */
  disabledPredefinedKeys?: readonly PredefinedKey[];
  /** Flat fields shown before truncation. Default 3. */
  maxFlatFields?: number;
  /** Blocks shown before truncation. Default 3. */
  maxBlocks?: number;
  /** Nested subcard outlines shown before truncation. Default 4. */
  maxSubcards?: number;
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
