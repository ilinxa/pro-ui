import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "todo-rich-card",
  name: "Todo Rich Card",
  category: "data",

  description:
    "Fixed-schema task card with time-driven OKLCH border-color engine, dual edit modes (popup default + inline-toggle), JSON I/O, clipboard, DnD payload, granular events, and permission predicates. Standalone-usable and registerable in kanban-board-01 (named export) or flow-canvas-01 (via sibling adapter).",
  context:
    "Todo Rich Card is a time-aware task renderer for workflow apps, content schedulers, and agent run-queues. It carries the standard task fields (name, description, status, active, target/creator person, multi-image, multi-link, dates) and paints urgency onto the card border via an OKLCH ramp (green → red, urgency direction; past expireAt pins full red). The engine accepts setAt + startAt + expireAt OR duration with deterministic precedence (expireAt wins). Two edit modes ship in v0.1: a popup dialog form (default) and an inline-toggle mode (editable=true) where fields swap to inputs in place. JSON I/O mirrors rich-card patterns — controlled (value) or uncontrolled (defaultValue), 12-method imperative handle (getValue / getTree / isDirty / markClean / focusItem / copy / paste / setBorderColor / toggleActive / setLocked / openEdit / closeEdit), clipboard via application/x-ilinxa-todo+json MIME + Cmd/Ctrl+C/V, HTML5 DnD with the same payload. Granular events (onFieldEdited / onStatusChanged / onItemAdded / onItemRemoved / onItemMoved / onColorOverridden / onActiveToggled / onLockedToggled / onCopy / onPaste / onChange) cover every mutation. Permissions mirror rich-card: declarative permissions matrix (default / byLevel / byItem with inherit cascade) + six per-action predicates + onPermissionDenied for analytics. Companion: ships todoRichCardKanbanRenderer for kanban-board-01 with dragHandle:'shell' (v0.3 — the whole card is the drag activator; the adapter passes canDragItem={()=>false} to disable the card's own HTML5 drag so the two DnD systems don't fight). Per-card collapsibility (chevron in header) hides body + nested children to compact deep trees. v0.3 adds: a two-line header so the title never truncates to nothing; an editable status badge that becomes a status-change dropdown (statusEditable, default true); status tones (TodoStatusOption.tone done/blocked → gray border + dimmed overlay + auto-collapse) that decouple the status signal from the time-driven urgency border; and a priority + labels model extension (TodoItem.priority / labels with priorityOptions / labelOptions) rendered as a header meta row. Color override surfaces as a centered Dialog with palette swatches + custom CSS color input + an Auto button that clears the override and hands control back to the time engine.",
  features: [
    "Fixed TodoItem schema (closed; consumer-defined status enum)",
    "Time-driven OKLCH border-color engine (green → red urgency ramp, four named presets + custom-fn escape hatch)",
    "Single root setInterval for color refresh (default 60s; configurable; 0 disables) — never per-card",
    "Two edit modes in v0.1: popup dialog (default) and inline-toggle (editable=true) — both share the same field→primitive mapping",
    "Per-item borderColor override skips the engine; per-host colorRamp swaps the ramp globally",
    "Per-item lock blocks edit + drag; onLockedToggled fires on changes",
    "Multi-image + multi-link support with sensible default renderers (slot props for v0.2)",
    "Controlled (`value`) + uncontrolled (`defaultValue`) modes — onChange reports edits; controlled value reconciles with an echo guard",
    "JSON I/O mirroring rich-card v0.3 — defaultValue + imperative handle with getValue / getTree / isDirty / markClean / focusItem / copy / paste / setBorderColor / toggleActive / setLocked / openEdit / closeEdit",
    "Clipboard ops with application/x-ilinxa-todo+json MIME + text/plain fallback + Cmd/Ctrl+C / Cmd/Ctrl+V keyboard bindings",
    "HTML5 DnD card-as-source + card-as-children-drop-target with the same payload",
    "Granular event surface — 11 typed events covering every mutation (mirrors rich-card)",
    "Permission matrix: declarative permissions {default, byLevel, byItem, inherit} + 6 per-action predicates + onPermissionDenied with typed reason",
    "Infinite recursive nesting; children carry the same action affordances as parents",
    "Per-card collapsibility — chevron in the header toggles body + children visibility (UI-only state; not part of TodoItem schema)",
    "Two-line header (v0.3) — title wraps up to 3 lines and never truncates to nothing, even in a narrow kanban column",
    "Editable status badge (v0.3) — becomes a status-change dropdown when editable (statusEditable, default true) reusing the inline editor's reducer action + events",
    "Status tones (v0.3) — TodoStatusOption.tone done/blocked gets a gray border + dimmed overlay + auto-collapse, decoupling status from the time-driven urgency border",
    "Priority + labels (v0.3) — optional TodoItem.priority / labels with priorityOptions / labelOptions render a header meta row (border/text color only; renders nothing when unset)",
    "Color override via centered Dialog (palette swatches + custom CSS color input + Auto button to hand control back to the engine)",
    "ARIA: role='region' root + role='article' per card + role='group' for children; full a11y on edit affordances",
    "SSR hydration mitigated via `suppressHydrationWarning` on the article root (sub-frame visual flash; data consistent server→client); pass frozen `now` for deterministic SSR",
    "Companion: todoRichCardKanbanRenderer named export for kanban-board-01 with dragHandle:'shell' (v0.3) + canDragItem disabled so the card and board DnD don't fight",
  ],
  tags: [
    "todo",
    "task",
    "rich-card",
    "time-aware",
    "auto-color",
    "drag-drop",
    "clipboard",
    "permissions",
    "kanban-renderer",
    "data",
  ],

  version: "0.3.0",
  status: "alpha",
  createdAt: "2026-05-20",
  updatedAt: "2026-06-19",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [
      "avatar",
      "badge",
      "button",
      "dialog",
      "dropdown-menu",
      "input",
      "label",
      "scroll-area",
      "select",
      "separator",
      "switch",
      "textarea",
      "tooltip",
    ],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["rich-card", "kanban-board-01", "data-table"],
};
