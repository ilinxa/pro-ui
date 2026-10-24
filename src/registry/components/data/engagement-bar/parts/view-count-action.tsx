"use client";

import { memo } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EngagementBarVariant,
  EngagementCount,
  ResolvedEngagementBarLabels,
} from "../types";
import { useActionName } from "../lib/action-name";

interface ViewCountActionProps {
  variant: EngagementBarVariant;
  count: EngagementCount;
  format: (n: number) => string;
  labels: ResolvedEngagementBarLabels;
  actionClassName?: string;
}

function ViewCountActionInner({
  variant,
  count,
  format,
  labels,
  actionClassName,
}: ViewCountActionProps) {
  const hasCount = count !== null;
  const name = useActionName(hasCount);
  const iconSizeClass = variant === "compact" ? "h-4 w-4" : "h-5 w-5";
  const stacked = variant === "stacked";

  return (
    <div
      role="group"
      aria-labelledby={name.labelledBy}
      className={cn(
        stacked
          ? "flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground"
          : "flex items-center gap-2 px-2 text-sm text-muted-foreground",
        actionClassName,
      )}
    >
      <Eye aria-hidden="true" className={stacked ? "h-6 w-6" : iconSizeClass} />
      <span id={name.labelId} className="sr-only">
        {labels.viewCount}
      </span>
      {hasCount ? (
        <span
          id={name.countId}
          className={cn("font-medium tabular-nums", stacked && "text-xs")}
          aria-live="polite"
        >
          {format(count)}
        </span>
      ) : null}
    </div>
  );
}

export const ViewCountAction = memo(ViewCountActionInner);
ViewCountAction.displayName = "ViewCountAction";
