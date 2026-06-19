"use client";

import { type CSSProperties, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { findSwatch, swatchCssColor } from "../lib/palette";
import type {
  AnyKanbanCardRenderer,
  KanbanColumn,
  KanbanItem,
  KanbanPaletteSwatch,
  KanbanSwimlane,
} from "../types";
import { ColumnBody } from "./column-body";
import { ColumnCollapsed } from "./column-collapsed";
import { ColumnFooter } from "./column-footer";
import { ColumnHeader } from "./column-header";
import { InlineEditEditor } from "./inline-edit-editor";

export function Column({
  column,
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
  onItemDataChange,
  onColumnUpdate,
  onColumnDelete,
  onSetColor,
  onToggleCollapse,
}: {
  column: KanbanColumn;
  swimlanes: KanbanSwimlane[] | undefined;
  rendererMap: Map<string, AnyKanbanCardRenderer>;
  renderers: AnyKanbanCardRenderer[];
  palette: KanbanPaletteSwatch[];
  readOnly: boolean;
  activeRendererId: string | undefined;
  onItemCreate?: (item: KanbanItem) => void;
  onItemUpdate?: (item: KanbanItem) => void;
  onItemDelete?: (itemId: string) => void;
  onItemClick?: (item: KanbanItem) => void;
  onItemDataChange?: (item: KanbanItem) => void;
  onColumnUpdate?: (column: KanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;
  onSetColor: (color: string | undefined) => void;
  onToggleCollapse: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { kind: "column", columnId: column.id },
    disabled: readOnly,
  });

  const [editingItem, setEditingItem] = useState<KanbanItem | null>(null);

  const swatch = findSwatch(palette, column.color);
  const accentColor = swatchCssColor(swatch);

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(accentColor ? { borderLeftColor: accentColor } : {}),
  };

  if (column.collapsed) {
    return (
      <div ref={setNodeRef} style={style}>
        <ColumnCollapsed column={column} palette={palette} onExpand={onToggleCollapse} />
      </div>
    );
  }

  const handleEdit = onItemUpdate
    ? (item: KanbanItem) => {
        const renderer = rendererMap.get(item.rendererId);
        if (!renderer?.editForm) {
          // Renderer doesn't support inline edit; just fire the callback with the existing item.
          onItemUpdate?.(item);
          return;
        }
        setEditingItem(item);
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging || undefined}
      className={cn(
        "flex h-full min-h-0 max-h-full w-80 shrink-0 flex-col rounded-md border-l-4 border-y border-r border-border bg-card/40",
        isDragging && "opacity-60",
      )}
    >
      <ColumnHeader
        column={column}
        palette={palette}
        readOnly={readOnly}
        itemCount={column.items.length}
        dragHandleProps={{ ...attributes, ...listeners }}
        onColorChange={onSetColor}
        onCollapse={onToggleCollapse}
        onEdit={onColumnUpdate}
        onDelete={onColumnDelete}
      />

      {editingItem ? (
        <div className="px-1.5 pb-1">
          <InlineEditEditor
            item={editingItem}
            renderer={rendererMap.get(editingItem.rendererId)!}
            onSave={(next) => {
              onItemUpdate?.(next);
              setEditingItem(null);
            }}
            onCancel={() => setEditingItem(null)}
          />
        </div>
      ) : null}

      <ColumnBody
        column={column}
        swimlanes={swimlanes}
        rendererMap={rendererMap}
        readOnly={readOnly}
        activeRendererId={activeRendererId}
        onItemClick={onItemClick}
        onItemDelete={readOnly ? undefined : onItemDelete}
        onItemEdit={readOnly ? undefined : handleEdit}
        onItemDataChange={readOnly ? undefined : onItemDataChange}
      />

      {!readOnly && onItemCreate ? (
        <ColumnFooter column={column} renderers={renderers} onCreate={onItemCreate} />
      ) : null}
    </div>
  );
}
