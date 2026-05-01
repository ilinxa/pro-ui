"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  UseMagazineFilterArgs,
  UseMagazineFilterReturn,
} from "../types";

/**
 * Companion hook for the simple consumer who wants filter + sort + paging
 * + loading state without writing it from scratch. Sophisticated consumers
 * skip this and drive the layout's props directly.
 *
 * Reset semantics: any change to `items`, `filterPredicate`, or
 * `sortComparator` reference resets the page back to 1.
 */
export function useMagazineFilter<T>({
  items,
  pageSize = 6,
  isFeatured,
  filterPredicate,
  sortComparator,
  simulatedLoadingMs = 0,
}: UseMagazineFilterArgs<T>): UseMagazineFilterReturn<T> {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const sortedFiltered = useMemo(() => {
    let result = filterPredicate ? items.filter(filterPredicate) : items.slice();
    if (sortComparator) result = result.sort(sortComparator);
    return result;
  }, [items, filterPredicate, sortComparator]);

  const featuredItem = useMemo(() => {
    if (!isFeatured) return undefined;
    return sortedFiltered.find(isFeatured);
  }, [sortedFiltered, isFeatured]);

  const regularItems = useMemo(
    () =>
      featuredItem
        ? sortedFiltered.filter((item) => item !== featuredItem)
        : sortedFiltered,
    [sortedFiltered, featuredItem],
  );

  const displayedItems = useMemo(
    () => regularItems.slice(0, page * pageSize),
    [regularItems, page, pageSize],
  );

  const hasMore = displayedItems.length < regularItems.length;
  const filteredCount = sortedFiltered.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    if (simulatedLoadingMs > 0) {
      setIsLoading(true);
      setTimeout(() => {
        setPage((p) => p + 1);
        setIsLoading(false);
      }, simulatedLoadingMs);
    } else {
      setPage((p) => p + 1);
    }
  }, [isLoading, hasMore, simulatedLoadingMs]);

  const reset = useCallback(() => {
    setPage(1);
    setIsLoading(false);
  }, []);

  return {
    displayedItems,
    featuredItem: page === 1 ? featuredItem : undefined,
    hasMore,
    isLoading,
    filteredCount,
    loadMore,
    reset,
  };
}
