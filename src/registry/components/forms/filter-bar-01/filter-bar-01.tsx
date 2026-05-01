"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  defaultFormatDate,
  defaultFormatDateRange,
} from "./lib/format-default";
import { ChipRow } from "./parts/chip-row";
import { DateRangePicker } from "./parts/date-range-picker";
import { SearchInput } from "./parts/search-input";
import {
  DEFAULT_LABELS,
  type DateRange,
  type FilterBarCategoryItem,
  type FilterBarProps,
  type FilterBarValue,
} from "./types";

const ALIGN_CLASSES = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
} as const;

const normalizeCategories = (
  input: FilterBarCategoryItem[] | string[] | undefined,
): FilterBarCategoryItem[] => {
  if (!input) return [];
  return input.map((entry) =>
    typeof entry === "string" ? { value: entry, label: entry } : entry,
  );
};

/**
 * FilterBar01 — composite filter bar with search + category chips + date-range
 * + optional results count. Each sub-control is independently controlled-or-
 * uncontrolled; a combined `onChange` fires on any change.
 */
function FilterBar01Impl(props: FilterBarProps) {
  const {
    categories,
    search: controlledSearch,
    defaultSearch = "",
    onSearchChange,
    searchDebounceMs = 250,
    category: controlledCategory,
    defaultCategory = null,
    onCategoryChange,
    dateRange: controlledDateRange,
    defaultDateRange = { from: undefined, to: undefined },
    onDateRangeChange,
    onChange,
    resultsCount,
    align = "center",
    hideSearch = false,
    hideCategories = false,
    hideDateRange = false,
    labels: labelsProp,
    formatDateRange = defaultFormatDateRange,
    formatDate = defaultFormatDate,
    className,
  } = props;

  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const normalizedCategories = useMemo(
    () => normalizeCategories(categories),
    [categories],
  );

  // ─── Search state ────────────────────────────────────────
  const [internalSearch, setInternalSearch] = useState(defaultSearch);
  const isSearchControlled = controlledSearch !== undefined;
  const search = isSearchControlled ? controlledSearch : internalSearch;

  const handleSearchChange = useCallback(
    (next: string) => {
      if (!isSearchControlled) setInternalSearch(next);
      onSearchChange?.(next);
    },
    [isSearchControlled, onSearchChange],
  );

  // ─── Category state ──────────────────────────────────────
  const [internalCategory, setInternalCategory] = useState<string | null>(
    defaultCategory,
  );
  const isCategoryControlled = controlledCategory !== undefined;
  const category = isCategoryControlled ? controlledCategory : internalCategory;

  const handleCategoryChange = useCallback(
    (next: string | null) => {
      if (!isCategoryControlled) setInternalCategory(next);
      onCategoryChange?.(next);
    },
    [isCategoryControlled, onCategoryChange],
  );

  // ─── Date range state ────────────────────────────────────
  const [internalDateRange, setInternalDateRange] = useState<DateRange>(defaultDateRange);
  const isDateRangeControlled = controlledDateRange !== undefined;
  const dateRange = isDateRangeControlled ? controlledDateRange : internalDateRange;

  const handleDateRangeChange = useCallback(
    (next: DateRange) => {
      if (!isDateRangeControlled) setInternalDateRange(next);
      onDateRangeChange?.(next);
    },
    [isDateRangeControlled, onDateRangeChange],
  );

  // ─── Combined onChange ───────────────────────────────────
  useEffect(() => {
    if (!onChange) return;
    onChange({ search, category, dateRange });
    // We intentionally fire on every change (including initial mount).
    // Consumers wanting initial-render skip should track it themselves.
  }, [search, category, dateRange, onChange]);

  const filtersRowVisible = !hideCategories || !hideDateRange;

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        ALIGN_CLASSES[align],
        className,
      )}
    >
      {!hideSearch ? (
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          isControlled={isSearchControlled}
          debounceMs={searchDebounceMs}
          placeholder={labels.searchPlaceholder}
          ariaLabel={labels.searchAriaLabel}
          className="w-full max-w-xl"
        />
      ) : null}

      {filtersRowVisible ? (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {!hideCategories && normalizedCategories.length > 0 ? (
            <ChipRow
              items={normalizedCategories}
              value={category}
              onChange={handleCategoryChange}
              allLabel={labels.allLabel}
              ariaLabel={labels.categoriesAriaLabel}
            />
          ) : null}
          {!hideDateRange ? (
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              buttonText={labels.dateButtonText}
              clearLabel={labels.clearDateLabel}
              clearText={labels.clearDateText}
              formatRange={formatDateRange}
              formatDate={formatDate}
            />
          ) : null}
        </div>
      ) : null}

      {resultsCount !== undefined ? (
        <p
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {labels.resultsCountText(resultsCount)}
        </p>
      ) : null}
    </div>
  );
}

export const FilterBar01 = memo(FilterBar01Impl);
FilterBar01.displayName = "FilterBar01";

export default FilterBar01;

// Re-export the value type for consumers importing from the root file.
export type { FilterBarValue };
