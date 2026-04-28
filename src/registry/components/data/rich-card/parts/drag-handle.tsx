import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Visible drag affordance — small grip icon. Lives in card header (edit mode).
 * Connects to @dnd-kit via the `dragListeners` and `dragAttributes` from useSortable
 * applied at the parent (Card).
 */
export function DragHandle({
  listeners,
  attributes,
  disabled,
  className,
}: {
  listeners?: Record<string, (event: unknown) => void>;
  attributes?: Record<string, unknown>;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      disabled={disabled}
      aria-label="Drag to reorder"
      className={cn(
        "inline-flex size-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "cursor-not-allowed opacity-30",
        className,
      )}
    >
      <GripVertical className="size-3.5" aria-hidden="true" />
    </button>
  );
}
