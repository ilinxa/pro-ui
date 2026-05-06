"use client";

import { memo } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EngagementBar01Variant, EngagementBarLabels } from "../types";

interface ViewCountActionProps {
  variant: EngagementBar01Variant;
  count: number;
  format: (n: number) => string;
  labels: Required<Omit<EngagementBarLabels, "formatCount">>;
  actionClassName?: string;
}

function ViewCountActionInner({
  variant,
  count,
  format,
  labels,
  actionClassName,
}: ViewCountActionProps) {
  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";

  if (variant === "stacked") {
    return (
      <div
        role="group"
        aria-label={labels.viewCount}
        className={cn(
          "flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground",
          actionClassName,
        )}
      >
        <Eye className="h-6 w-6" />
        <span
          className="text-xs font-medium tabular-nums"
          aria-live="polite"
        >
          {format(count)}
        </span>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={labels.viewCount}
      className={cn(
        "flex items-center gap-2 px-2 text-sm text-muted-foreground",
        actionClassName,
      )}
    >
      <Eye className={iconSizeClass} />
      <span className="font-medium tabular-nums" aria-live="polite">
        {format(count)}
      </span>
    </div>
  );
}

export const ViewCountAction = memo(ViewCountActionInner);
ViewCountAction.displayName = "ViewCountAction";
