"use client";

import { cn } from "@/lib/utils";

interface SidebarLoadingSkeletonProps {
  isCollapsed: boolean;
  rowCount?: number;
  className?: string;
}

/**
 * Default loading skeleton — 6 shimmer rows by default.
 *
 * Width matches sidebar's collapsed/expanded mode automatically (inherits
 * the parent <nav>'s width). Shimmer animation gated motion-safe;
 * reduced-motion users see static muted rows.
 *
 * Override entirely via the `renderLoading` slot (L13 priority).
 */
export function SidebarLoadingSkeleton({
  isCollapsed,
  rowCount = 6,
  className,
}: SidebarLoadingSkeletonProps) {
  return (
    <ul
      role="list"
      aria-busy="true"
      aria-label="Loading navigation items"
      className={cn("flex flex-col gap-1", className)}
    >
      {Array.from({ length: rowCount }, (_, i) => (
        <li key={i} className="list-none">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5",
              "motion-safe:animate-pulse",
            )}
            aria-hidden="true"
          >
            <span className="h-5 w-5 shrink-0 rounded-md bg-muted" />
            {!isCollapsed && (
              <span
                className="h-4 rounded bg-muted"
                style={{
                  // Vary the width slightly so the skeleton looks real
                  width: `${60 + ((i * 7) % 30)}%`,
                }}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
