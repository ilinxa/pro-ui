import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "rich-card",
  name: "Rich Card",
  category: "data",

  description:
    "A JSON-driven recursive card-tree viewer + inline editor with typed scalar fields, predefined content blocks, and full ARIA tree accessibility.",
  context:
    "Rich Card renders deeply nested structured content — agent transcripts, configuration trees, decision records, runbooks, requirement docs — as a card-tree where each card has typed scalar flat fields (string/number/boolean/null/date), five predefined content blocks (codearea, image, table, quote, list), child cards, and per-card meta. v0.2 adds inline editing under an `editable` global gate: click to edit any field value or key, click + actions menu to add/remove cards and predefined-key elements, granular change events, dirty tracking via version counter, click-driven single-select. Drag-drop, permissions, undo, and a markdown adapter are planned for v0.3–v0.5.",
  features: [
    "JSON-native: accepts any plain object as a card; auto-attaches __rcid + __rcorder",
    "Typed flat-field rendering: numbers right-aligned mono, booleans as icons, ISO-8601 dates formatted",
    "Five predefined-key content blocks: codearea, image, table, quote, list",
    "Per-level + per-predefined-key slot styling (containerClassName, headerClassName, fieldsClassName, childrenClassName)",
    "Full ARIA tree contract with keyboard nav (arrows, home/end, expand/collapse)",
    "Three meta presentation modes: hidden, inline, popover",
    "Imperative ref API: getValue() / getTree() / isDirty() / markClean() / getSelectedId()",
    "v0.2 inline editor: click-to-edit fields and titles, hover-× to remove, + buttons to add",
    "v0.2 granular change events: onFieldEdited, onCardAdded, onPredefinedRemoved, etc.",
    "v0.2 sync validation on every edit: reserved-key, sibling-key, predefined-shape collisions block commit with inline error",
    "v0.2 click-driven single-select distinct from keyboard focus",
  ],
  tags: [
    "rich-card",
    "tree",
    "outline",
    "json",
    "viewer",
    "editor",
    "structured-content",
    "data",
  ],

  version: "0.2.0",
  status: "alpha",
  createdAt: "2026-04-28",
  updatedAt: "2026-04-28",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["popover", "separator"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: ["data-table"],
};
