"use client";

import { memo } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  EngagementBarVariant,
  EngagementCount,
  ResolvedEngagementBarLabels,
} from "../types";
import { DISABLED_ACTION_CLASS, useActionName } from "../lib/action-name";

interface CommentActionProps {
  variant: EngagementBarVariant;
  count: EngagementCount;
  disabled?: boolean;
  onClick?: () => void;
  format: (n: number) => string;
  labels: ResolvedEngagementBarLabels;
  actionClassName?: string;
}

function CommentActionInner({
  variant,
  count,
  disabled = false,
  onClick,
  format,
  labels,
  actionClassName,
}: CommentActionProps) {
  const hasCount = count !== null;
  const name = useActionName(hasCount);
  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";
  const stacked = variant === "stacked";
  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-labelledby={name.labelledBy}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      className={cn(
        stacked
          ? "flex h-auto flex-col items-center gap-0.5 px-2 py-1"
          : hasCount
            ? "gap-2 px-2"
            : "px-2",
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
