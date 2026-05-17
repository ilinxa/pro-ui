export { richCardViewerRenderer } from "./parts/rich-card-viewer";

// v0.2 — PortEditorStrip + types (rcif-internal symbols, safe to re-export
// from the barrel per F-09 lock — only cross-procomp re-exports trip the
// shadcn path rewriter F-S1 bug).
export {
  PortEditorStrip,
  type PortEditorStripProps,
} from "./parts/port-editor-strip";

// Type re-exports for consumers writing typed canvas data
export type {
  RichCardCanvasNode, // F-V6 lock — canvas-node form
  PortEditorPermissions, // v0.2 — for typed consumer permission predicates
  PortField, // v0.2 — for typed canEditPortField bodies
} from "./types";

// F-S1 lock (per json-form v0.1.4 smoke precedent + extended via rich-card-in-
// flow's smoke surfacing): cross-procomp re-exports from a barrel index.ts get
// mis-rewritten by shadcn's path rewriter — observed broken outputs include
// `@/components/data/rich-card/types` (preserves `data/`) and
// `@/lib/update-node-data` (strips most of the path). Workaround: DROP the
// cross-procomp re-exports here entirely. Consumers import from each procomp
// directly:
//
//   import { richCardViewerRenderer, type RichCardCanvasNode } from "@ilinxa/rich-card-in-flow";
//   import type { RichCardJsonNode } from "@ilinxa/rich-card";
//   import { updateNodeData } from "@ilinxa/flow-canvas-01";
//
// One extra import, much more robust against the rewriter. Documented in
// usage.tsx + the Stage 3 procomp guide.
