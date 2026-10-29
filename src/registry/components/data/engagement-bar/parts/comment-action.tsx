"use client";

import { memo } from "react";
import { MessageCircle } from "lucide-react";
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

interface CommentActionProps {
  variant: EngagementBarVariant;
  count: EngagementCount;
  disabled?: boolean;
  onClick?: (event: EngagementActionEvent) => void;
  /** Disclosure state (0.7.0): rendered as aria-expanded; undefined = no attribute. */
  expanded?: boolean;
  /** aria-controls target, rendered only while `expanded === true`. */
  controls?: string;
  format: (n: number) => string;
  labels: ResolvedEngagementBarLabels;
  actionClassName?: string;
  size?: EngagementBarSize;
}

function CommentActionInner({
  variant,
  count,
  disabled = false,
  onClick,
  expanded,
  controls,
  format,
  labels,
  actionClassName,
  size,
}: CommentActionProps) {
  const hasCount = count !== null;
  const name = useActionName(hasCount);
  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";
  const stacked = variant === "stacked";
  const handleClick = (event: EngagementActionEvent) => {
    if (disabled) return;
    onClick?.(event);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-labelledby={name.labelledBy}
      aria-disabled={disabled || undefined}
      aria-expanded={expanded}
      aria-controls={expanded === true ? controls : undefined}
      onClick={handleClick}
      className={cn(
        stacked
          ? "flex h-auto flex-col items-center gap-0.5 px-2 py-1"
          : hasCount
            ? "gap-2 px-2"
            : "px-2",
        touchTarget(size),
        DISABLED_ACTION_CLASS,
        actionClassName,
      )}
    >
      <MessageCircle aria-hidden="true" className={stacked ? "h-6 w-6" : iconSizeClass} />
      <span id={name.labelId} className="sr-only">
        {labels.comment}
      </span>
      {hasCount ? (
        <span
          id={name.countId}
          className={cn("font-medium tabular-nums", stacked ? "text-xs" : "text-sm")}
        >
          {format(count)}
        </span>
      ) : null}
    </Button>
  );
}

export const CommentAction = memo(CommentActionInner);
CommentAction.displayName = "CommentAction";
