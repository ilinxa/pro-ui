import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "calendar-01",
  name: "Calendar 01",
  category: "data",

  description:
    "Read-only calendar over the canonical TodoItem[] — the date-grid sibling of gantt-timeline-01. Four views (month grid with multi-day spanning bars + chips + \"+N more\", week & day hour time-grids with an all-day band + lane-packed timed blocks + now-line, and a day-grouped agenda), period navigation, view switching, an optional jump-to-date mini-nav, hover tooltips, selection, and keyboard shortcuts. All-day vs timed vs milestone is derived via a three-layer rule (consumer predicate → date-only strings → span heuristic); status/urgency color is imported from todo-rich-card so it matches the card + gantt exactly. The v2 editing surface (drag-to-reschedule, create, detail popover, permissions) is declared but inert in v1. Ships as a shadcn-style compound.",
  context:
    "Calendar 01 is the fifth surface onto the canonical TodoItem the rest of the task family renders: todo-rich-card (list), todo-tree (outline), kanban-board-01 (board), gantt-timeline-01 (continuous timeline), and now calendar-01 (date grid). A product's 'Calendar' tab is literally the same task data its other tabs show, with no adapter. v1 is a display surface (read-only); its cursor + occurrence model is architected so v2 editing drops in additively, reusing gantt's controlled-echo vocabulary + the shared TodoPermissions matrix. Compound structure: Calendar01Root (headless provider) + flat parts (Toolbar / MonthView / WeekView / DayView / AgendaView / MiniNav) + Tier-C primitives (CalendarEventChip / CalendarEventBar / CalendarTimeBlock / MonthDayCell / TimeGrid / TimeGutter / NowIndicator / AgendaRow / EventTooltip / CalendarSkeleton) + the Calendar01 assembly. Each view is its own module so a month-only consumer never pulls the week/day time-grid code; the full-card tooltip (CalendarFullCardTooltip) lazy-loads todo-rich-card, so the default lightweight tooltip keeps it out of the bundle.",
  features: [
    "Four views: Month (date cells with multi-day spanning bars + chips + '+N more' overflow), Week + Day (hour time-grids: all-day band + lane-packed timed blocks + now-line), Agenda (day-grouped chronological list)",
    "Consumes the canonical TodoItem[] directly — same data as todo-rich-card / todo-tree / kanban-board-01 / gantt-timeline-01; no adapter",
    "All-day / timed / milestone derived via a three-layer rule: consumer classifyEvent predicate → date-only strings (parsed as floating-local, no TZ off-by-one) → span heuristic",
    "Status/urgency color imported from todo-rich-card (RAMPS) — identical tone output to the card + gantt; per-item borderColor override; overdue + inactive treatments",
    "Cursor (view + focus date) controlled OR uncontrolled; period nav (prev/next/today), view switch, optional jump-to-date mini-nav (shadcn calendar), onRangeChange for lazy windowed fetch",
    "Keyboard: M/W/D/A switch views, ←/→ + PageUp/PageDown step the period, T jumps to today; events are focusable buttons; native-title hover summary (renderTooltip override lazy-embeds the full card)",
    "SSR-safe first paint (now prop seeds; client interval refreshes); finite-date guards (unparseable dates render label-only, never throw)",
    "States: empty / loading (CalendarSkeleton) / dense day (lane-pack) / DST-transition / month-boundary week / all-milestone / all-multi-day",
    "Compound: Calendar01Root + flat view parts + Tier-C primitives + the Calendar01 assembly; each view its own module (tree-shakeable); a month-only subset drops the time-grid code",
    "v0.2 editing (declared, inert in v1): editable + drag-to-reschedule + create + detail popover + the shared TodoPermissions matrix + controlled-echo events",
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

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-06-22",
  updatedAt: "2026-06-22",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [
      "avatar",
      "badge",
      "button",
      "calendar",
      "popover",
      "skeleton",
      "toggle-group",
      "tooltip",
    ],
    npm: {
      "date-fns": "^4.1.0",
      "lucide-react": "^1.11.0",
    },
    internal: ["todo-rich-card"],
  },

  related: ["gantt-timeline-01", "todo-rich-card", "todo-tree", "kanban-board-01"],
};
