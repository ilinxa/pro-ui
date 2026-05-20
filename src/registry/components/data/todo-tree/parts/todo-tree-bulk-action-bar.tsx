"use client";

import { Trash2, Pencil, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface TodoTreeBulkActionBarProps {
  count: number;
  /** When omitted the matching button is hidden. */
  onToggleActive?: (nextActive: boolean) => void;
  onRemove?: () => void;
  onEdit?: () => void;
  onClear?: () => void;
  className?: string;
}

/**
 * Bulk action surface — appears in the toolbar when any rows are selected.
 * Each action button is gated on the matching callback being provided;
 * `onEdit` in particular is consumer-only (bulk-edit popup isn't baked into
 * v0.1 per Q4 lock — consumers wire their own dialog).
 */
export function TodoTreeBulkActionBar({
  count,
  onToggleActive,
  onRemove,
  onEdit,
  onClear,
  className,
}: TodoTreeBulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div
      role="toolbar"
      aria-label={`${count} item${count === 1 ? "" : "s"} selected`}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-1.5",
        className,
      )}
    >
      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
        {count}
      </Badge>
      <Separator orientation="vertical" className="h-4" />
      {onToggleActive && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(true)}
            className="h-6 gap-1 px-2 text-xs"
          >
            <CheckCheck className="size-3" /> Activate
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(false)}
            className="h-6 px-2 text-xs"
          >
            Deactivate
          </Button>
        </>
      )}
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-6 gap-1 px-2 text-xs"
        >
          <Pencil className="size-3" /> Edit
        </Button>
      )}
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 gap-1 px-2 text-xs text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3" /> Delete
        </Button>
      )}
      {onClear && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear selection"
          onClick={onClear}
          className="size-6"
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}
