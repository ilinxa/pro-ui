import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "card-tree",
  name: "Card Tree",
  category: "data",

  description:
    "JSON-driven recursive card tree with a full structural editor — drag and drop, multi-select, permissions, search, validation, and undo.",
  context:
    "Card Tree renders deeply nested structured content — agent transcripts, configuration trees, decision records, runbooks, requirement docs — as a card-tree where each card has typed scalar flat fields (string/number/boolean/null/date), five predefined content blocks (codearea, image, table, quote, list), child cards, and per-card meta. v0.4 completes the safety net: sync validation hooks via 3-layer pipeline (built-in → per-action → master) with `onValidationFailed` event, plus per-commit undo/redo (state-snapshot strategy with structural sharing, default 50-step history, `Cmd+Z` / `Cmd+Shift+Z` / `Cmd+Y` keyboard shortcuts, optional `<CardTreeUndoToolbar>` sibling export). Markdown adapter (v0.5) deferred indefinitely as a separate companion module — card-tree itself is JSON-native. v0.6 makes `customPredefinedKeys` actually work: the prop and its docs shipped in v0.3, but nothing between parse and the renderers ever read it, so registrations were silently inert through 0.5.0. Custom keys now match on name before the value is inspected, which additionally makes array-valued blocks (Plate Value, editor.js) registrable — a shape ordinary child cards still reject by design (Q-P4).",
  features: [
    "JSON-native: accepts any plain object as a card; auto-attaches __rcid + __rcorder",
    "Typed flat-field rendering: numbers right-aligned mono, booleans as icons, ISO-8601 dates formatted",
    "Five predefined-key content blocks (codearea, image, table, quote, list)",
    "v0.6 working custom-key registration: host-defined blocks of ANY JSON shape (arrays included) render, edit, validate, search, and round-trip verbatim",
    "Per-level + per-predefined-key slot styling",
    "Full ARIA tree contract with keyboard nav (arrows, home/end, expand/collapse, multi-select)",
    "Three meta presentation modes (hidden, inline, popover) with custom renderers + audit trail",
    "Inline editor: click-to-edit fields, keys, titles, predefined blocks, and meta entries",
    "Drag-drop reordering with 2 scopes (same-level + cross-level), keyboard alternative via @dnd-kit",
    "Multi-select with shift-click range + cmd-click toggle; bulk delete / duplicate / set-field / toggle-lock",
    "Permission matrix with declarative shorthand + 11 predicate escape hatches; meta-locked cascade",
    "Native data-model search: finds matches in collapsed cards and meta — auto-expands path",
    "Configurable delete policy (cascade / promote) + collision strategy (suffix / qualify / reject)",
    "Root-removal opt-in with onRootRemoved callback + emptyTreeRenderer prop",
    "v0.4 sync validation hooks (per-action + master); onValidationFailed event for analytics",
    "v0.4 per-commit undo/redo with state-snapshot (default 50-step history) + Cmd+Z keyboard binding + optional UndoToolbar sibling export",
    "Imperative handle: getValue / getTree / isDirty / markClean / setSelection / focusCard / addCardAt / removeCard / replaceRoot / getEffectivePermissions / findNext / findPrevious / scrollToMatch / clearSearch / undo / redo / canUndo / canRedo / clearHistory",
  ],
  tags: [
    "card-tree",
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

  version: "0.6.1",
  status: "beta",
  artifactBudgetKB: 320,
  createdAt: "2026-04-28",
  updatedAt: "2026-08-18",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["popover"],
    npm: {
      "lucide-react": "^1.11.0",
      "@dnd-kit/core": "^6.3.1",
      "@dnd-kit/sortable": "^10.0.0",
      "@dnd-kit/utilities": "^3.2.2",
    },
    internal: [],
  },

  related: ["data-table"],
};
