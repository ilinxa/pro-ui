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

  // Documented reset semantics — any change to items/filterPredicate/
  // sortComparator reference snaps page back to 1. Consumers MUST memoize
  // these references (or accept the reset cost) — that contract is part of
  // the hook's API surface.
  //
  // Implemented via React's "adjust state during render" pattern (NOT an
  // effect): track the prior dep refs in state; if any have changed, snap
  // page to 1 in the same pass. React batches the setStates and reruns
  // immediately — no extra commit. This avoids react-hooks/set-state-in-effect
  // (the React Compiler rejects setPage(1) inside a useEffect).
  // useState wraps function values with `() => fn` to bypass useState's
  // lazy-initializer treatment + updater-fn treatment for function-typed state.
  const [prevItems, setPrevItems] = useState(items);
  const [prevFilterPredicate, setPrevFilterPredicate] = useState<
    typeof filterPredicate
  >(() => filterPredicate);
  const [prevSortComparator, setPrevSortComparator] = useState<
    typeof sortComparator
  >(() => sortComparator);
  if (
    prevItems !== items ||
    prevFilterPredicate !== filterPredicate ||
    prevSortComparator !== sortComparator
  ) {
    setPrevItems(items);
    setPrevFilterPredicate(() => filterPredicate);
    setPrevSortComparator(() => sortComparator);
    setPage(1);
  }

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
