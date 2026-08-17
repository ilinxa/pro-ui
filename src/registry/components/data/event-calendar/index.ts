// Assembly (Tier A)
export { EventCalendar } from "./event-calendar";

// Headless provider + context parts (Tier B) — flat exports, never a namespace
export { EventCalendarRoot } from "./parts/calendar-root";
export { CalendarToolbar } from "./parts/calendar-toolbar";
export { CalendarMonthView } from "./parts/calendar-month-view";
export { CalendarWeekView } from "./parts/calendar-week-view";
export { CalendarDayView } from "./parts/calendar-day-view";
export { CalendarAgendaView } from "./parts/calendar-agenda-view";
export { CalendarMiniNav } from "./parts/calendar-mini-nav";
export { CalendarEventInspector } from "./parts/calendar-event-inspector";

// Standalone primitives (Tier C)
export {
  CalendarEventChip,
  CalendarEventBar,
  CalendarTimeBlock,
  NowIndicator,
  EventTooltip,
} from "./parts/calendar-event";
export { MonthDayCell } from "./parts/calendar-month-view";
export { TimeGrid, TimeGutter } from "./parts/calendar-time-grid";
export { AgendaRow } from "./parts/calendar-agenda-view";
export { CalendarSkeleton } from "./parts/calendar-skeleton";
export { CalendarFullCardTooltip } from "./parts/event-tooltip-full";

// Hook
export { useCalendar } from "./hooks/use-calendar-context";

// Editing injection seam (P3 feature-slicing) — base owns the extension
// point; the editing feature (`@ilinxa/event-calendar-editing`) supplies the
// `CalendarEditExtension` value passed as `CalendarProps.editing`. The edit
// components / dispatchers / gestures themselves live in the feature's own
// barrel (`features/editing`), NOT here — this package never statically
// imports feature code.
export { useCalendarEditOptional } from "./hooks/use-calendar-edit-extension";

// Public types (+ the consumed task-card data language, re-exported)
export type {
  // `useCalendar()` is exported above and returns this — without it a
  // consumer can call the hook but cannot name what it hands back
  // (validate:barrel-exports, 2026-08-17).
  CalendarBaseContextValue,
  CalendarProps,
  CalendarRootProps,
  CalendarHandle,
  CalendarView,
  WeekStart,
  EventKind,
  CalendarOccurrence,
  CalendarEventColor,
  CalendarStatusTone,
  CalendarTooltipRenderer,
  TaskItem,
} from "./types";
export type {
  TaskPerson,
  TaskStatusOption,
  TaskPriorityOption,
  TaskLabelOption,
  TaskColorRamp,
  TaskPermissions,
  TaskPermissionRule,
  TaskPermissionReason,
} from "./types";
export type {
  CalendarEditExtension,
  CalendarEditProps,
  CalendarEditContextValue,
} from "./hooks/use-calendar-edit-extension";

// Type-only re-exports for the base prop surface (R4 finding, 2026-08-11):
// `CalendarProps` references these in its own signatures (onItemAdded…,
// snap, quickCompose, renderQuickComposer), so a BASE-only consumer must be
// able to name them from this barrel. Type-only — erased at compile, adds no
// runtime dependency on the editing feature or task-card values.
export type {
  CalendarSnap,
  CalendarEditAction,
  CalendarComposerTarget,
  CalendarQuickComposerRenderer,
  TaskItemAddedEvent,
  TaskItemRemovedEvent,
  TaskItemMovedEvent,
  TaskFieldEditedEvent,
  TaskStatusChangedEvent,
} from "./types";
