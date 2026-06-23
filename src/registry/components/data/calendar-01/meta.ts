import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "calendar-01",
  name: "Calendar 01",
  category: "data",

  description:
    "Editable calendar over the canonical TodoItem[] — the date-grid sibling of gantt-timeline-01. Four views (month grid with multi-day spanning bars + chips + \"+N more\", week & day hour time-grids with an all-day band + lane-packed timed blocks + now-line, and a day-grouped agenda), period navigation, view switching, an optional jump-to-date mini-nav, hover tooltips, selection, and keyboard shortcuts. Opt-in editing (editable, default off): drag-to-reschedule, edge-resize, draw/double-click create, a Google-style quick-composer, a right-click menu, an inspector + modal detail editor, inline rename, full keyboard editing, and cross-surface copy/cut/paste that carries tasks through the OS clipboard to gantt / kanban / tree. All-day vs timed vs milestone is derived via a three-layer rule (consumer predicate → date-only strings → span heuristic); event color is status-driven, imported from todo-rich-card so it matches the card + gantt. Controlled-echo (no internal data state) with the shared TodoPermissions matrix. Ships as a shadcn-style compound.",
  context:
    "Calendar 01 is the fifth surface onto the canonical TodoItem the rest of the task family renders: todo-rich-card (list), todo-tree (outline), kanban-board-01 (board), gantt-timeline-01 (continuous timeline), and now calendar-01 (date grid). A product's 'Calendar' tab is literally the same task data its other tabs show, with no adapter. v0.2 adds the editing layer additively over v0.1's display surface, reusing gantt's controlled-echo vocabulary + the shared TodoPermissions matrix; editable defaults off so consumers opt in. Because every task surface speaks the same TodoItem, copy/paste rides a shared 'ilinxa/task' clipboard envelope — a task copied in the calendar pastes into gantt/kanban/tree and back. Compound structure: Calendar01Root (headless provider) + flat parts (Toolbar / MonthView / WeekView / DayView / AgendaView / MiniNav / Inspector / QuickComposer / ContextMenu / edit overlays) + Tier-C primitives (CalendarEventChip / CalendarEventBar / CalendarTimeBlock / MonthDayCell / TimeGrid / TimeGutter / NowIndicator / AgendaRow / EventTooltip / EventEditorPanel / CalendarSkeleton) + the Calendar01 assembly. Each view is its own module so a month-only consumer never pulls the week/day time-grid code; the full-card tooltip + detail editor lazy-load todo-rich-card, so the default lightweight tooltip keeps it out of the bundle.",
  features: [
    "Four views: Month (date cells with multi-day spanning bars + chips + '+N more' overflow), Week + Day (hour time-grids: all-day band + lane-packed timed blocks + now-line), Agenda (day-grouped chronological list)",
    "Consumes the canonical TodoItem[] directly — same data as todo-rich-card / todo-tree / kanban-board-01 / gantt-timeline-01; no adapter",
    "Opt-in editing (editable, default off → read-only): drag-to-reschedule + edge-resize + draw/double-click create + quick-composer + right-click menu (Edit/Rename/Status/Priority/Copy/Cut/Delete) + selected-event inspector + modal detail editor + inline rename; controlled-echo events + onChange, no internal data state, gated by the shared TodoPermissions matrix",
    "Full keyboard editing: M/W/D/A switch views, ←/→ step the period, T today; focus an event → ←/→ move, Shift+←/→ (+↑/↓ in the time grid) resize, Enter edit, F2 rename, Delete remove; focus a day → Enter quick-create",
    "Cross-surface copy / cut / paste: events copy as a portable TodoItem envelope through the OS clipboard (⌘/Ctrl+C·X·V), so a task copied here pastes into gantt / kanban / tree — paste-target decides all-day vs timed",
    "All-day / timed / milestone derived via a three-layer rule: consumer classifyEvent predicate → date-only strings (parsed as floating-local, no TZ off-by-one) → span heuristic; all-day⇄timed conversion via paste-target or drag onto the all-day band",
    "Status-driven event color (statusColors + colorBy, default 'status'; colorBy='urgency' restores the v0.1 deadline ramp) imported from todo-rich-card; per-item borderColor override; high-priority Flag; overdue + inactive treatments",
    "Cursor (view + focus date) controlled OR uncontrolled; period nav, view switch, optional jump-to-date mini-nav (shadcn calendar), onRangeChange for lazy windowed fetch; height-responsive month overflow (maxEventsPerCell overrides)",
    "SSR-safe first paint (now prop seeds; client interval refreshes); finite-date guards (unparseable dates render label-only, never throw); all-day floating-local round-trip (no off-by-one)",
    "Compound: Calendar01Root + flat view parts + edit overlays + Tier-C primitives + the Calendar01 assembly; each view its own module (tree-shakeable); a month-only subset drops the time-grid code; the detail editor lazy-loads todo-rich-card",
  ],
  tags: [
    "calendar-01",
    "calendar",
    "month",
    "week",
    "day",
    "agenda",
    "schedule",
    "todo",
  ],

  version: "0.2.2",
  status: "alpha",
  createdAt: "2026-06-22",
  updatedAt: "2026-06-23",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [
      "avatar",
      "badge",
      "button",
      "calendar",
      "context-menu",
      "input",
      "popover",
      "skeleton",
      "tooltip",
    ],
    npm: {
      "date-fns": "^4.1.0",
      "lucide-react": "^1.11.0",
      "@dnd-kit/core": "^6.3.1",
      "@dnd-kit/utilities": "^3.2.2",
    },
    internal: ["todo-rich-card"],
  },

  related: ["gantt-timeline-01", "todo-rich-card", "todo-tree", "kanban-board-01"],
};
