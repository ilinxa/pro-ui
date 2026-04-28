import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Compact card-level actions menu for edit mode (... button in header).
 * v0.2 actions: remove card. v0.3 will add: duplicate, move-up/down,
 * cascade-vs-promote picker.
 */
export function CardActionsMenu({
  onRemove,
  canRemove,
  className,
}: {
  onRemove: () => void;
  canRemove: boolean;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        aria-label="Card actions"
      >
        <MoreHorizontal className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={4}
        className="w-44 p-1"
      >
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40 focus-visible:outline-none focus-visible:bg-destructive/10"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Remove card
        </button>
        {!canRemove ? (
          <p className="px-2 py-1 text-[11px] text-muted-foreground">
            Root card cannot be removed in v0.2.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

/**
 * "+ child" button revealed in edit mode for a card's children area.
 */
export function AddChildButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/70 bg-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Plus className="size-3" aria-hidden="true" />
      child
    </button>
  );
}
