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
export { CalendarEventInspector } from "./parts/calendar-event-inspector";
export { CalendarQuickComposer } from "./parts/calendar-quick-composer";
export { CalendarEventContextMenu } from "./parts/calendar-context-menu";
export {
  CalendarEventEditorOverlay,
  CalendarRenameField,
  EventEditorPanel,
} from "./parts/calendar-edit-overlays";

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

// Cross-surface task clipboard (the unified family envelope, hosted in
// todo-rich-card; re-exported here so calendar's public API is unchanged)
export {
  TASK_CLIPBOARD_KIND,
  TASK_CLIPBOARD_VERSION,
  serializeTasks,
  parseTasks,
  reassignTaskIds,
  writeTasksToClipboardEvent,
  readTasksFromClipboardEvent,
} from "../todo-rich-card/lib/clipboard";

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
  CalendarSnap,
  CalendarEditAction,
  CalendarComposerTarget,
  CalendarQuickComposerRenderer,
  TodoItem,
} from "./types";
export type { TaskClipboardEnvelope } from "../todo-rich-card/lib/clipboard";
export type {
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
