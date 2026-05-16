export { richCardViewerRenderer } from "./parts/rich-card-viewer";

// Type re-exports for consumers writing typed canvas data
export type { RichCardCanvasNode } from "./types"; // F-V6 lock — canvas-node form

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
