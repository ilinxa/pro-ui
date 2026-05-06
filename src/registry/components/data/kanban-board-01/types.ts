import type { ReactNode } from "react";

export type KanbanRenderContext = {
  itemId: string;
  columnId: string;
  swimlaneId?: string;
  isDragging: boolean;
  isLocked: boolean;
};

export type KanbanCardRenderer<TData = unknown> = {
  id: string;
  label: string;
  render: (data: TData, ctx: KanbanRenderContext) => ReactNode;
  newItem?: () => TData;
  editForm?: (
    data: TData,
    onSave: (next: TData) => void,
    onCancel: () => void,
  ) => ReactNode;
  /**
   * Where the kanban-level drag listeners attach.
   * - `"shell"` (default): the entire item is the drag activator (cursor-grab on the whole card).
   * - `"header"`: only a thin grip strip rendered above the item activates dragging; the body
   *    stays fully interactive. Use for renderers that own internal pointer interactions
   *    (inline editors, nested DnD), e.g. the rich-card adapter.
   */
  dragHandle?: "shell" | "header";
};

/**
 * Type-erased renderer used inside the board's registry. The board never reads
 * the data shape — it just hands data to the renderer's render fn — so erasing
 * TData here is sound. Consumers always interact with the typed
 * `KanbanCardRenderer<TData>` surface.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyKanbanCardRenderer = KanbanCardRenderer<any>;

export type KanbanItem = {
  id: string;
  rendererId: string;
  data: unknown;
  swimlaneId?: string;
  locked?: boolean;
};

export type KanbanColumn = {
  id: string;
  title: string;
  description?: string;
  color?: string;
  collapsed?: boolean;
  items: KanbanItem[];
  allowReorder?: boolean;
  allowIncoming?: boolean;
  allowOutgoing?: boolean;
  acceptsRendererIds?: string[];
  maxItems?: number;
};

export type KanbanSwimlane = {
  id: string;
  title: string;
  description?: string;
  color?: string;
};

export type KanbanData = {
  columns: KanbanColumn[];
  swimlanes?: KanbanSwimlane[];
};

export type KanbanPaletteSwatch = {
  id: string;
  label: string;
  cssVar: string;
};

export type KanbanBoardProps = {
  renderers: AnyKanbanCardRenderer[];

  data?: KanbanData;
  defaultData?: KanbanData;
  onChange?: (next: KanbanData) => void;

  onItemCreate?: (columnId: string, item: KanbanItem) => void;
  onItemUpdate?: (item: KanbanItem) => void;
  onItemDelete?: (itemId: string) => void;
  onColumnCreate?: (draft: Partial<KanbanColumn>) => void;
  onColumnUpdate?: (column: KanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;

  onItemClick?: (item: KanbanItem) => void;
  onItemMove?: (
    item: KanbanItem,
    from: { columnId: string; swimlaneId?: string },
    to: { columnId: string; swimlaneId?: string },
  ) => void;

  palette?: KanbanPaletteSwatch[];
  readOnly?: boolean;

  "aria-label"?: string;
  className?: string;
};

export type KanbanCardData = {
  title: string;
  description?: string;
  tags?: { label: string; color?: string }[];
  assignees?: { id: string; name: string; avatarUrl?: string }[];
  meta?: { key: string; label: string; value: ReactNode }[];
};

export type KanbanNoteData = {
  title: string;
  body?: string;
  color?: string;
};

export type KanbanAction =
  | { type: "move-item"; itemId: string; toColumnId: string; toIndex: number; toSwimlaneId?: string }
  | { type: "reorder-column"; columnId: string; toIndex: number }
  | { type: "create-item"; columnId: string; item: KanbanItem; index?: number }
  | { type: "update-item"; item: KanbanItem }
  | { type: "delete-item"; itemId: string }
  | { type: "create-column"; column: KanbanColumn; index?: number }
  | { type: "update-column"; column: KanbanColumn }
  | { type: "delete-column"; columnId: string }
  | { type: "toggle-collapse"; columnId: string }
  | { type: "set-color"; columnId: string; color: string | undefined }
  | { type: "replace"; data: KanbanData };
