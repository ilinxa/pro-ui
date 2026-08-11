import type { ReactNode } from "react";
import type { CalendarEditExtension } from "./hooks/use-calendar-edit-extension";

/*
 * event-calendar — the date-grid sibling of gantt-timeline.
 *
 * It consumes the SAME canonical TaskItem[] as the rest of the task family
 * (task-card / task-tree / kanban-board / gantt-timeline) and lays
 * the items onto a calendar grid (month / week / day / agenda) instead of a
 * continuous time axis. v1 is read-only; the editing surface is declared below
 * the `Editing (v0.2.0)` fence but inert in v1 (so v2 is purely additive).
 *
 * Cross-procomp reuse (mirrors gantt): the data + permission + event language
 * is IMPORTED from task-card via the same-category relative barrel and
 * RE-EXPORTED here, so a consumer importing the calendar gets the whole
 * vocabulary from one module. Rewriter-safe (same-category relative import).
 */
import type {
  TaskItem,
  TaskPerson,
  TaskStatusOption,
  TaskPriorityOption,
  TaskLabelOption,
  TaskColorRamp,
  TaskPermissions,
  TaskPermissionRule,
  TaskPermissionReason,
  TaskEditableField,
  TaskItemAddedEvent,
  TaskItemRemovedEvent,
  TaskItemMovedEvent,
  TaskFieldEditedEvent,
  TaskStatusChangedEvent,
} from "../task-card";

// Re-export the consumed data + editing language so a consumer importing the
// calendar gets item, option, permission, and event types without a second
// import (same-category barrel import; rewriter-safe).
export type {
  TaskItem,
  TaskPerson,
  TaskStatusOption,
  TaskPriorityOption,
  TaskLabelOption,
  TaskColorRamp,
  TaskPermissions,
  TaskPermissionRule,
  TaskPermissionReason,
  TaskEditableField,
  TaskItemAddedEvent,
  TaskItemRemovedEvent,
  TaskItemMovedEvent,
  TaskFieldEditedEvent,
  TaskStatusChangedEvent,
};

/* ───────── calendar enums + occurrence ───────── */

export type CalendarView = "month" | "week" | "day" | "agenda";

/** 0 = Sunday … 6 = Saturday (matches date-fns `weekStartsOn`). */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Semantic tone, mirrored from TaskStatusOption.tone. */
export type CalendarStatusTone = "active" | "done" | "blocked";

/** How an event is laid out. Derived (never stored on TaskItem) — see lib/classify.ts. */
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
  item: TaskItem;
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
  /** Priority-flag color when flagged (see CalendarProps.flagPriority); else absent. */
  flagColor?: string;
  /** Unparseable date → finite-guard; rendered label-only, no geometry. */
  invalid?: boolean;
};

export type CalendarTooltipRenderer = (
  item: TaskItem,
  occ: CalendarOccurrence,
) => ReactNode;

/* ───────── editing (v0.2.0) enums + renderers ───────── */

/** Drag/resize snap granularity. Time grid snaps to the minute increment;
 *  Month always snaps to the day regardless of this value. Default "15min". */
export type CalendarSnap =
  | "minute"
  | "5min"
  | "15min"
  | "30min"
  | "hour"
  | "day"
  | "off"
  | number;

/** Edit actions; mapped onto task-card's `TaskPermissionRule` keys by the
 *  editing feature's `lib/edit-permissions.ts` (move/resize→drag,
 *  delete→remove, create→addChildren, editDetails→edit). Mirrors gantt's
 *  `GanttEditAction`. */
export type CalendarEditAction =
  | "move"
  | "resize"
  | "delete"
  | "create"
  | "editDetails";

/** Where the quick-composer is anchored + the seeded window. `x`/`y` are the
 *  pointer coords for floating placement (omitted for programmatic opens). */
export type CalendarComposerTarget = {
  date: Date;
  allDay: boolean;
  defaultEnd: Date;
  x?: number;
  y?: number;
};

/** Override the default quick mini-composer (title + time + "More options"). */
export type CalendarQuickComposerRenderer = (args: {
  date: Date;
  allDay: boolean;
  defaultEnd: Date;
  commit: (seed: Partial<TaskItem>) => void;
  cancel: () => void;
  openFull: () => void;
}) => ReactNode;

/* ───────── public component props ───────── */

