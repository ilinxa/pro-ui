import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

// CM6 theme mapping editor surface to globals.css CSS variables (Q5 + §8.5 #5).
// All colors flow through `var(--*)` so dark/light theme flips at the document
// level update the editor without notifying CM6 — no remount.
const editorTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--card)",
    color: "var(--foreground)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.875rem",
    lineHeight: "1.65",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "var(--foreground)",
    padding: "0.875rem 1rem",
  },
  ".cm-scroller": {
    fontFamily: "inherit",
    overflowY: "auto",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--foreground)",
    borderLeftWidth: "1.5px",
  },
  "&.cm-focused": {
    outline: "none",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in oklch, var(--primary) 28%, transparent)",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklch, var(--muted) 55%, transparent)",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--muted-foreground)",
    border: "none",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
  },
  ".cm-selectionMatch": {
    backgroundColor: "color-mix(in oklch, var(--primary) 18%, transparent)",
  },

  // Wikilink decoration (Q-P5; styled per resolved/broken)
  ".cm-wikilink": {
    color: "var(--primary)",
    backgroundColor: "color-mix(in oklch, var(--primary) 12%, transparent)",
    borderRadius: "3px",
    padding: "1px 2px",
  },
  ".cm-wikilink-broken": {
    color: "var(--destructive)",
    backgroundColor: "color-mix(in oklch, var(--destructive) 10%, transparent)",
    textDecoration: "underline dashed",
    textUnderlineOffset: "3px",
  },

  // Search panel (description §3 — out of scope to redesign; map colors only per §13.5 #11)
  ".cm-panels": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    borderTop: "1px solid var(--border)",
  },
  ".cm-panels input": {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
    borderRadius: "0.375rem",
    padding: "0.25rem 0.5rem",
  },
  ".cm-panels button": {
    backgroundColor: "var(--secondary)",
    color: "var(--secondary-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "0.375rem",
    padding: "0.125rem 0.5rem",
    marginLeft: "0.25rem",
  },

  // Autocomplete popup
  ".cm-tooltip.cm-tooltip-autocomplete": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.18)",
    fontFamily: "var(--font-sans)",
  },
  ".cm-tooltip-autocomplete > ul": {
    fontFamily: "var(--font-sans)",
    fontSize: "0.8125rem",
    maxHeight: "16rem",
  },
  ".cm-tooltip-autocomplete > ul > li": {
    padding: "0.25rem 0.625rem",
  },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  },
  ".cm-completionInfo": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontFamily: "var(--font-sans)",
  },
});

// Syntax highlighting for markdown tokens — maps lezer tags to design-token colors
const markdownHighlight = HighlightStyle.define([
  { tag: [t.heading1, t.heading2, t.heading3, t.heading4, t.heading5, t.heading6], color: "var(--foreground)", fontWeight: "600" },
  { tag: t.strong, fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "var(--muted-foreground)" },
  { tag: t.link, color: "var(--primary)", textDecoration: "underline" },
  { tag: t.url, color: "var(--primary)" },
  { tag: t.monospace, color: "var(--foreground)", backgroundColor: "color-mix(in oklch, var(--muted) 70%, transparent)", borderRadius: "3px", padding: "0 3px" },
  { tag: t.quote, color: "var(--muted-foreground)", fontStyle: "italic" },
  { tag: t.list, color: "var(--muted-foreground)" },
  { tag: t.atom, color: "var(--primary)" },
  { tag: t.processingInstruction, color: "var(--muted-foreground)" },
  { tag: t.contentSeparator, color: "var(--border)" },
]);

export const markdownEditorTheme: Extension = [
  editorTheme,
  syntaxHighlighting(markdownHighlight, { fallback: true }),
];
