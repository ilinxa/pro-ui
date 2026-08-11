// Main component
export { TaskCard } from "./task-card";

// Companion: kanban-board card renderer (Q-P6)
export { taskCardKanbanRenderer } from "./parts/kanban-adapter";

// Constants
export { RAMPS } from "./lib/ramp";
export { TASK_RAMPS, TASK_CLIPBOARD_MIME } from "./types";

// Unified cross-surface task clipboard (the canonical family envelope —
// gantt / calendar / tree import from "./lib/clipboard" directly)
export {
  TASK_CLIPBOARD_KIND,
  TASK_CLIPBOARD_VERSION,
  serializeTasks,
  parseTasks,
  reassignTaskIds,
  writeTasksToClipboardEvent,
  readTasksFromClipboardEvent,
  copyTasksToClipboard,
  readTasksFromClipboard,
} from "./lib/clipboard";
export type { TaskClipboardEnvelope } from "./lib/clipboard";

// Data types
export type {
  TaskItem,
  TaskPerson,
  TaskImage,
  TaskLink,
  TaskColorRamp,
  TaskColorRampPreset,
  TaskStatusOption,
  TaskPriorityOption,
  TaskLabelOption,
  TaskEditableField,
} from "./types";

// Permission types
export type {
  TaskPermissions,
  TaskPermissionRule,
  TaskPermissionReason,
} from "./types";

// Event types
export type {
  TaskFieldEditedEvent,
  TaskStatusChangedEvent,
  TaskItemAddedEvent,
  TaskItemRemovedEvent,
  TaskItemMovedEvent,
  TaskColorOverriddenEvent,
  TaskActiveToggledEvent,
  TaskLockedToggledEvent,
  TaskCopyEvent,
  TaskPasteEvent,
  TaskEditRequestEvent,
} from "./types";

// Component surface
export type { TaskCardProps, TaskCardHandle } from "./types";
