import type { ReactNode } from "react";

/*
 * calendar-01 — the date-grid sibling of gantt-timeline-01.
 *
 * It consumes the SAME canonical TodoItem[] as the rest of the task family
 * (todo-rich-card / todo-tree / kanban-board-01 / gantt-timeline-01) and lays
 * the items onto a calendar grid (month / week / day / agenda) instead of a
 * continuous time axis. v1 is read-only; the editing surface is declared below
 * the `Editing (v0.2.0)` fence but inert in v1 (so v2 is purely additive).
 *
 * Cross-procomp reuse (mirrors gantt): the data + permission + event language
 * is IMPORTED from todo-rich-card via the same-category relative barrel and
 * RE-EXPORTED here, so a consumer importing the calendar gets the whole
 * vocabulary from one module. Rewriter-safe (same-category relative import).
 */
import type {
  TodoItem,
  TodoPerson,
  TodoStatusOption,
  TodoPriorityOption,
  TodoLabelOption,
  TodoColorRamp,
  TodoPermissions,
  TodoPermissionRule,
  TodoPermissionReason,
  TodoItemAddedEvent,
  TodoItemRemovedEvent,
  TodoItemMovedEvent,
  TodoFieldEditedEvent,
  TodoStatusChangedEvent,
} from "../todo-rich-card";

// Re-export the consumed data + editing language so a consumer importing the
// calendar gets item, option, permission, and event types without a second
// import (same-category barrel import; rewriter-safe).
export type {
  TodoItem,
  TodoPerson,
  TodoStatusOption,
  TodoPriorityOption,
  TodoLabelOption,
  TodoColorRamp,
  TodoPermissions,
  TodoPermissionRule,
  TodoPermissionReason,
  TodoItemAddedEvent,
  TodoItemRemovedEvent,
  TodoItemMovedEvent,
  TodoFieldEditedEvent,
  TodoStatusChangedEvent,
};

/* ───────── calendar enums + occurrence ───────── */

export type CalendarView = "month" | "week" | "day" | "agenda";

/** 0 = Sunday … 6 = Saturday (matches date-fns `weekStartsOn`). */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Semantic tone, mirrored from TodoStatusOption.tone. */
export type CalendarStatusTone = "active" | "done" | "blocked";

/** How an event is laid out. Derived (never stored on TodoItem) — see lib/classify.ts. */
export type EventKind = "all-day" | "timed" | "milestone";

export type CalendarEventColor = {
  fill: string;
  foreground: string;
  border?: string;
};

/**
 * Normalized, render-ready event — the output of lib/occurrences.ts. Exported
 * for advanced Tier-C use (like gantt's GanttRow / GanttBarGeometry).
 */
export type CalendarOccurrence = {
  /** The source item (the calendar never mutates it). */
  item: TodoItem;
  /** = item.id */
  id: string;
  kind: EventKind;
  /** Effective start, epoch ms (floating-local for date-only all-day). */
  startMs: number;
  /** Effective end, epoch ms (= startMs for a milestone). */
  endMs: number;
  /** kind !== "timed". */
  allDay: boolean;
  tone: CalendarStatusTone;
  color: CalendarEventColor;
  /** endMs < now && tone !== "done". */
  overdue: boolean;
  /** item.active === false. */
  inactive: boolean;
  /** Unparseable date → finite-guard; rendered label-only, no geometry. */
  invalid?: boolean;
};

export type CalendarTooltipRenderer = (
  item: TodoItem,
  occ: CalendarOccurrence,
) => ReactNode;

/* ───────── public component props ───────── */

