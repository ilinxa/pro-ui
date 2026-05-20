import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "todo-tree",
  name: "Todo Tree",
  category: "data",

  description:
    "Lightweight tree-row renderer for TodoItem outlines. Two-line row (bold name + thin description), per-row collapsibility, multi-select + bulk ops, default sort/filter/search toolbar, dual DnD (internal @dnd-kit + cross-procomp HTML5 with todo-rich-card), virtualization, 8 slot props, and a headless useTodoTreeState hook.",
  context:
    "Todo Tree is the lightweight cousin to todo-rich-card — same fixed TodoItem schema (cross-procomp type-only dep), thin two-line row instead of the time-aware card chrome. Use it for sub-issue lists, side-panel outlines, hierarchical task pickers, and bulk-management screens. Clicking a row opens todo-rich-card's edit popup (consumer-owned or via the TodoTreeWithEditor convenience wrapper). Shared DnD payload (application/x-ilinxa-todo+json) lets drags cross between todo-tree and todo-rich-card in both directions on pointer; touch DnD is internal-only by design. v0.1 ships feature-complete (no scheduled v0.2/v0.3 — see procomp plan).",
  features: [
    "Two-line row: chevron + status-indicator + checkbox + bold name + person label (top); thin truncated description (bottom)",
    "Per-row collapsibility (chevron); UI-only state (collapsedIds), not in TodoItem; default expanded",
    "Recursive children with infinite nesting",
    "Multi-select: Shift-click range + Cmd/Ctrl-click toggle + Cmd-A select all; bulk-toggle-active / bulk-remove / bulk-edit callbacks",
    "Default toolbar with search (200ms debounce) + sort (5 kinds: name/setAt/expireAt/status + custom) + filter (status/person/active)",
    "Filter mode: 'fade' (dim non-matches) or 'hide' (omit but ancestors-of-match render — VSCode style)",
    "Dual DnD: @dnd-kit (Mouse + Touch + Keyboard sensors) for internal drag; native HTML5 dataTransfer for cross-procomp drag with todo-rich-card",
    "Edge-zone drops: top 25% / middle 50% / bottom 25% (capped 8px); top/bottom = sibling adjacent; middle = reparent as last child + auto-expand target",
    "Circular-drop prevention (hit-test ban; onPermissionDenied fires with reason 'circular-drop')",
    "Virtualization via @tanstack/react-virtual; auto-enables at ≥200 total items; suspends during drag",
    "Permission matrix mirroring todo-rich-card; 6 tree-side gates (canEditItem / canToggleActive / canDragItem / canDropAsSibling / canDropIntoChildren / canRemoveItem)",
    "8 slot props: renderRow / renderName / renderDescription / renderPerson / renderStatusIndicator / renderToolbar / renderEmptyState / renderDragOverlay (slot wins over prop variant)",
    "Headless useTodoTreeState hook — superset of TodoTreeHandle plus live state values + dispatch escape hatch",
    "Controlled (value + onChange) and uncontrolled (defaultValue) modes; controlled mode uses the three-defenses pattern (microtask-defer + structural resync guard + suppress mid-drag onChange)",
    "26-method imperative handle: tree state / item ops / single + bulk active-toggle + remove / focus / collapse / selection / query/sort/filter",
    "17 object-args events (post-F-cross-12 convention)",
    "Full WAI-ARIA tree pattern: role=tree + role=treeitem + aria-level + aria-expanded + aria-selected; arrow nav + Home/End + Space + Enter + Delete/Backspace + Cmd-A + Escape",
    "Companion: <TodoTreeWithEditor> convenience export wires todo-rich-card edit popup inside a Dialog automatically",
  ],
  tags: [
    "todo-tree",
    "todo",
    "tree",
    "outline",
    "task-list",
    "hierarchical",
    "multi-select",
    "drag-and-drop",
    "virtualization",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-05-20",
  updatedAt: "2026-05-20",

  author: { name: "ilinxa" },

  // Note: shadcn + npm deps grow as each commit (C2–C8) lands its imports.
  // validate:meta-deps enforces meta-vs-imports parity so we keep meta in sync
  // with what's actually imported in shipped source. The full target surface is
  // documented in the plan §14 — final state will be ~12 shadcn primitives +
  // 4 npm peer deps (lucide-react, @dnd-kit/core, @dnd-kit/utilities, @tanstack/react-virtual).
  dependencies: {
    shadcn: [
      "checkbox",
      "avatar",
      "button",
      "input",
      "select",
      "popover",
      "badge",
      "separator",
    ],
    npm: {
      "lucide-react": "^1.11.0",
      "@tanstack/react-virtual": "^3.13.24",
      "@dnd-kit/core": "^6.3.1",
    },
    internal: ["todo-rich-card"],
  },

  related: ["todo-rich-card", "kanban-board-01"],
};
