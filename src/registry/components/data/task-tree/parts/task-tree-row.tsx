"use client";

import { useDroppable } from "@dnd-kit/core";
import type { MouseEvent } from "react";
import type { TaskItem } from "../../task-card/types";
import { TaskTreeRowContent } from "./task-tree-row-content";
import { TaskTreeGrip } from "./task-tree-grip";
import { TaskTreeDropIndicator } from "./task-tree-drop-indicator";
import { useTaskTreeStateContext } from "../hooks/use-task-tree-context";
import { useTaskTreeRenderContext } from "../hooks/use-task-tree-context";
import { useTaskTreeDndContext } from "../hooks/use-task-tree-context";
import { cn } from "@/lib/utils";

export interface TaskTreeRowProps {
  item: TaskItem;
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
export function TaskTreeRow({
  item,
  level,
  isSelected,
  isCollapsed,
  dimmed,
  canDrag = true,
  canToggleActive = true,
}: TaskTreeRowProps) {
  const state = useTaskTreeStateContext();
  const { indentSize, statusIndicator, renderRow } = useTaskTreeRenderContext();
  const dnd = useTaskTreeDndContext();

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

  const hasChildren = !!item.children && item.children.length > 0;
  const defaultRender = (
    <TaskTreeRowContent
      item={item}
      level={level}
      isSelected={isSelected}
      isCollapsed={isCollapsed}
      dimmed={dimmed}
      canToggleActive={canToggleActive}
      onToggleCollapse={() => state.toggleCollapse(item.id)}
      onToggleActive={(next) => state.toggleActive(item.id, next)}
    />
  );

  const body = renderRow
    ? renderRow({
        item,
        level,
        isSelected,
        isCollapsed,
        isExpanded: hasChildren && !isCollapsed,
        defaultRender,
      })
    : defaultRender;

  return (
    <div
      ref={setNodeRef}
      data-task-tree-row={item.id}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        // Defensive: synthetic events from nested buttons should already
        // stopPropagation, but a slot row replacement might not.
        if (
          (e.target as HTMLElement | null)?.closest("button, input, [role='button']")
        ) {
          return;
        }
        // Move keyboard focus to the clicked row so arrow keys continue
        // from here. The treeitem div's onFocus also calls focusItem, but
        // a programmatic click from a slot may skip onFocus.
        state.focusItem(item.id);
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
      {/* Grip column — leading flex item so it sits inside the row's
          bounding box (a previous absolute `-left-4` placement landed
          outside the row and was clipped by ancestor overflow:hidden /
          overflow:auto, making DnD unreachable). Always rendered
          (no `sm:` gate) because @dnd-kit's TouchSensor listeners live on
          the grip's button — hiding it on mobile would make long-press
          drag unreachable. Desktop UX still hides at rest via the
          `group-hover` class inside <TaskTreeGrip>. */}
      <span className="flex w-4 shrink-0 items-center justify-center">
        <TaskTreeGrip id={item.id} enabled={canDrag} level={level} />
      </span>

      <div className="min-w-0 flex-1">{body}</div>

      {showIndicator && dnd?.overZone && (
        <TaskTreeDropIndicator
          zone={dnd.overZone}
          indentPx={indicatorIndentPx}
        />
      )}
    </div>
  );
}
