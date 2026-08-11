// Local lazy-boundary wrapper for the CROSS-category markdown-editor viewer.
// See lazy-code-block.tsx for why this indirection + the `import` (not
// `export ... from`) form is required. `marked` + CodeMirror stay in this
// lazily-loaded chunk.
import { MarkdownEditor } from "@/registry/components/forms/markdown-editor/markdown-editor";

export default MarkdownEditor;
