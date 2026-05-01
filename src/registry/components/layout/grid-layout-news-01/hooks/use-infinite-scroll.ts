"use client";

import { useEffect, type RefObject } from "react";

/**
 * Wires an IntersectionObserver to a sentinel element. When the sentinel
 * enters the viewport AND `hasMore` is true AND `isLoading` is false,
 * `onLoadMore` is fired.
 */
export function useInfiniteScroll({
  ref,
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
}: {
  ref: RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: (() => void) | undefined;
  threshold?: number;
}) {
  useEffect(() => {
    const sentinel = ref.current;
    if (!sentinel) return;
    if (!onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [ref, hasMore, isLoading, onLoadMore, threshold]);
}
