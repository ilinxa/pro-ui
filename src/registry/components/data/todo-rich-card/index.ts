// Main component
export { TodoRichCard } from "./todo-rich-card";

// Companion: kanban-board-01 card renderer (Q-P6)
export { todoRichCardKanbanRenderer } from "./parts/kanban-adapter";

// Constants
export { RAMPS } from "./lib/ramp";
export { TODO_RAMPS, TODO_CLIPBOARD_MIME } from "./types";

// Data types
export type {
  TodoItem,
  TodoPerson,
  TodoImage,
  TodoLink,
  TodoColorRamp,
  TodoColorRampPreset,
  TodoStatusOption,
  TodoPriorityOption,
  TodoLabelOption,
  TodoEditableField,
} from "./types";

// Permission types
export type {
  TodoPermissions,
  TodoPermissionRule,
  TodoPermissionReason,
} from "./types";

// Event types
export type {
  TodoFieldEditedEvent,
  TodoStatusChangedEvent,
  TodoItemAddedEvent,
  TodoItemRemovedEvent,
  TodoItemMovedEvent,
  TodoColorOverriddenEvent,
  TodoActiveToggledEvent,
  TodoLockedToggledEvent,
  TodoCopyEvent,
  TodoPasteEvent,
  TodoEditRequestEvent,
} from "./types";

// Component surface
export type { TodoRichCardProps, TodoRichCardHandle } from "./types";
