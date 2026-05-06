"use client";

import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type {
  AnyKanbanCardRenderer,
  KanbanColumn,
  KanbanData,
  KanbanItem,
  KanbanPaletteSwatch,
  KanbanSwimlane,
} from "../types";
import { AddColumnButton } from "./add-column-button";
import { Column } from "./column";

export function Board({
  data,
  swimlanes,
  rendererMap,
  renderers,
  palette,
  readOnly,
  activeRendererId,
  onItemCreate,
  onItemUpdate,
  onItemDelete,
  onItemClick,
  onColumnCreate,
  onColumnUpdate,
  onColumnDelete,
  onSetColor,
  onToggleCollapse,
  className,
}: {
  data: KanbanData;
  swimlanes: KanbanSwimlane[] | undefined;
  rendererMap: Map<string, AnyKanbanCardRenderer>;
  renderers: AnyKanbanCardRenderer[];
  palette: KanbanPaletteSwatch[];
  readOnly: boolean;
  activeRendererId: string | undefined;
  onItemCreate?: (columnId: string, item: KanbanItem) => void;
  onItemUpdate?: (item: KanbanItem) => void;
  onItemDelete?: (itemId: string) => void;
  onItemClick?: (item: KanbanItem) => void;
  onColumnCreate?: (column: KanbanColumn) => void;
  onColumnUpdate?: (column: KanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;
  onSetColor: (columnId: string, color: string | undefined) => void;
  onToggleCollapse: (columnId: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full gap-3 overflow-x-auto overflow-y-hidden p-3",
        className,
      )}
    >
      <SortableContext
        items={data.columns.map((c) => c.id)}
        strategy={horizontalListSortingStrategy}
      >
        {data.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            swimlanes={swimlanes}
            rendererMap={rendererMap}
            renderers={renderers}
            palette={palette}
            readOnly={readOnly}
            activeRendererId={activeRendererId}
            onItemCreate={onItemCreate ? (item) => onItemCreate(column.id, item) : undefined}
            onItemUpdate={onItemUpdate}
            onItemDelete={onItemDelete}
            onItemClick={onItemClick}
            onColumnUpdate={onColumnUpdate}
            onColumnDelete={onColumnDelete}
            onSetColor={(color) => onSetColor(column.id, color)}
            onToggleCollapse={() => onToggleCollapse(column.id)}
          />
        ))}
      </SortableContext>
      {!readOnly && onColumnCreate ? <AddColumnButton onCreate={onColumnCreate} /> : null}
    </div>
  );
}