export type CalendarProps = {
  // ── Data (identical surface to gantt / card / tree) ──
  data: TaskItem[];
  statusOptions?: TaskStatusOption[];
  priorityOptions?: TaskPriorityOption[];
  labelOptions?: TaskLabelOption[];
  /** Urgency ramp; RAMPS imported from task-card. Used only when `colorBy` is "urgency". */
  colorRamp?: TaskColorRamp;
  /** Per-status accent color (status value → CSS color). When an item's status
   *  has an entry it drives the event color — so changing status changes color. */
  statusColors?: Record<string, string>;
  /** What drives the event accent: "status" (default — by status/tone) or
   *  "urgency" (the v1 time-elapsed ramp that matches task-card + gantt). */
  colorBy?: "status" | "urgency";

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
  classifyEvent?: (item: TaskItem) => EventKind | undefined;
  /** Show a small priority flag on events where this returns true (flag color =
   *  the item's `priorityOptions` color). Opt-in; e.g. `(i) => i.priority === "high"`. */
  flagPriority?: (item: TaskItem) => boolean;

  // ── Assembly toggles + layout ──
  showToolbar?: boolean; // default true (assembly only)
  showMiniNav?: boolean; // default false (assembly only)
  /** Render the selected-event inspector panel as a side column. Default false (assembly only). */
  showInspector?: boolean;
  /** Trim the toolbar view switch + assembly's mountable views. Default all four. */
  views?: CalendarView[];
  className?: string;
  "aria-label"?: string;

  // ── Read-only interactions ──
  selectedId?: string | null;
  onSelect?: (itemId: string | null) => void;
  onTaskClick?: (item: TaskItem) => void;
  /** Fires on a day click. NOTE: when `editable`, month day single-click is taken
   *  over by editing (double-click / Enter composes), so this does not fire there. */
  onDateClick?: (date: Date) => void;
  onShowMore?: (date: Date, items: TaskItem[]) => void;
  /** Override the hover tooltip; default = lightweight summary. */
  renderTooltip?: CalendarTooltipRenderer;

  // ══ Editing (v0.2.0) — ALL opt-in; default surface is the v1 read-only calendar ══
  /** Master switch. Default false → byte-identical v1 read-only behavior. */
  editable?: boolean;
  /** Wires the editing feature slice (P3 — `@ilinxa/event-calendar-editing`).
   *  Import `calendarEditing` from the feature's barrel and pass it here
   *  alongside `editable` to enable drag/resize/create/clipboard/keyboard
   *  editing. `editable` without `editing` stays read-only (one dev
   *  `console.warn`) — the base package never statically imports the feature. */
  editing?: CalendarEditExtension;
  /** Full mutated forest after ANY edit; controlled consumer echoes into `data`. */
  onChange?: (data: TaskItem[]) => void;
  /** Reschedule sugar — fires alongside onChange/onFieldEdited (kept from gantt). */
  onTaskReschedule?: (next: {
    itemId: string;
    startAt: string;
    expireAt?: string;
  }) => void;
  // CRUD + field events (shapes reused verbatim from task-card)
  onItemAdded?: (event: TaskItemAddedEvent) => void;
  onItemRemoved?: (event: TaskItemRemovedEvent) => void;
  onItemMoved?: (event: TaskItemMovedEvent) => void;
  /** Granular per-field edit event. Fires for name / description / status /
   *  active / setAt / startAt / expireAt / duration from drag-reschedule,
   *  inline rename, context-menu status, AND the inspector / modal detail editor
   *  (v0.2.2). NOTE: `priority` is intentionally absent — it is not a
   *  `TaskEditableField`, so it cannot be carried by `TaskFieldEditedEvent`;
   *  priority changes persist via `onChange` only. */
  onFieldEdited?: (event: TaskFieldEditedEvent) => void;
  onStatusChanged?: (event: TaskStatusChangedEvent) => void;
  // Permissions (reused from task-card; mirrors gantt + tree)
  permissions?: TaskPermissions;
  canMoveItem?: (id: string) => boolean;
  canResizeItem?: (id: string) => boolean;
  canDeleteItem?: (id: string) => boolean;
  canCreateChild?: (id: string) => boolean;
  canEditItem?: (id: string) => boolean;
  onPermissionDenied?: (
    action: keyof TaskPermissionRule,
    itemId: string,
    reason: TaskPermissionReason,
  ) => void;
  /** Drag/resize snap granularity (time grid). Default "15min". */
  snap?: CalendarSnap;
  /** Create opens the Google-style quick mini-composer (default true when
   *  editable); false → create opens the full detail card directly. */
  quickCompose?: boolean;
  /** RESERVED — not wired by any gesture in v0.2.0. Cross-surface task transfer
   *  ships as copy/paste (the `ilinxa/task` clipboard envelope), so native HTML5
   *  external drop targets are deferred; this callback stays declared for the
   *  future opt-in but never fires today. */
  onExternalDrop?: (date: Date, allDay: boolean, data: DataTransfer) => void;
  /** Override the default quick-composer body. */
  renderQuickComposer?: CalendarQuickComposerRenderer;
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
  addTask(date: Date, item?: Partial<TaskItem>): void;
  deleteTask(itemId: string): void;
  editTask(itemId: string): void;
  beginRename(itemId: string): void;
  openQuickComposer(date: Date, allDay?: boolean): void;
};

/* ───────── context (internal; constructed in the Root) ─────────
 *
 * Split at P3 feature-slicing (v0.3.0): the base Root builds ONLY
 * `CalendarBaseContextValue` (read-only surface — cursor/data/config/
 * selection/read-only callbacks). The full edit surface (dispatchers +
 * transient UI + gestures + components) lives in `CalendarEditContextValue`,
 * defined in the injection seam (`hooks/use-calendar-edit-extension.ts`) and
 * supplied by the editing feature's Provider — base never references it by
 * static import, only through `useCalendarEditOptional()`.
 */

export type CalendarBaseContextValue = {
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
  statusOptions?: TaskStatusOption[];
  priorityOptions?: TaskPriorityOption[];
  labelOptions?: TaskLabelOption[];

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
  onTaskClick?: (item: TaskItem) => void;
  onDateClick?: (date: Date) => void;
  onShowMore?: (date: Date, items: TaskItem[]) => void;
  renderTooltip?: CalendarTooltipRenderer;
};

/** @deprecated internal compat alias — pre-split code referenced the combined
 *  (base + edit) shape under this name. Never part of the public API (not
 *  re-exported from `index.ts`); use `CalendarBaseContextValue` for the
 *  read-only context, or the editing feature's `CalendarEditContextValue`
 *  for the edit surface. */
export type CalendarContextValue = CalendarBaseContextValue;
