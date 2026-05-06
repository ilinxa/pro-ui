"use client";

import { memo } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  EngagementBar01Variant,
  EngagementBarLabels,
  EngagementLocalAction,
} from "../types";

interface LikeActionProps {
  variant: EngagementBar01Variant;
  liked: boolean;
  count: number;
  controlled: boolean;
  onToggle?: (next: boolean) => void;
  /** When provided, count becomes a separate clickable target. */
  onCountClick?: () => void;
  format: (n: number) => string;
  labels: Required<Omit<EngagementBarLabels, "formatCount">>;
  dispatch: React.Dispatch<EngagementLocalAction>;
  actionClassName?: string;
}

function LikeActionInner({
  variant,
  liked,
  count,
  controlled,
  onToggle,
  onCountClick,
  format,
  labels,
  dispatch,
  actionClassName,
}: LikeActionProps) {
  const handleHeartClick = () => {
    const next = !liked;
    if (!controlled) {
      dispatch({ kind: "like-toggle" });
    }
    onToggle?.(next);
  };

  const heartAriaLabel = liked ? labels.unlike : labels.like;
  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";
  const splitCount = !!onCountClick;

  if (variant === "stacked") {
    // Stacked layout: heart icon + count vertically. Split mode wraps each in
    // its own button.
    if (splitCount) {
      return (
        <div className={cn("flex flex-col items-center gap-0.5", actionClassName)}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={liked}
            aria-label={heartAriaLabel}
            onClick={handleHeartClick}
            className={cn("h-auto px-2 py-1", liked && "text-destructive")}
          >
            <Heart
              className={cn(
                "h-6 w-6 transition-transform",
                liked && "scale-110 fill-current",
              )}
            />
          </Button>
          <button
            type="button"
            onClick={onCountClick}
            aria-label={labels.openLikersPanel ?? "Show likers"}
            className="rounded text-xs font-medium tabular-nums text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {format(count)}
          </button>
        </div>
      );
    }
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={liked}
        aria-label={heartAriaLabel}
        onClick={handleHeartClick}
        className={cn(
          "flex h-auto flex-col items-center gap-0.5 px-2 py-1",
          liked && "text-destructive",
          actionClassName,
        )}
      >
        <Heart
          className={cn(
            "h-6 w-6 transition-transform",
            liked && "scale-110 fill-current",
          )}
        />
        <span className="text-xs font-medium tabular-nums" aria-live="polite">
          {format(count)}
        </span>
      </Button>
    );
  }

  // Default + compact horizontal layout. Split mode: heart Button + count button
  // separated by gap-2 to visually match the bundled `gap-2 px-2` of single-button
  // actions (comment / share / bookmark / view-count).
  if (splitCount) {
    return (
      <div className={cn("flex items-center gap-2 pr-2", actionClassName)}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={liked}
          aria-label={heartAriaLabel}
          onClick={handleHeartClick}
          className={cn(
            "h-9 px-2 transition-colors",
            liked && "text-destructive",
          )}
        >
          <Heart
            className={cn(
              iconSizeClass,
              "transition-transform",
              liked && "scale-110 fill-current",
            )}
          />
        </Button>
        <button
          type="button"
          onClick={onCountClick}
          aria-label={labels.openLikersPanel ?? "Show likers"}
          className={cn(
            "rounded text-sm font-medium tabular-nums transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            liked ? "text-destructive" : "text-foreground",
          )}
        >
          {format(count)}
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-pressed={liked}
      aria-label={heartAriaLabel}
      onClick={handleHeartClick}
      className={cn(
        "gap-2 px-2 transition-colors",
        liked && "text-destructive",
        actionClassName,
      )}
    >
      <Heart
        className={cn(
          iconSizeClass,
          "transition-transform",
          liked && "scale-110 fill-current",
        )}
      />
      <span className="text-sm font-medium tabular-nums" aria-live="polite">
        {format(count)}
      </span>
    </Button>
  );
}

export const LikeAction = memo(LikeActionInner);
LikeAction.displayName = "LikeAction";
