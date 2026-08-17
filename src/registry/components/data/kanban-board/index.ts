export { KanbanBoard, findRenderer, newColumnId, newItemId } from "./kanban-board";
export { kanbanCardRenderer, KanbanCardView } from "./parts/kanban-card";
export { kanbanNoteRenderer, KanbanNoteView } from "./parts/kanban-note";
export { DEFAULT_PALETTE } from "./lib/palette";
export { validateData } from "./lib/data";
export type {
  // Type-erased renderer. Consumers normally build typed
  // `KanbanCardRenderer<TData>` values, but this is the declared element type
  // of `KanbanBoardProps["renderers"]` and of the exported `findRenderer`'s
  // first parameter, so it has to be nameable
  // (validate:barrel-exports, 2026-08-17).
  AnyKanbanCardRenderer,
  KanbanBoardProps,
  KanbanCardData,
  KanbanCardRenderer,
  KanbanColumn,
  KanbanData,
  KanbanItem,
  KanbanNoteData,
  KanbanPaletteSwatch,
  KanbanRenderContext,
  KanbanSwimlane,
} from "./types";
