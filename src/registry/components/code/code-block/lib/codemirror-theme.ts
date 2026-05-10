/**
 * Custom CodeMirror theme + HighlightStyle approximating Shiki's
 * GitHub Light + GitHub Dark Default token palettes.
 *
 * Colors are emitted as CSS variables (`--cb-fg-<token>`) so the active
 * `.dark` class on an ancestor flips the palette without re-mounting
 * or reconfiguring CodeMirror.
 *
 * v0.2.0 upgrade path: replace this file with a hand-rolled Shiki →
 * CodeMirror bridge (tokenize doc on change, apply tokens as a
 * StateField<DecorationSet>) for pixel-perfect parity with view mode.
 */
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { tags as t } from "@lezer/highlight";

const highlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "var(--cb-fg-keyword)" },
  { tag: t.controlKeyword, color: "var(--cb-fg-keyword)" },
  { tag: t.operatorKeyword, color: "var(--cb-fg-keyword)" },
  { tag: t.modifier, color: "var(--cb-fg-keyword)" },

  { tag: [t.string, t.special(t.string)], color: "var(--cb-fg-string)" },
  { tag: t.regexp, color: "var(--cb-fg-string)" },

  { tag: t.number, color: "var(--cb-fg-number)" },
  { tag: t.bool, color: "var(--cb-fg-number)" },
  { tag: t.null, color: "var(--cb-fg-number)" },

  {
    tag: [t.comment, t.lineComment, t.blockComment, t.docComment],
    color: "var(--cb-fg-comment)",
    fontStyle: "italic",
  },

  { tag: [t.variableName, t.propertyName], color: "var(--cb-fg-variable)" },
  { tag: t.definition(t.variableName), color: "var(--cb-fg-variable)" },

  { tag: [t.typeName, t.className], color: "var(--cb-fg-type)" },
  { tag: [t.namespace, t.tagName], color: "var(--cb-fg-type)" },

  { tag: t.function(t.variableName), color: "var(--cb-fg-function)" },
  { tag: t.function(t.propertyName), color: "var(--cb-fg-function)" },
  { tag: t.macroName, color: "var(--cb-fg-function)" },

  { tag: [t.operator, t.derefOperator, t.arithmeticOperator], color: "var(--cb-fg-operator)" },
  { tag: [t.compareOperator, t.logicOperator], color: "var(--cb-fg-operator)" },

  { tag: [t.punctuation, t.separator, t.bracket], color: "var(--cb-fg-punctuation)" },

  { tag: t.attributeName, color: "var(--cb-fg-attribute)" },
  { tag: t.attributeValue, color: "var(--cb-fg-string)" },

  { tag: [t.meta, t.processingInstruction], color: "var(--cb-fg-meta)" },

  { tag: t.invalid, color: "var(--cb-fg-invalid)" },

  { tag: t.heading, color: "var(--cb-fg-keyword)", fontWeight: "bold" },
  { tag: t.link, color: "var(--cb-fg-string)", textDecoration: "underline" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
]);

const editorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      color: "var(--cb-fg-variable)",
      fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
      fontSize: "0.875rem",
      lineHeight: "1.6",
      height: "100%",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-scroller": {
      fontFamily: "inherit",
      lineHeight: "inherit",
    },
    ".cm-content": {
      padding: "1rem 1rem 1rem 0",
      caretColor: "var(--foreground)",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      border: "none",
      color: "var(--muted-foreground)",
      fontFamily: "inherit",
      paddingRight: "0.75rem",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 0.5rem",
      minWidth: "2.5em",
      textAlign: "right",
    },
    ".cm-activeLine": {
      backgroundColor: "color-mix(in oklch, var(--accent) 4%, transparent)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "color-mix(in oklch, var(--accent) 4%, transparent)",
      color: "var(--foreground)",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "color-mix(in oklch, var(--accent) 25%, transparent) !important",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--foreground)",
      borderLeftWidth: "2px",
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: "color-mix(in oklch, var(--accent) 18%, transparent)",
      outline: "none",
    },
  },
  { dark: false },
);

/**
 * Build the editor theme extension. The themes arg is reserved for the
 * v0.2.0 Shiki bridge — in v0.1.0 it is informational only (the active
 * palette is CSS-variable driven via .dark class).
 */
export function buildCodeMirrorTheme(): Extension {
  return [editorTheme, syntaxHighlighting(highlightStyle)];
}

/**
 * CSS variable definitions for both light + dark palettes.
 * Inject this stylesheet once per CodeBlock instance (or globally).
 *
 * Palette source: GitHub Light + GitHub Dark Default (Shiki's bundled themes).
 */
export const CODEMIRROR_THEME_CSS = `
.code-block-editor {
  --cb-fg-keyword: #cf222e;
  --cb-fg-string: #0a3069;
  --cb-fg-number: #0550ae;
  --cb-fg-comment: #6e7781;
  --cb-fg-variable: #1f2328;
  --cb-fg-type: #953800;
  --cb-fg-function: #8250df;
  --cb-fg-operator: #cf222e;
  --cb-fg-punctuation: #24292f;
  --cb-fg-attribute: #0550ae;
  --cb-fg-meta: #6639ba;
  --cb-fg-invalid: #82071e;
}
:where(.dark) .code-block-editor {
  --cb-fg-keyword: #ff7b72;
  --cb-fg-string: #a5d6ff;
  --cb-fg-number: #79c0ff;
  --cb-fg-comment: #8b949e;
  --cb-fg-variable: #e6edf3;
  --cb-fg-type: #ffa657;
  --cb-fg-function: #d2a8ff;
  --cb-fg-operator: #ff7b72;
  --cb-fg-punctuation: #c9d1d9;
  --cb-fg-attribute: #79c0ff;
  --cb-fg-meta: #d2a8ff;
  --cb-fg-invalid: #ffa198;
}
`;
