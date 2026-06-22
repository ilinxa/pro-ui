// Assembly (Tier A)
export { Calendar01 } from "./calendar-01";

// Headless provider + context parts (Tier B) — flat exports, never a namespace
export { Calendar01Root } from "./parts/calendar-root";
export { CalendarToolbar } from "./parts/calendar-toolbar";
export { CalendarMonthView } from "./parts/calendar-month-view";
export { CalendarWeekView } from "./parts/calendar-week-view";
export { CalendarDayView } from "./parts/calendar-day-view";
export { CalendarAgendaView } from "./parts/calendar-agenda-view";
export { CalendarMiniNav } from "./parts/calendar-mini-nav";

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

// Public types (+ the consumed todo-rich-card data language, re-exported)
export type {
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
} from "./types";
