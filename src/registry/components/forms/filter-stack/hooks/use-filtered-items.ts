"use client";

import { useEffect, useMemo, useRef } from "react";
import type { FilterCategory, FilterValue } from "../types";
import { applyFilters } from "../lib/apply-filters";

export function useFilteredItems<T>(
  items: ReadonlyArray<T>,
  categories: ReadonlyArray<FilterCategory<T>>,
  values: Record<string, FilterValue>,
  onFilteredChange?: (filtered: ReadonlyArray<T>) => void,
): ReadonlyArray<T> {
  const filtered = useMemo(
    () => applyFilters(items, categories, values),
    [items, categories, values],
  );

  const onFilteredChangeRef = useRef(onFilteredChange);
  useEffect(() => {
    onFilteredChangeRef.current = onFilteredChange;
  });

  useEffect(() => {
    const cb = onFilteredChangeRef.current;
    if (!cb) return;
    try {
      cb(filtered);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[filter-stack] onFilteredChange threw:", err);
      }
    }
  }, [filtered]);

  return filtered;
}
