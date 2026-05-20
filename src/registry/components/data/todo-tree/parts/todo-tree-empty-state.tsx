"use client";

import { Inbox, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TodoTreeEmptyStateProps {
  /** True when the empty list is the result of a filter/search; false when the tree is genuinely empty. */
  hasFilter: boolean;
  className?: string;
}

/**
 * Default placeholder rendered when `visibleItems.length === 0`. Two
 * variants — "no matches" (filter active) vs "no tasks" (genuinely empty
 * tree). Replace via the `renderEmptyState` slot prop.
 */
export function TodoTreeEmptyState({
  hasFilter,
  className,
}: TodoTreeEmptyStateProps) {
  const Icon = hasFilter ? SearchX : Inbox;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex h-full flex-col items-center justify-center gap-2 px-6 py-12 text-center",
        className,
      )}
    >
      <Icon className="size-8 text-muted-foreground/60" aria-hidden />
      <div className="text-sm font-medium text-foreground">
        {hasFilter ? "No matches" : "No tasks yet"}
      </div>
      <div className="text-xs text-muted-foreground">
        {hasFilter
          ? "Adjust your search or filter to see more rows."
          : "Items added via the tree's imperative API or DnD will appear here."}
      </div>
    </div>
  );
}
