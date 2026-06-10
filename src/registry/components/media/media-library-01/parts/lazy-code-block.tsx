// Local lazy-boundary wrapper for the CROSS-category code-block viewer.
//
// React.lazy can't reliably dynamic-import a cross-category procomp directly:
// shadcn's path rewriter strips the category for STATIC `import` declarations
// but NOT for (a) dynamic `import()` calls, nor (b) `export ... from` re-exports
// (both consumer-smoke proven). So this file uses a plain `import` (which the
// rewriter strips: `@/registry/components/code/...` → `@/components/code-block/...`)
// plus a separate `export default`, and file-preview dynamic-imports THIS local
// relative path (left untouched by the rewriter). Code-split preserved —
// CodeMirror/shiki stay in this lazily-loaded chunk.
import { CodeBlock } from "@/registry/components/code/code-block/code-block";

export default CodeBlock;
