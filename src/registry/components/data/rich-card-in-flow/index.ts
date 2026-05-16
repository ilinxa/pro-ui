export { richCardViewerRenderer } from "./parts/rich-card-viewer";

// Type re-exports for consumers writing typed canvas data
export type { RichCardCanvasNode } from "./types"; // F-V6 lock — canvas-node form
export type { RichCardJsonNode } from "@/registry/components/data/rich-card";

// Convenience re-export — `updateNodeData` ships in flow-canvas-01@v0.2.1's
// barrel; re-exported here for ergonomic DX (one import for the whole flow
// when wiring the popup-edit dialog). Q10 lock.
export { updateNodeData } from "@/registry/components/data/flow-canvas-01";
