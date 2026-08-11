// The editing feature slice for event-calendar (P3 feature-slicing —
// `@ilinxa/event-calendar-editing`). Import `calendarEditing` and pass it to
// `<EventCalendar editable editing={calendarEditing} />` (or
// `<EventCalendarRoot editable editing={calendarEditing}>`) to enable
// drag/resize/create/clipboard/keyboard editing. See the base package's
// `editing?: CalendarEditExtension` prop (`@ilinxa/event-calendar`).

import { CalendarEditProvider } from "./provider";
import type { CalendarEditExtension } from "../../hooks/use-calendar-edit-extension";

export const calendarEditing: CalendarEditExtension = {
  Provider: CalendarEditProvider,
};

// Edit-surface components (Tier B/C) — for advanced à-la-carte composition;
// the assembly + default parts wire these in automatically via `edit.components`.
export { CalendarQuickComposer } from "./parts/calendar-quick-composer";
export { CalendarEventContextMenu } from "./parts/calendar-context-menu";
export {
  CalendarEventEditorOverlay,
  CalendarRenameField,
  EventEditorPanel,
} from "./parts/calendar-edit-overlays";

// Cross-surface task clipboard (the unified family envelope, hosted in
// task-card) — moved off the base barrel with the rest of the editing
// surface (v0.3); a read-only base install has no copy/paste UI to serve.
export {
  TASK_CLIPBOARD_KIND,
  TASK_CLIPBOARD_VERSION,
  serializeTasks,
  parseTasks,
  reassignTaskIds,
  writeTasksToClipboardEvent,
  readTasksFromClipboardEvent,
} from "../../../task-card/lib/clipboard";
export type { TaskClipboardEnvelope } from "../../../task-card/lib/clipboard";

// Edit-only public types (still DEFINED in the base package's `types.ts` —
// `CalendarProps`'s edit-prop fields reference them — but re-exported from
// here instead of the base barrel, since a read-only base consumer never
// needs to name them).
export type {
  CalendarSnap,
  CalendarEditAction,
  CalendarComposerTarget,
  CalendarQuickComposerRenderer,
} from "../../types";
export type {
  TaskItemAddedEvent,
  TaskItemRemovedEvent,
  TaskItemMovedEvent,
  TaskFieldEditedEvent,
  TaskStatusChangedEvent,
} from "../../types";

// The injection seam's types, re-exported for convenience (also available
// from the base barrel).
export type {
  CalendarEditExtension,
  CalendarEditProps,
  CalendarEditContextValue,
} from "../../hooks/use-calendar-edit-extension";
