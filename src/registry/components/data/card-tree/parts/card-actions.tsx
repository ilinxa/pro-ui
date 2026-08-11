"use client";

import { Copy, MoreHorizontal, Plus, Trash2, TreePine } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Compact card-level actions menu for edit mode (... button in header).
 * v0.3 actions: remove (cascade or promote), duplicate. Root-only when allowed.
 */
export function CardActionsMenu({
  onRemoveCascade,
  onRemovePromote,
  onDuplicate,
  canRemove,
  canDuplicate,
  isRoot,
  allowRootRemoval,
  hasChildren,
  className,
}: {
  onRemoveCascade: () => void;
  onRemovePromote?: () => void;
  onDuplicate?: () => void;
  canRemove: boolean;
  canDuplicate: boolean;
  isRoot: boolean;
  allowRootRemoval: boolean;
  hasChildren: boolean;
  className?: string;
}) {
  const removeAllowed = canRemove && (!isRoot || allowRootRemoval);
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
      <PopoverContent align="end" sideOffset={4} className="w-52 p-1">
        {onDuplicate ? (
          <button
            type="button"
            onClick={onDuplicate}
            disabled={!canDuplicate || isRoot}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:bg-muted"
          >
            <Copy className="size-3.5" aria-hidden="true" />
            Duplicate
          </button>
        ) : null}
        {hasChildren && onRemovePromote ? (
          <button
            type="button"
            onClick={onRemovePromote}
            disabled={!removeAllowed}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:bg-muted"
          >
            <TreePine className="size-3.5" aria-hidden="true" />
            Remove (promote children)
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRemoveCascade}
          disabled={!removeAllowed}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40 focus-visible:outline-none focus-visible:bg-destructive/10"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Remove{hasChildren ? " (cascade)" : ""}
        </button>
        {!removeAllowed ? (
          <p className="px-2 py-1 text-[11px] text-muted-foreground">
            {isRoot && !allowRootRemoval
              ? "Root removal disabled (allowRootRemoval=false)."
              : "Removal denied by permissions."}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function AddChildButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-dashed border-border/70 bg-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <Plus className="size-3" aria-hidden="true" />
      child
    </button>
  );
}
