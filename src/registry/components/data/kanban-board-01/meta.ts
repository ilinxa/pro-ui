import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "kanban-board-01",
  name: "Kanban Board 01",
  category: "data",

  description:
    "Column-based board with drag-and-drop, swimlanes, color-tinted columns, and a pluggable renderer registry that hosts any card kind as a first-class item.",
  context:
    "Use when you need a Trello/Linear/JIRA-style board for tracking work, pipelines, or stage transitions. The renderer-registry pattern lets a single column mix the lightweight built-in `kanban-card`, the `kanban-note` annotation, and any rich card from elsewhere in this registry — all as siblings in an ordered, JSON-serializable item list. CRUD affordances are opt-in via callbacks; DnD via @dnd-kit (touch + keyboard accessible).",
  features: [
    "Renderer registry — items are pure JSON, the board delegates rendering by id",
    "Two built-in renderers: kanban-card (title + meta + tags + assignees) and kanban-note (title + body)",
    "Pluggable rich-card adapter pattern — wrap any sibling component (e.g. rich-card) as a renderer with full feature passthrough",
    "Per-renderer dragHandle mode — `shell` (whole-card grab) or `header` (top grip strip; body stays interactive for renderers with internal pointer interactions)",
    "Drag-and-drop reorder within column, across columns, and across swimlane cells — drop anywhere in a column, not only onto a card",
    "Column reorder by dragging the column header",
    "Per-column movement flags (allowReorder, allowIncoming, allowOutgoing, acceptsRendererIds)",
    "Per-item lock pins an item against any movement",
    "Built-in 6-swatch color palette per column (semantic CSS vars; overridable)",
    "Collapsible columns (~40px vertical strip) with auto-expand on drop",
    "Optional swimlanes — each (column × lane) cell is its own droppable",
    "Soft maxItems cap with overflow chip; no drop blocking",
    "Optional CRUD via callbacks (no callback = no affordance); inline editors per renderer",
    "Controlled and uncontrolled state",
    "Keyboard accessible drag (Space lift, arrows, Space drop, Escape cancel)",
    "Read-only mode disables all DnD and CRUD, leaves clicks active",
    "Native vertical column scroll when content overflows; vertical mouse-wheel scrolls the board horizontally",
  ],
  tags: ["kanban", "board", "drag-and-drop", "dnd-kit", "swimlanes", "columns", "tasks", "rich-card"],

  version: "0.4.1",
  status: "alpha",
  createdAt: "2026-05-05",
  updatedAt: "2026-06-19",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [
      "avatar",
      "badge",
      "button",
      "dropdown-menu",
      "input",
      "popover",
      "textarea",
    ],
    npm: {
      "@dnd-kit/core": "^6.3.1",
      "@dnd-kit/sortable": "^10.0.0",
      "@dnd-kit/utilities": "^3.2.2",
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: [],
};
