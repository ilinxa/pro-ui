import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "event-calendar",
  name: "Event Calendar",
  category: "data",

  description:
    "Editable event calendar with month, week, day, and agenda views — multi-day spans, drag and resize editing, clipboard support, and keyboard navigation.",
  context:
    "Event Calendar is the fifth surface onto the canonical TaskItem the rest of the task family renders: task-card (list), task-tree (outline), kanban-board (board), gantt-timeline (continuous timeline), and now event-calendar (date grid). A product's 'Calendar' tab is literally the same task data its other tabs show, with no adapter. v0.2 adds the editing layer additively over v0.1's display surface, reusing gantt's controlled-echo vocabulary + the shared TaskPermissions matrix; editable defaults off so consumers opt in. Because every task surface speaks the same TaskItem, copy/paste rides a shared 'ilinxa/task' clipboard envelope — a task copied in the calendar pastes into gantt/kanban/tree and back. Compound structure: EventCalendarRoot (headless provider) + flat parts (Toolbar / MonthView / WeekView / DayView / AgendaView / MiniNav / Inspector / QuickComposer / ContextMenu / edit overlays) + Tier-C primitives (CalendarEventChip / CalendarEventBar / CalendarTimeBlock / MonthDayCell / TimeGrid / TimeGutter / NowIndicator / AgendaRow / EventTooltip / EventEditorPanel / CalendarSkeleton) + the EventCalendar assembly. Each view is its own module so a month-only consumer never pulls the week/day time-grid code; the full-card tooltip + detail editor lazy-load task-card, so the default lightweight tooltip keeps it out of the bundle.",
  features: [
    "Four views: Month (date cells with multi-day spanning bars + chips + '+N more' overflow), Week + Day (hour time-grids: all-day band + lane-packed timed blocks + now-line), Agenda (day-grouped chronological list)",
    "Consumes the canonical TaskItem[] directly — same data as task-card / task-tree / kanban-board / gantt-timeline; no adapter",
    "Opt-in editing (editable, default off → read-only): drag-to-reschedule + edge-resize + draw/double-click create + quick-composer + right-click menu (Edit/Rename/Status/Priority/Copy/Cut/Delete) + selected-event inspector + modal detail editor + inline rename; controlled-echo events + onChange, no internal data state, gated by the shared TaskPermissions matrix",
    "Full keyboard editing: M/W/D/A switch views, ←/→ step the period, T today; focus an event → ←/→ move, Shift+←/→ (+↑/↓ in the time grid) resize, Enter edit, F2 rename, Delete remove; focus a day → Enter quick-create",
    "Cross-surface copy / cut / paste: events copy as a portable TaskItem envelope through the OS clipboard (⌘/Ctrl+C·X·V), so a task copied here pastes into gantt / kanban / tree — paste-target decides all-day vs timed",
    "All-day / timed / milestone derived via a three-layer rule: consumer classifyEvent predicate → date-only strings (parsed as floating-local, no TZ off-by-one) → span heuristic; all-day⇄timed conversion via paste-target or drag onto the all-day band",
    "Status-driven event color (statusColors + colorBy, default 'status'; colorBy='urgency' restores the v0.1 deadline ramp) imported from task-card; per-item borderColor override; high-priority Flag; overdue + inactive treatments",
    "Cursor (view + focus date) controlled OR uncontrolled; period nav, view switch, optional jump-to-date mini-nav (shadcn calendar), onRangeChange for lazy windowed fetch; height-responsive month overflow (maxEventsPerCell overrides)",
    "SSR-safe first paint (now prop seeds; client interval refreshes); finite-date guards (unparseable dates render label-only, never throw); all-day floating-local round-trip (no off-by-one)",
    "Compound: EventCalendarRoot + flat view parts + edit overlays + Tier-C primitives + the EventCalendar assembly; each view its own module (tree-shakeable); a month-only subset drops the time-grid code; the detail editor lazy-loads task-card",
  ],
  tags: [
    "event-calendar",
    "calendar",
    "month",
    "week",
    "day",
    "agenda",
    "schedule",
    "todo",
  ],

  // 0.2.5 (2026-08-11): F-cross-13 path-b sweep — asChild eliminated (context-menu
  // trigger → box-less span; hover tooltip → local portal card); zero public-API change.
  version: "0.3.0",
  status: "alpha",
  createdAt: "2026-06-22",
  updatedAt: "2026-08-11",

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
    ],
    npm: {
      "date-fns": "^4.1.0",
      "lucide-react": "^1.11.0",
      "@dnd-kit/core": "^6.3.1",
      "@dnd-kit/utilities": "^3.2.2",
    },
    internal: ["task-card"],
  },

  related: ["gantt-timeline", "task-card", "task-tree", "kanban-board"],
};