export type CalendarProps = {
  // ── Data (identical surface to gantt / card / tree) ──
  data: TodoItem[];
  statusOptions?: TodoStatusOption[];
  priorityOptions?: TodoPriorityOption[];
  labelOptions?: TodoLabelOption[];
  /** Urgency ramp; RAMPS imported from todo-rich-card. */
  colorRamp?: TodoColorRamp;

  // ── Cursor: view + focus date (each controlled OR uncontrolled) ──
  defaultView?: CalendarView; // default "month"
  view?: CalendarView; // controlled
  onViewChange?: (view: CalendarView) => void;
  defaultDate?: Date; // default = now
  date?: Date; // controlled focus date
  onDateChange?: (date: Date) => void;
  /** Fires on every cursor move with the newly-visible window (lazy data fetch). */
  onRangeChange?: (range: {
    view: CalendarView;
    start: Date;
    end: Date;
  }) => void;

  // ── Calendar config ──
  weekStartsOn?: WeekStart; // default 1 (Mon)
  now?: Date | string; // SSR-stable now; client interval refreshes
  colorRefreshIntervalMs?: number; // urgency tick; default 60_000
  agendaRangeDays?: number; // default 30
  maxEventsPerCell?: number; // month overflow cap; default = height-responsive
  scrollToHour?: number; // time-grid initial scroll; default 8
  /** Classification escape hatch (layer 1 of the 3-layer rule). */
  classifyEvent?: (item: TodoItem) => EventKind | undefined;

  // ── Assembly toggles + layout ──
  showToolbar?: boolean; // default true (assembly only)
  showMiniNav?: boolean; // default false (assembly only)
  /** Trim the toolbar view switch + assembly's mountable views. Default all four. */
  views?: CalendarView[];
  className?: string;
  "aria-label"?: string;

  // ── Read-only interactions ──
  selectedId?: string | null;
  onSelect?: (itemId: string | null) => void;
  onTaskClick?: (item: TodoItem) => void;
  onDateClick?: (date: Date) => void;
  onShowMore?: (date: Date, items: TodoItem[]) => void;
  /** Override the hover tooltip; default = lightweight summary. */
  renderTooltip?: CalendarTooltipRenderer;

  // ══ Editing (v0.2.0) — ALL opt-in; default surface is the v1 read-only calendar ══
  /** Master switch. Default false → byte-identical v1 read-only behavior. */
  editable?: boolean;
  /** Full mutated forest after ANY edit; controlled consumer echoes into `data`. */
  onChange?: (data: TodoItem[]) => void;
  /** Reschedule sugar — fires alongside onChange/onFieldEdited (kept from gantt). */
  onTaskReschedule?: (next: {
    itemId: string;
    startAt: string;
    expireAt?: string;
  }) => void;
  // CRUD + field events (shapes reused verbatim from todo-rich-card)
  onItemAdded?: (event: TodoItemAddedEvent) => void;
  onItemRemoved?: (event: TodoItemRemovedEvent) => void;
  onItemMoved?: (event: TodoItemMovedEvent) => void;
  onFieldEdited?: (event: TodoFieldEditedEvent) => void;
  onStatusChanged?: (event: TodoStatusChangedEvent) => void;
  // Permissions (reused from todo-rich-card; mirrors gantt + tree)
  permissions?: TodoPermissions;
  canMoveItem?: (id: string) => boolean;
  canResizeItem?: (id: string) => boolean;
  canDeleteItem?: (id: string) => boolean;
  canCreateChild?: (id: string) => boolean;
  canEditItem?: (id: string) => boolean;
  onPermissionDenied?: (
    action: keyof TodoPermissionRule,
    itemId: string,
    reason: TodoPermissionReason,
  ) => void;
};

/** Headless provider props = assembly props minus the assembly-only toggles. */
export type CalendarRootProps = Omit<
  CalendarProps,
  "showToolbar" | "showMiniNav"
> & {
  children: ReactNode;
};

/* ───────── imperative handle ───────── */

export type CalendarHandle = {
  goToDate(date: Date): void;
  goToToday(): void;
  setView(view: CalendarView): void;
  next(): void;
  prev(): void;
  getVisibleRange(): { start: Date; end: Date };
  // Editing (v0.2.0) — no-ops when `editable` is false / permission denied.
  addTask(date: Date, item?: Partial<TodoItem>): void;
  deleteTask(itemId: string): void;
  editTask(itemId: string): void;
};

/* ───────── context (internal; constructed in the Root) ───────── */

export type CalendarContextValue = {
  // cursor
  view: CalendarView;
  focusDate: Date;
  visibleRange: { start: Date; end: Date };
  weekStartsOn: WeekStart;
  availableViews: CalendarView[];

  // data
  occurrences: CalendarOccurrence[];
  nowMs: number;

  // config
  agendaRangeDays: number;
  maxEventsPerCell?: number;
  scrollToHour: number;
  statusOptions?: TodoStatusOption[];
  priorityOptions?: TodoPriorityOption[];
  labelOptions?: TodoLabelOption[];

  // selection
  selectedId: string | null;

  // cursor actions
  setView(view: CalendarView): void;
  goToDate(date: Date): void;
  goToToday(): void;
  next(): void;
  prev(): void;
  select(id: string | null): void;

  // read-only interaction callbacks
  onTaskClick?: (item: TodoItem) => void;
  onDateClick?: (date: Date) => void;
  onShowMore?: (date: Date, items: TodoItem[]) => void;
  renderTooltip?: CalendarTooltipRenderer;
};
