"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type {
  AnyKanbanCardRenderer,
  KanbanColumn,
  KanbanItem,
} from "../types";
import { ItemShell } from "./item-shell";

export function makeCellId(columnId: string, swimlaneId: string | undefined): string {
  return `${columnId}::${swimlaneId ?? "_"}`;
}

export function SwimlaneCell({
  column,
  swimlaneId,
  items,
  rendererMap,
  readOnly,
  rejectDrop,
  onItemClick,
  onItemDelete,
  onItemEdit,
  onItemDataChange,
}: {
  column: KanbanColumn;
  swimlaneId: string | undefined;
  items: KanbanItem[];
  rendererMap: Map<string, AnyKanbanCardRenderer>;
  readOnly: boolean;
  rejectDrop: boolean;
  onItemClick?: (item: KanbanItem) => void;
  onItemDelete?: (itemId: string) => void;
  onItemEdit?: (item: KanbanItem) => void;
  onItemDataChange?: (item: KanbanItem) => void;
}) {
  const cellId = makeCellId(column.id, swimlaneId);
  const { setNodeRef, isOver } = useDroppable({
    id: cellId,
    data: { kind: "cell", columnId: column.id, swimlaneId },
  });

  return (
    <SortableContext id={cellId} items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        data-cell-id={cellId}
        className={cn(
          "flex min-h-12 flex-col gap-2 rounded-sm p-1.5 transition-colors",
          isOver && !rejectDrop && "bg-accent/40 ring-1 ring-ring/30",
          isOver && rejectDrop && "bg-destructive/10 ring-1 ring-destructive/40",
        )}
      >
        {items.map((item) => {
          const renderer = rendererMap.get(item.rendererId);
          const label = renderer?.label ?? "Item";
          return (
            <ItemShell
              key={item.id}
              item={item}
              columnId={column.id}
              swimlaneId={swimlaneId}
              rendererMap={rendererMap}
              rendererLabel={label}
              readOnly={readOnly}
              onClick={onItemClick}
              onDelete={onItemDelete}
              onEdit={onItemEdit}
              onItemDataChange={onItemDataChange}
            />
          );
        })}
        {items.length === 0 ? (
          <div className="pointer-events-none flex h-12 items-center justify-center rounded border border-dashed border-border/60 text-[10px] uppercase tracking-wide text-muted-foreground/60">
            Empty
          </div>
        ) : null}
      </div>
    </SortableContext>
  );
}
