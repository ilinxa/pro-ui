import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Tier C — the loading/empty state as a **component** (not a `loading` prop —
 * gantt precedent): a card silhouette with a meter shimmer, composable anywhere
 * while the host fetches. Purely presentational, context-free, framework-free.
 */
export function CooperativeChallengeSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-16 rounded-4xl" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex -space-x-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-2.5 w-full rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-9 w-32 rounded-md" />
    </div>
  );
}
