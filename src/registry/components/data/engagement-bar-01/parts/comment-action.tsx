"use client";

import { memo } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EngagementBar01Variant, EngagementBarLabels } from "../types";

interface CommentActionProps {
  variant: EngagementBar01Variant;
  count: number;
  onClick?: () => void;
  format: (n: number) => string;
  labels: Required<Omit<EngagementBarLabels, "formatCount">>;
  actionClassName?: string;
}

function CommentActionInner({
  variant,
  count,
  onClick,
  format,
  labels,
  actionClassName,
}: CommentActionProps) {
  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";

  if (variant === "stacked") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={labels.comment}
        onClick={onClick}
        className={cn(
          "flex h-auto flex-col items-center gap-0.5 px-2 py-1",
          actionClassName,
        )}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="text-xs font-medium tabular-nums">
          {format(count)}
        </span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={labels.comment}
      onClick={onClick}
      className={cn("gap-2 px-2", actionClassName)}
    >
      <MessageCircle className={iconSizeClass} />
      <span className="text-sm font-medium tabular-nums">{format(count)}</span>
    </Button>
  );
}

export const CommentAction = memo(CommentActionInner);
CommentAction.displayName = "CommentAction";
