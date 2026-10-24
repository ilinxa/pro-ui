"use client";

import { memo } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EngagementBarVariant, ResolvedEngagementBarLabels } from "../types";
import { DISABLED_ACTION_CLASS } from "../lib/action-name";

interface BookmarkActionProps {
  variant: EngagementBarVariant;
  bookmarked: boolean;
  disabled?: boolean;
  /** The bar's toggle path (gating, handler, optimistic overlay). */
  onToggle: () => void;
  labels: ResolvedEngagementBarLabels;
  actionClassName?: string;
}

function BookmarkActionInner({
  variant,
  bookmarked,
  disabled = false,
  onToggle,
  labels,
  actionClassName,
}: BookmarkActionProps) {
  const handleClick = () => {
    if (disabled) return;
    onToggle();
  };

  const ariaLabel = bookmarked ? labels.unbookmark : labels.bookmark;
  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";
  const stacked = variant === "stacked";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-pressed={bookmarked}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      className={cn(
        stacked
          ? "flex h-auto flex-col items-center gap-0.5 px-2 py-1"
          : "px-2 motion-safe:transition-colors",
        DISABLED_ACTION_CLASS,
        actionClassName,
      )}
    >
      <Bookmark
        aria-hidden="true"
        className={cn(
          stacked ? "h-6 w-6" : iconSizeClass,
          "motion-safe:transition-all",
          bookmarked && "fill-current",
        )}
      />
    </Button>
  );
}

export const BookmarkAction = memo(BookmarkActionInner);
BookmarkAction.displayName = "BookmarkAction";
