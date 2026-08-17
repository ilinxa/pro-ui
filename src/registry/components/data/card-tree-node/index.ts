export {
  cardTreeViewerRenderer,
  // v0.4 — configurable renderer factory (custom-key registrations, block
  // rendering mode, the caps Q6 kept hardcoded through v0.3).
  createCardTreeViewerRenderer,
} from "./parts/card-tree-viewer";

// v0.4 — block rendering (FU-2). Both are prop-driven and context-free, so a
// consumer hand-assembling a node renderer can mount them directly.
export { BlockStrip } from "./parts/block-strip";
export { HostBlockBoundary } from "./parts/host-block-boundary";

// v0.2 — PortEditorStrip + types (rcif-internal symbols, safe to re-export
// from the barrel per F-09 lock — only cross-procomp re-exports trip the
// shadcn path rewriter F-S1 bug).
export {
  PortEditorStrip,
  type PortEditorStripProps,
} from "./parts/port-editor-strip";

// Type re-exports for consumers writing typed canvas data
export type {
  CardTreeCanvasNode, // F-V6 lock — canvas-node form
  FlatField, // shape returned by the flat-field deriver
  FlatFieldType, // "string" | "number" | "boolean" | "date"
  PortEditorPermissions, // v0.2 — for typed consumer permission predicates
  PortField, // v0.2 — for typed canEditPortField bodies
  BlockKind, // v0.4 — built-in key name, or "custom"
  NodeBlock, // v0.4 — a block as the viewer sees it
  CardTreeViewerOptions, // v0.4 — createCardTreeViewerRenderer's argument
} from "./types";

// F-S1 lock (per json-form v0.1.4 smoke precedent + extended via card-tree-in-
// flow's smoke surfacing): cross-procomp re-exports from a barrel index.ts get
// mis-rewritten by shadcn's path rewriter — observed broken outputs include
// `@/components/data/card-tree/types` (preserves `data/`) and
// `@/lib/update-node-data` (strips most of the path). Workaround: DROP the
// cross-procomp re-exports here entirely. Consumers import from each procomp
// directly:
//
//   import { cardTreeViewerRenderer, type CardTreeCanvasNode } from "@ilinxa/card-tree-node";
//   import type { CardTreeJsonNode } from "@ilinxa/card-tree";
//   import { updateNodeData } from "@ilinxa/flow-canvas";
//
// One extra import, much more robust against the rewriter. Documented in
// usage.tsx + the Stage 3 procomp guide.
