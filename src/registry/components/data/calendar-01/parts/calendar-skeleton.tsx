"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Loading skeleton (Tier C). A month-grid placeholder. */
export function CalendarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 p-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-52" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* 42 = 6 weeks × 7 — a month grid can return 6 rows, so reserve the max
            to avoid a load→loaded layout jump (monthGrid is 5 or 6 weeks). */}
        {Array.from({ length: 42 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
