"use client";

import { memo } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  EngagementActionEvent,
  EngagementBarSize,
  EngagementBarVariant,
  EngagementCount,
  ResolvedEngagementBarLabels,
} from "../types";
import { DISABLED_ACTION_CLASS, useActionName, touchTarget } from "../lib/action-name";

interface LikeActionProps {
  variant: EngagementBarVariant;
  liked: boolean;
  count: EngagementCount;
  disabled?: boolean;
  /** The bar's toggle path (gating, handler, optimistic overlay). */
  onToggle: (event?: EngagementActionEvent) => void;
  /** When provided, count becomes a separate clickable target (not rendered when withheld). */
  onCountClick?: (event: EngagementActionEvent) => void;
  /** Disclosure state of the panel the COUNT button opens (0.7.0). */
  countExpanded?: boolean;
  /** aria-controls for the count button, rendered only while `countExpanded === true`. */
  countControls?: string;
  format: (n: number) => string;
  labels: ResolvedEngagementBarLabels;
  actionClassName?: string;
  size?: EngagementBarSize;
}

function LikeActionInner({
  variant,
  liked,
  count,
  disabled = false,
  onToggle,
  onCountClick,
  countExpanded,
  countControls,
  format,
  labels,
  actionClassName,
  size,
}: LikeActionProps) {
  const handleHeartClick = (event: EngagementActionEvent) => {
    if (disabled) return;
    onToggle(event);
  };
  const handleCountClick = (event: EngagementActionEvent) => {
    if (disabled) return;
    onCountClick?.(event);
  };

  const heartLabel = liked ? labels.unlike : labels.like;
  const hasCount = count !== null;
  const splitCount = !!onCountClick;
  const heartName = useActionName(hasCount && !splitCount);
  const countName = useActionName(true);
  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";
  const ariaDisabled = disabled || undefined;

  const heartIcon = (sizeClass: string) => (
    <Heart
      aria-hidden="true"
      className={cn(
        sizeClass,
        "motion-safe:transition-transform",
        liked && "scale-110 fill-current",
      )}
    />
  );
  const heartLabelNode = (
    <span id={heartName.labelId} className="sr-only">
      {heartLabel}
    </span>
  );
  const countButton = (textClass: string) =>
    hasCount ? (
      <button
        type="button"
        onClick={handleCountClick}
        aria-labelledby={countName.labelledBy}
        aria-expanded={countExpanded}
        aria-controls={countExpanded === true ? countControls : undefined}
        aria-disabled={ariaDisabled}
        className={cn(
          "rounded font-medium tabular-nums hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "motion-safe:transition-colors",
          textClass,
          touchTarget(size, true),
          DISABLED_ACTION_CLASS,
        )}
      >
        <span id={countName.labelId} className="sr-only">
          {labels.openLikersPanel}
        </span>
        <span id={countName.countId}>{format(count)}</span>
      </button>
    ) : null;

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
            aria-labelledby={heartName.labelledBy}
            aria-disabled={ariaDisabled}
            onClick={handleHeartClick}
            className={cn(
              "h-auto px-2 py-1",
              liked && "text-destructive",
              touchTarget(size),
              DISABLED_ACTION_CLASS,
            )}
          >
            {heartIcon("h-6 w-6")}
            {heartLabelNode}
          </Button>
          {countButton("text-xs text-foreground")}
        </div>
      );
    }
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-pressed={liked}
        aria-labelledby={heartName.labelledBy}
        aria-disabled={ariaDisabled}
        onClick={handleHeartClick}
        className={cn(
          "flex h-auto flex-col items-center gap-0.5 px-2 py-1",
          liked && "text-destructive",
          touchTarget(size),
          DISABLED_ACTION_CLASS,
          actionClassName,
        )}
      >
        {heartIcon("h-6 w-6")}
        {heartLabelNode}
        {hasCount ? (
          <span
            id={heartName.countId}
            // Stacked sits on media overlays (story-viewer): the count keeps the button's colour.
            className="text-xs font-medium tabular-nums"
            aria-live="polite"
          >
            {format(count)}
          </span>
        ) : null}
      </Button>
    );
  }

  // Default + compact horizontal layout. Split mode: heart Button + count button
  // separated by gap-2 to visually match the bundled `gap-2 px-2` of single-button
  // actions (comment / share / bookmark / view-count).
  if (splitCount) {
    return (
      <div className={cn("flex items-center gap-2 pe-2", actionClassName)}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={liked}
          aria-labelledby={heartName.labelledBy}
          aria-disabled={ariaDisabled}
          onClick={handleHeartClick}
          className={cn(
            "h-9 px-2 motion-safe:transition-colors",
            liked && "text-destructive",
            touchTarget(size),
            DISABLED_ACTION_CLASS,
          )}
        >
          {heartIcon(iconSizeClass)}
          {heartLabelNode}
        </Button>
        {countButton("text-sm text-foreground")}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-pressed={liked}
      aria-labelledby={heartName.labelledBy}
      aria-disabled={ariaDisabled}
      onClick={handleHeartClick}
      className={cn(
        hasCount ? "gap-2 px-2" : "px-2",
        "motion-safe:transition-colors",
        liked && "text-destructive",
        touchTarget(size),
        DISABLED_ACTION_CLASS,
        actionClassName,
      )}
    >
      {heartIcon(iconSizeClass)}
      {heartLabelNode}
      {hasCount ? (
        <span
          id={heartName.countId}
          className={cn("text-sm font-medium tabular-nums", liked && "text-foreground")}
          aria-live="polite"
        >
          {format(count)}
        </span>
      ) : null}
    </Button>
  );
}

export const LikeAction = memo(LikeActionInner);
LikeAction.displayName = "LikeAction";
