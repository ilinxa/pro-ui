import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "task-tree",
  name: "Task Tree",
  category: "data",

  description:
    "Hierarchical task outline with multi-select, bulk operations, search and filter toolbar, dual drag-and-drop, and virtualization.",
  context:
    "Task Tree is the lightweight cousin to task-card — same fixed TaskItem schema (cross-procomp type-only dep), thin two-line row instead of the time-aware card chrome. Use it for sub-issue lists, side-panel outlines, hierarchical task pickers, and bulk-management screens. Clicking a row opens task-card's edit popup (consumer-owned or via the TaskTreeWithEditor convenience wrapper). Shared DnD payload (application/x-ilinxa-task+json) lets drags cross between task-tree and task-card in both directions on pointer; touch DnD is internal-only by design. v0.1 ships feature-complete (no scheduled v0.2/v0.3 — see procomp plan).",
  features: [
    "Two-line row: chevron + status-indicator + checkbox + bold name + person label (top); thin truncated description (bottom)",
    "Per-row collapsibility (chevron); UI-only state (collapsedIds), not in TaskItem; default expanded",
    "Recursive children with infinite nesting",
    "Multi-select: Shift-click range + Cmd/Ctrl-click toggle + Cmd-A select all; bulk-toggle-active / bulk-remove / bulk-edit callbacks",
    "Default toolbar with search (200ms debounce) + sort (5 kinds: name/setAt/expireAt/status + custom) + filter (status/person/active)",
    "Filter mode: 'fade' (dim non-matches) or 'hide' (omit but ancestors-of-match render — VSCode style)",
    "Dual DnD: @dnd-kit (Mouse + Touch + Keyboard sensors) for internal drag; native HTML5 dataTransfer for cross-procomp drag with task-card",
    "Edge-zone drops: top 25% / middle 50% / bottom 25% (capped 8px); top/bottom = sibling adjacent; middle = reparent as last child + auto-expand target",
    "Circular-drop prevention (hit-test ban; onPermissionDenied fires with reason 'circular-drop')",
    "Virtualization via @tanstack/react-virtual; auto-enables at ≥200 total items; suspends during drag",
    "Permission matrix mirroring task-card (the `permissions` prop: default / byLevel / byItem with inherit cascade, + onPermissionDenied) gating 6 actions (edit / toggleActive / drag / dropAsSibling / dropIntoChildren / remove) — honored on BOTH the keyboard AND mouse/DnD paths (grip, active checkbox, drop targets, root-create)",
    "8 slot props: renderRow / renderName / renderDescription / renderPerson / renderStatusIndicator / renderToolbar / renderEmptyState / renderDragOverlay (slot wins over prop variant)",
    "Headless useTaskTreeState hook — superset of TaskTreeHandle plus live state values + dispatch escape hatch",
    "Controlled (value + onChange) and uncontrolled (defaultValue) modes; controlled mode uses the three-defenses pattern (microtask-defer + full-field resync guard + suppress mid-drag onChange)",
    "29-method imperative handle: tree state / item ops / single + bulk active-toggle + remove / focus / collapse / selection / query/sort/filter + v0.3 copy/cut/paste",
    "v0.3 cross-surface clipboard: copy/cut/paste TaskItems through the shared `ilinxa/task` envelope (task-card/lib/clipboard) — ⌘/Ctrl+C·X·V (document-level, gated on focus + skipped over inputs, operates on the selection or focused row) + imperative copyItems/cutItems/pasteItems; paste re-ids each subtree under the focused row; interops with card-tree / gantt / calendar",
    "v0.3 priorityOptions prop — threaded to the TaskTreeWithEditor edit card (parity with card-tree / gantt / calendar)",
    "17 object-args events (post-F-cross-12 convention)",
    "Full WAI-ARIA tree pattern: role=tree + role=treeitem + aria-level + aria-expanded + aria-selected; arrow nav + Home/End + Space + Enter + Delete/Backspace + Cmd-A + Escape",
    "Companion: <TaskTreeWithEditor> convenience export wires task-card edit popup inside a Dialog automatically",
    "Toolbar '+ New' button (createItem factory + statusOptions[0] fallback); gated behind editable + !readOnly + the matrix's level-0 addChildren rule. Wrapper opens the edit panel on a pending item; commit deferred until Submit (onCreateRequest hook)",
    "Keyboard Space + Delete honor the permissions matrix + item.locked + readOnly; fire onPermissionDenied on denial (F-perm closed)",
  ],
  tags: [
    "task-tree",
    "todo",
    "tree",
    "outline",
    "task-list",
    "hierarchical",
    "multi-select",
    "drag-and-drop",
    "virtualization",
  ],

  // 0.3.2 (2026-08-11): F-cross-13 path-b sweep — filter-popover trigger asChild →
  // buttonVariants; zero public-API change.
  version: "0.4.0",
  status: "alpha",
  artifactBudgetKB: 245,
  createdAt: "2026-05-20",
  updatedAt: "2026-08-11",

  author: { name: "ilinxa" },

  // Final dep surface after C9 — 9 shadcn primitives + 3 npm peers
  // (@dnd-kit/utilities was not needed for the v0.1 ship; the internal drag
  // uses @dnd-kit/core only). validate:meta-deps enforces parity with
  // shipped source.
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
      "dialog",
    ],
    npm: {
      "lucide-react": "^1.11.0",
      "@tanstack/react-virtual": "^3.13.24",
      "@dnd-kit/core": "^6.3.1",
    },
    internal: ["task-card"],
  },

  related: ["task-card", "kanban-board"],
};
