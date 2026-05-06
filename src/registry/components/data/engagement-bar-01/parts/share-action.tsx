"use client";

import { memo } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EngagementBar01Variant, EngagementBarLabels } from "../types";

interface ShareActionProps {
  variant: EngagementBar01Variant;
  count?: number;
  onClick?: () => void;
  format: (n: number) => string;
  labels: Required<Omit<EngagementBarLabels, "formatCount">>;
  actionClassName?: string;
}

function ShareActionInner({
  variant,
  count,
  onClick,
  format,
  labels,
  actionClassName,
}: ShareActionProps) {
  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";
  const showCount = count !== undefined;

  if (variant === "stacked") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={labels.share}
        onClick={onClick}
        className={cn(
          "flex h-auto flex-col items-center gap-0.5 px-2 py-1",
          actionClassName,
        )}
      >
        <Share2 className="h-6 w-6" />
        {showCount ? (
          <span className="text-xs font-medium tabular-nums">
            {format(count)}
          </span>
        ) : null}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={labels.share}
      onClick={onClick}
      className={cn(showCount ? "gap-2 px-2" : "px-2", actionClassName)}
    >
      <Share2 className={iconSizeClass} />
      {showCount ? (
        <span className="text-sm font-medium tabular-nums">
          {format(count)}
        </span>
      ) : null}
    </Button>
  );
}

export const ShareAction = memo(ShareActionInner);
ShareAction.displayName = "ShareAction";
