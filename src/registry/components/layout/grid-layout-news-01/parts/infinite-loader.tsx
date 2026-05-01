"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import type { GridLayoutLabels } from "../types";

/**
 * Loader region. Holds the IntersectionObserver sentinel + visible status:
 *
 * - Loading → 3 bouncing dots (visually) + visually-hidden text label in
 *   an `aria-live="polite"` region.
 * - End-of-list (no more items, but at least one rendered) → muted text
 *   announcing completion.
 * - Otherwise → invisible sentinel only.
 */
export function InfiniteLoader({
  hasMore,
  isLoading,
  onLoadMore,
  hasItems,
  labels,
}: {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: (() => void) | undefined;
  hasItems: boolean;
  labels: Required<GridLayoutLabels>;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  useInfiniteScroll({
    ref: sentinelRef,
    hasMore,
    isLoading,
    onLoadMore,
  });

  const showEndOfList = !hasMore && hasItems && !isLoading;

  return (
    <div ref={sentinelRef} className="flex justify-center py-8">
      {isLoading ? (
        <div
          aria-live="polite"
          className="flex items-center gap-3"
        >
          <span className="sr-only">{labels.loadingLabel}</span>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                "h-2 w-2 rounded-full bg-primary",
                "motion-safe:animate-bounce",
              )}
              style={{ animationDelay: `${-300 + i * 150}ms` }}
            />
          ))}
        </div>
      ) : null}

      {showEndOfList ? (
        <p
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {labels.endOfListText}
        </p>
      ) : null}
    </div>
  );
}
