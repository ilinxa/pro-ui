"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TodoTreeGripProps {
  /** Stable id used as the @dnd-kit draggable id (= item.id). */
  id: string;
  /**
   * Permission gate. When false the grip renders empty (no drag affordance)
   * so the cursor doesn't suggest interaction; @dnd-kit's listeners are
   * never wired.
   */
  enabled?: boolean;
  /** Marker the @dnd-kit handlers can read off `activeId.data.current.level`. */
  level?: number;
  className?: string;
}

/**
 * Hover-revealed drag handle. The grip is invisible at rest and fades in
 * on row hover (the row sets `group` so this can use `group-hover`).
 *
 * Wires `useDraggable` from @dnd-kit/core as the activator — drag begins
 * here, NOT on the row body. That's what enables the activator mutual-
 * exclusion pattern: row-level native dragstart checks
 * `isInternalDragRef.current` and bails when the grip has already taken
 * over.
 */
export const TodoTreeGrip = forwardRef<HTMLButtonElement, TodoTreeGripProps>(
  function TodoTreeGrip({ id, enabled = true, level, className }, ref) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id,
      data: { level },
      disabled: !enabled,
    });

    if (!enabled) return null;

    return (
      <button
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="button"
        aria-label="Drag to move"
        // Stop click bubble — the grip click should not also select the row.
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
        className={cn(
          "inline-flex size-4 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          isDragging && "cursor-grabbing opacity-100",
          className,
        )}
      >
        <GripVertical className="size-3" />
      </button>
    );
  },
);
