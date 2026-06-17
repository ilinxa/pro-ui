"use client";

import { type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AnyKanbanCardRenderer,
  KanbanItem,
  KanbanRenderContext,
} from "../types";
import { ItemRenderer } from "./item-renderer";

export function ItemShell({
  item,
  columnId,
  swimlaneId,
  rendererMap,
  rendererLabel,
  readOnly,
  onClick,
  onDelete,
  onEdit,
  onItemDataChange,
}: {
  item: KanbanItem;
  columnId: string;
  swimlaneId?: string;
  rendererMap: Map<string, AnyKanbanCardRenderer>;
  rendererLabel: string;
  readOnly: boolean;
  onClick?: (item: KanbanItem) => void;
  onDelete?: (itemId: string) => void;
  onEdit?: (item: KanbanItem) => void;
  /** Persist an in-place data edit from a self-editing renderer back to the board. */
  onItemDataChange?: (item: KanbanItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { kind: "item", columnId, swimlaneId, rendererId: item.rendererId },
    disabled: readOnly || item.locked === true,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderer = rendererMap.get(item.rendererId);
  const handleMode = renderer?.dragHandle ?? "shell";
  const dragDisabled = readOnly || item.locked === true;

  const ctx: KanbanRenderContext = {
    itemId: item.id,
    columnId,
    swimlaneId,
    isDragging,
    isLocked: item.locked === true,
    onDataChange:
      onItemDataChange && !readOnly && item.locked !== true
        ? (nextData: unknown) => onItemDataChange({ ...item, data: nextData })
        : undefined,
  };

  function handleClick(e: MouseEvent) {
    if (isDragging) return;
    // Avoid handling clicks bubbling from interactive children (buttons, links, anything tagged data-stop-click).
    const target = e.target as HTMLElement;
    if (target.closest("button, a, [data-stop-click]")) return;
    onClick?.(item);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      onClick?.(item);
    }
  }

  // Stop pointer events on overlay buttons from triggering drag activation.
  function stopPointer(e: PointerEvent) {
    e.stopPropagation();
  }

  const ariaLabel = item.locked ? `${rendererLabel}, locked` : `${rendererLabel}, draggable`;

  // In "shell" mode the whole card is the drag activator (existing behavior).
  // In "header" mode only the top grip strip activates drag; body is fully interactive.
  const shellListeners = handleMode === "shell" && !dragDisabled ? listeners : undefined;
  const headerListeners = handleMode === "header" && !dragDisabled ? listeners : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging || undefined}
      // dnd-kit's `attributes` provide keyboard-DnD a11y wiring (role, tabIndex,
      // aria-pressed, aria-describedby, aria-disabled). We override
      // aria-roledescription per renderer label and role to "article" so we
      // don't nest <button> inside button (Edit/Delete are inner buttons).
      {...attributes}
      {...shellListeners}
      role="article"
      aria-roledescription={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative outline-none",
        "rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        handleMode === "shell" && !dragDisabled && "cursor-grab active:cursor-grabbing",
        dragDisabled && "cursor-default",
        isDragging && "opacity-40",
      )}
    >
      {/* Header drag handle — appears above the item body in "header" mode.
          Click/tap on the grip activates dnd-kit drag; rest of the body is unaffected. */}
      {handleMode === "header" && !dragDisabled ? (
        <div
          {...headerListeners}
          className="flex h-7 cursor-grab items-center justify-center gap-1 rounded-t-md border border-b-0 border-border bg-muted/70 text-[10px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted active:cursor-grabbing"
          aria-label="Drag to move"
          title="Drag to move"
        >
          <GripVertical className="size-3.5" />
          <span>drag</span>
        </div>
      ) : null}

      {/* Action overlay — only visible on hover/focus. Pointer events stop propagation
          so clicks on the buttons don't trigger drag activation or the parent click. */}
      <div className="pointer-events-none absolute right-1 top-1 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {item.locked ? (
          <span
            className="pointer-events-auto inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground"
            aria-hidden="true"
            title="Locked"
          >
            <Lock className="size-3" />
          </span>
        ) : null}
        {!readOnly && !item.locked && onEdit ? (
          <Button
            data-stop-click
            type="button"
            variant="ghost"
            size="icon"
            className="pointer-events-auto size-5"
            onPointerDown={stopPointer}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            aria-label="Edit item"
          >
            <span className="text-[10px]">Edit</span>
          </Button>
        ) : null}
        {!readOnly && !item.locked && onDelete ? (
          <Button
            data-stop-click
            type="button"
            variant="ghost"
            size="icon"
            className="pointer-events-auto size-5"
            onPointerDown={stopPointer}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            aria-label="Delete item"
          >
            <X className="size-3" />
          </Button>
        ) : null}
      </div>

      <ItemRenderer item={item} rendererMap={rendererMap} ctx={ctx} />

      {handleMode === "shell" && !readOnly && !item.locked ? (
        <span
          className="pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        >
          <GripVertical className="size-3" />
        </span>
      ) : null}
    </div>
  );
}
