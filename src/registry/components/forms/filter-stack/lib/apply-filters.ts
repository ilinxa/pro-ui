import type { FilterCategory, FilterValue } from "../types";
import { isCategoryEmpty } from "./default-is-empty";

export function applyFilters<T>(
  items: ReadonlyArray<T>,
  categories: ReadonlyArray<FilterCategory<T>>,
  values: Record<string, FilterValue>,
): ReadonlyArray<T> {
  const activePredicates: Array<(item: T) => boolean> = [];
  for (const cat of categories) {
    const value = values[cat.id];
    if (isCategoryEmpty(cat, value)) continue;
    activePredicates.push((item) => {
      try {
        return cat.predicate(item, value);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error(
            `[filter-stack] predicate threw for category "${cat.id}":`,
            err,
          );
        }
        return false;
      }
    });
  }
  if (activePredicates.length === 0) return items;
  return items.filter((item) => activePredicates.every((p) => p(item)));
}
