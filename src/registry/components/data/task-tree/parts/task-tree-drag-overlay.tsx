"use client";

import type { TaskItem } from "../../task-card/types";
import { TaskTreeName } from "./task-tree-name";
import { cn } from "@/lib/utils";

export interface TaskTreeDragOverlayProps {
  item: TaskItem;
  level: number;
  className?: string;
}

/**
 * Cursor-follow visual mounted inside @dnd-kit's `<DragOverlay>`. Kept
 * deliberately spare — name only, with a slight elevation — so it reads as
 * a "ghost" and doesn't fight the real row underneath.
 */
export function TaskTreeDragOverlay({
  item,
  level,
  className,
}: TaskTreeDragOverlayProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm shadow-md",
        "max-w-sm cursor-grabbing",
        className,
      )}
      data-level={level}
    >
      <TaskTreeName name={item.name} />
    </div>
  );
}
