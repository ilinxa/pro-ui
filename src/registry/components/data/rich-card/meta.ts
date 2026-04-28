import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "rich-card",
  name: "Rich Card",
  category: "data",

  description:
    "A JSON-driven recursive card-tree viewer + full structural editor with drag-drop, multi-select, permissions, custom keys, virtualization, native search, validation hooks, and undo/redo.",
  context:
    "Rich Card renders deeply nested structured content — agent transcripts, configuration trees, decision records, runbooks, requirement docs — as a card-tree where each card has typed scalar flat fields (string/number/boolean/null/date), five predefined content blocks (codearea, image, table, quote, list), child cards, and per-card meta. v0.4 completes the safety net: sync validation hooks via 3-layer pipeline (built-in → per-action → master) with `onValidationFailed` event, plus per-commit undo/redo (state-snapshot strategy with structural sharing, default 50-step history, `Cmd+Z` / `Cmd+Shift+Z` / `Cmd+Y` keyboard shortcuts, optional `<RichCardUndoToolbar>` sibling export). Markdown adapter (v0.5) deferred indefinitely as a separate companion module — rich-card itself is JSON-native.",
  features: [
    "JSON-native: accepts any plain object as a card; auto-attaches __rcid + __rcorder",
    "Typed flat-field rendering: numbers right-aligned mono, booleans as icons, ISO-8601 dates formatted",
    "Five predefined-key content blocks (codearea, image, table, quote, list) + custom-key registration",
    "Per-level + per-predefined-key slot styling",
    "Full ARIA tree contract with keyboard nav (arrows, home/end, expand/collapse, multi-select)",
    "Three meta presentation modes (hidden, inline, popover) with custom renderers + audit trail",
    "Inline editor: click-to-edit fields, keys, titles, predefined blocks, and meta entries",
    "Drag-drop reordering with 2 scopes (same-level + cross-level), keyboard alternative via @dnd-kit",
    "Multi-select with shift-click range + cmd-click toggle; bulk delete / duplicate / set-field / toggle-lock",
    "Permission matrix with declarative shorthand + 11 predicate escape hatches; meta-locked cascade",
    "Opt-in virtualization for trees >500 nodes (auto-threshold); search works regardless",
    "Native data-model search: finds matches in collapsed, virtualized, and meta — auto-expands path",
    "Configurable delete policy (cascade / promote) + collision strategy (suffix / qualify / reject)",
    "Root-removal opt-in with onRootRemoved callback + emptyTreeRenderer prop",
    "v0.4 sync validation hooks (per-action + master); onValidationFailed event for analytics",
    "v0.4 per-commit undo/redo with state-snapshot (default 50-step history) + Cmd+Z keyboard binding + optional UndoToolbar sibling export",
    "Imperative handle: getValue / getTree / isDirty / markClean / setSelection / focusCard / addCardAt / removeCard / replaceRoot / getEffectivePermissions / findNext / findPrevious / scrollToMatch / clearSearch / undo / redo / canUndo / canRedo / clearHistory",
  ],
  tags: [
    "rich-card",
    "tree",
    "outline",
    "json",
    "viewer",
    "editor",
    "drag-drop",
    "permissions",
    "search",
    "structured-content",
    "data",
  ],

  version: "0.4.0",
  status: "beta",
  createdAt: "2026-04-28",
  updatedAt: "2026-04-28",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["popover", "separator"],
    npm: {
      "lucide-react": "^1.11.0",
      "@dnd-kit/core": "^6.x",
      "@dnd-kit/sortable": "^11.x",
      "@dnd-kit/utilities": "^3.x",
      "@tanstack/react-virtual": "^3.x",
    },
    internal: [],
  },

  related: ["data-table"],
};
