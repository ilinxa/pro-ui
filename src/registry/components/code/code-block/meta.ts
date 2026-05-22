import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "code-block",
  name: "Code Block",
  category: "code",

  description:
    "Language-agnostic code surface with view / edit / terminal modes, Shiki syntax highlighting, dual-theme CSS-variable theming, streaming-friendly tokenization, and chat / docs / rich-card / terminal chrome.",
  context:
    "Substrate for every 'render code professionally' surface in the library — chat assistants, fenced markdown blocks, JSON / config viewers, rich-card code sections, virtual terminal walkthroughs, and snippet editors. View mode uses Shiki's GitHub Light + GitHub Dark Default themes (toggled via the active `.dark` class with zero re-tokenize). Edit mode wraps a CodeMirror 6 instance with a custom HighlightStyle approximating the same GitHub palette (near-match in v0.1.0; pixel-perfect Shiki → CodeMirror bridge defers to v0.2.0). Terminal mode renders structured `TerminalLine[]` rows with prompt detection on `$ `, `> `, `# ` prefixes and macOS-style traffic-light decoration. Streaming-friendly via an explicit `streaming` flag that batches re-tokenization to rAF and shows a blinking tail cursor. Filename → lang derivation works out of the box for ~30 extensions; consumer can override via `filenameToLang`. Object-shape callbacks throughout (per F-cross-12).",
  features: [
    "Three render modes (view / edit / terminal) in one component, switched by `mode` prop",
    "Shiki tokenization for view mode (GitHub Light + Dark Default by default; consumer overridable)",
    "CodeMirror 6 in edit mode with custom HighlightStyle for near-match view/edit visual continuity",
    "Streaming-friendly: explicit `streaming` prop, rAF-batched re-tokenization, blinking tail cursor",
    "Terminal mode with `lines: TerminalLine[]` API (input / output / error kinds) + prompt detection + optional macOS traffic-lights",
    "Chrome: filename pill, language label, copy button (with success animation), expand-to-modal, wrap toggle, download button — all gated by `show*` flags",
    "Body: optional line numbers (default off in view), wrap or scroll, highlighted line ranges, severity-icon annotations with tooltips, long-block collapse with 'Show all'",
    "Filename → lang priority chain: `lang` prop > consumer `filenameToLang` > built-in 30-entry extension map > plaintext",
    "Dual-theme via CSS variables: `.dark` class toggles palette with zero re-tokenize",
    "Standalone header parts exported (`<CodeBlockCopyButton>`, `<CodeBlockTrafficLights>`, etc.) for `renderHeader` slot composition",
    "Object-shape callbacks throughout (per F-cross-12)",
    "Imperative handle: `copy()`, `focus()`, `getValue()`, `scrollToLine()`",
  ],
  tags: [
    "code-block",
    "syntax-highlight",
    "shiki",
    "codemirror",
    "terminal",
    "chat",
    "markdown",
    "editor",
    "viewer",
    "streaming",
  ],

  version: "0.1.1",
  status: "alpha",
  createdAt: "2026-05-10",
  updatedAt: "2026-05-23",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "dialog", "tooltip"],
    npm: {
      shiki: "^4.0.2",
      "@codemirror/state": "^6.6.0",
      "@codemirror/view": "^6.41.1",
      "@codemirror/commands": "^6.10.3",
      "@codemirror/language": "^6.12.3",
      "@codemirror/autocomplete": "^6.20.1",
      "@lezer/highlight": "^1.2.3",
      "@codemirror/lang-javascript": "^6.2.5",
      "@codemirror/lang-json": "^6.0.2",
      "@codemirror/lang-python": "^6.2.1",
      "@codemirror/lang-html": "^6.4.11",
      "@codemirror/lang-css": "^6.3.1",
      "@codemirror/lang-markdown": "^6.5.0",
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["markdown-editor", "rich-card"],
};
