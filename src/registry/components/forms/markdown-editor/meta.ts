import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "markdown-editor",
  name: "Markdown Editor",
  category: "forms",

  description:
    "CodeMirror 6-backed markdown editor — controlled value, GFM, [[wikilink]] autocomplete + decoration, slot-able toolbar, edit / split / preview view modes.",
  context:
    "Heaviest Tier 1 pro-component for the graph-system. CodeMirror 6 substrate (decision #19; ~150KB acceptance per #26) with a per-instance `marked` for preview parsing (Q-P1 — avoids global mutation). Wikilink candidates flow through CM6 StateField + StateEffect so host-side updates (e.g., new graph nodes) re-decorate without remount (Q-P5). Generic over the candidate type via `<MarkdownEditor<TCandidate extends WikilinkCandidate>>` for kind-typed candidates. Composed inside force-graph from v0.5 onward (doc nodes + wikilink reconciliation per decision #36) and inside detail-panel showcases. The editor's contract is `onSave(value)` only — reconciliation lives in force-graph, not here.",
  features: [
    "Pure controlled value/onChange — host owns the markdown string",
    "Three view modes — edit / split / preview, controlled or uncontrolled",
    "Default toolbar — 8 built-in items (bold, italic, code, link, lists, blockquote, heading-cycle); extend by spreading defaultMarkdownToolbar",
    "[[wikilink]] autocomplete with kind badges, capped at 50 results with sentinel overflow row",
    "Wikilink decoration in edit mode — broken-link styling reacts to runtime candidates updates via CM6 StateField (no remount)",
    "Wikilink rendering in preview — clickable, keyboard-accessible (role=link + tabindex when interactive); broken-link styling for unresolved",
    "Symmetric wikilink grammar — single source of truth shared by CM6 MatchDecorator, autocomplete trigger, and `marked` extension",
    "GitHub-Flavored Markdown — tables, strikethrough, task lists (static in v0.1), autolink",
    "Cmd/Ctrl+S → onSave(currentDoc) — preventDefault only when handler is supplied (browser save fires otherwise)",
    "Standard markdown keymap — Cmd+B/I/E/K + Cmd+Shift+. for blockquote",
    "Theme via CSS variables — dark/light flips with no remount",
    "extensions prop — user CM6 extensions appended LAST; OUR defaults win conflicts (escalate via Prec.high)",
    "Imperative handle — focus / undo / redo / insertText / getSelection / getValue / getView (escape hatch)",
    "React 19 ref-as-prop preserves generic inference",
    "Echo-guarded value-prop sync — no infinite loop if host calls setValue from inside onChange",
    "Bundle ≤180KB total (CM6 ~150KB + `marked` ~14KB + our code ~16KB)",
  ],
  tags: ["markdown-editor", "codemirror", "wikilinks", "graph-system", "editor"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-04-29",
  updatedAt: "2026-04-29",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["badge", "button", "tabs", "tooltip"],
    npm: {
      "@codemirror/state": "^6.6.0",
      "@codemirror/view": "^6.41.1",
      "@codemirror/commands": "^6.10.3",
      "@codemirror/language": "^6.12.3",
      "@codemirror/lang-markdown": "^6.5.0",
      "@codemirror/autocomplete": "^6.20.1",
      "@codemirror/search": "^6.7.0",
      "@lezer/markdown": "^1.6.3",
      "@lezer/highlight": "^1.2.3",
      marked: "^18.0.2",
      "lucide-react": "^1.11.0",
      "radix-ui": "^1.4.3",
    },
    internal: [],
  },

  related: ["properties-form", "detail-panel", "filter-stack", "entity-picker"],
};
