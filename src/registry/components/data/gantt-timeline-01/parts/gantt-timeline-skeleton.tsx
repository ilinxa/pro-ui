"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Tier C — loading placeholder (axis + rows). Zero state; composes anywhere. */
export function GanttTimelineSkeleton({
  rows = 7,
  gutterWidth = 280,
  rowHeight = 36,
  className,
}: {
  rows?: number;
  gutterWidth?: number;
  rowHeight?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
      aria-busy
      aria-label="Loading timeline"
    >
      <div className="flex border-b border-border">
        <div
          className="flex shrink-0 items-center border-r border-border p-2"
          style={{ width: gutterWidth }}
        >
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex grow items-center gap-6 p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex border-b border-border/40"
          style={{ height: rowHeight }}
        >
          <div
            className="flex shrink-0 items-center gap-2 border-r border-border px-2"
            style={{ width: gutterWidth, paddingLeft: 8 + (i % 3) * 16 }}
          >
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="flex grow items-center px-3">
            <Skeleton
              className="h-4 rounded"
              style={{
                width: `${28 + ((i * 37) % 48)}%`,
                marginLeft: `${(i * 53) % 30}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
