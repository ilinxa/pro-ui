"use client";

import { useDroppable } from "@dnd-kit/core";
import type { MouseEvent } from "react";
import type { TodoItem } from "../../todo-rich-card/types";
import { TodoTreeRowContent } from "./todo-tree-row-content";
import { TodoTreeGrip } from "./todo-tree-grip";
import { TodoTreeDropIndicator } from "./todo-tree-drop-indicator";
import { useTodoTreeStateContext } from "../hooks/use-todo-tree-context";
import { useTodoTreeRenderContext } from "../hooks/use-todo-tree-context";
import { useTodoTreeDndContext } from "../hooks/use-todo-tree-context";
import { cn } from "@/lib/utils";

export interface TodoTreeRowProps {
  item: TodoItem;
  level: number;
  isSelected: boolean;
  isCollapsed: boolean;
  dimmed?: boolean;
  /** Permission for the drag-handle render gate. Default true. */
  canDrag?: boolean;
  /** Permission for the active-checkbox. Default true. */
  canToggleActive?: boolean;
}

/**
 * Full row: composes grip + row-content + drop-indicator + click/DnD
 * wiring. The row body is a single `<div>` that serves as
 *   - @dnd-kit droppable (id = item.id) — internal drag drop target.
 *   - HTML5 drop target (via getRowHandlers from DnD context).
 *   - HTML5 drag source (the row body itself; grip uses @dnd-kit).
 *   - click target — row-select via fire("itemClick").
 *
 * Drop indicator paints when the row is the active over-target AND the
 * computed zone isn't circular.
 */
export function TodoTreeRow({
  item,
  level,
  isSelected,
  isCollapsed,
  dimmed,
  canDrag = true,
  canToggleActive = true,
}: TodoTreeRowProps) {
  const state = useTodoTreeStateContext();
  const { indentSize, statusIndicator } = useTodoTreeRenderContext();
  const dnd = useTodoTreeDndContext();

  const { setNodeRef, isOver } = useDroppable({ id: item.id });

  const isActiveSource = dnd?.activeItemId === item.id;
  const showIndicator =
    !!dnd &&
    isOver &&
    dnd.overId === item.id &&
    dnd.overZone !== null &&
    !dnd.overCircular;

  const rowHandlers = dnd?.getRowHandlers(item);

  const indicatorIndentPx =
    (statusIndicator === "strip" ? 12 : 8) + level * indentSize;

  return (
    <div
      ref={setNodeRef}
      data-todo-tree-row={item.id}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        // Defensive: synthetic events from nested buttons should already
        // stopPropagation, but a slot row replacement might not.
        if (
          (e.target as HTMLElement | null)?.closest("button, input, [role='button']")
        ) {
          return;
        }
        dnd?.handleRowClick(item, level, e);
      }}
      draggable={rowHandlers?.draggable && canDrag}
      onDragStart={rowHandlers?.onDragStart}
      onDragOver={rowHandlers?.onDragOver}
      onDrop={rowHandlers?.onDrop}
      className={cn(
        // `group` enables the grip's hover-reveal.
        "group relative flex w-full items-stretch",
        isSelected && "bg-accent/30",
        isActiveSource && "opacity-50",
        // Hover lift — applies when not dimmed by filter-fade.
        !dimmed && "hover:bg-accent/20",
      )}
    >
      {/* Grip column — absolute on the row's left edge. Always rendered
          (no `sm:` gate) because @dnd-kit's TouchSensor listeners live on
          the grip's button — hiding it on mobile would make long-press
          drag unreachable. Desktop UX still hides at rest via the
          `group-hover` class inside <TodoTreeGrip>. */}
      <span className="absolute inset-y-0 -left-4 z-10 flex items-center">
        <TodoTreeGrip id={item.id} enabled={canDrag} level={level} />
      </span>

      <div className="flex-1">
        <TodoTreeRowContent
          item={item}
          level={level}
          isSelected={isSelected}
          isCollapsed={isCollapsed}
          dimmed={dimmed}
          canToggleActive={canToggleActive}
          onToggleCollapse={() => state.toggleCollapse(item.id)}
          onToggleActive={(next) => state.toggleActive(item.id, next)}
        />
      </div>

      {showIndicator && dnd?.overZone && (
        <TodoTreeDropIndicator
          zone={dnd.overZone}
          indentPx={indicatorIndentPx}
        />
      )}
    </div>
  );
}
