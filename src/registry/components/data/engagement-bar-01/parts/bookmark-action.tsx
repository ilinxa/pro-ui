"use client";

import { memo } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  EngagementBar01Variant,
  EngagementBarLabels,
  EngagementLocalAction,
} from "../types";

interface BookmarkActionProps {
  variant: EngagementBar01Variant;
  bookmarked: boolean;
  controlled: boolean;
  onToggle?: (next: boolean) => void;
  labels: Required<Omit<EngagementBarLabels, "formatCount">>;
  dispatch: React.Dispatch<EngagementLocalAction>;
  actionClassName?: string;
}

function BookmarkActionInner({
  variant,
  bookmarked,
  controlled,
  onToggle,
  labels,
  dispatch,
  actionClassName,
}: BookmarkActionProps) {
  const handleClick = () => {
    const next = !bookmarked;
    if (!controlled) {
      dispatch({ kind: "bookmark-toggle" });
    }
    onToggle?.(next);
  };

  const ariaLabel = bookmarked ? labels.unbookmark : labels.bookmark;
  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";

  if (variant === "stacked") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={bookmarked}
        aria-label={ariaLabel}
        onClick={handleClick}
        className={cn(
          "flex h-auto flex-col items-center gap-0.5 px-2 py-1",
          actionClassName,
        )}
      >
        <Bookmark
          className={cn("h-6 w-6 transition-all", bookmarked && "fill-current")}
        />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-pressed={bookmarked}
      aria-label={ariaLabel}
      onClick={handleClick}
      className={cn("px-2 transition-colors", actionClassName)}
    >
      <Bookmark
        className={cn(
          iconSizeClass,
          "transition-all",
          bookmarked && "fill-current",
        )}
      />
    </Button>
  );
}

export const BookmarkAction = memo(BookmarkActionInner);
BookmarkAction.displayName = "BookmarkAction";
