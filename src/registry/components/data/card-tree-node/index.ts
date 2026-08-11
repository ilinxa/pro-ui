export { cardTreeViewerRenderer } from "./parts/card-tree-viewer";

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
  PortEditorPermissions, // v0.2 — for typed consumer permission predicates
  PortField, // v0.2 — for typed canEditPortField bodies
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
