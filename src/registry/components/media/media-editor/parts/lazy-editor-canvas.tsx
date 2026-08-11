// Local default-export wrapper so `React.lazy(() => import("./lazy-editor-canvas"))`
// has a target — `EditorCanvas` itself is a named export. Same-folder
// (intra-component): this carries none of the cross-procomp rewriter hazards
// the media-library `lazy-code-block.tsx` / `lazy-markdown-editor.tsx`
// wrappers document (no category segment to mangle, no other registry item
// involved) — it exists purely for the `React.lazy(...)` default-export
// contract. Compound-component-structure rule: the konva canvas is the
// heavy dep (konva + react-konva) every consumer pulls in, so it gets the
// mandated lazy boundary even though (unlike media-library's viewers) it
// isn't itself droppable — the win here is deferring the konva chunk off
// the editor's initial paint (capture stage / text-only mode never need it).
export { EditorCanvas as default } from "./editor-canvas";
