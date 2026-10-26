"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useDirection } from "./hooks/use-direction";
import {
  createCountText,
  createDateFormatters,
  resolveLocale,
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
  left: "items-start text-start",
  center: "items-center text-center",
  right: "items-end text-end",
} as const;

const ALIGN_JUSTIFY = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
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
 * FilterBar — composite filter bar with search + category chips + date-range
 * + optional results count. Each sub-control is independently controlled-or-
 * uncontrolled; a combined `onChange` fires once per user interaction (never
 * from an effect, so not on mount unless `emitInitialChange`).
 */
function FilterBarImpl(props: FilterBarProps) {
  const {
    categories,
    search: controlledSearch,
    defaultSearch = "",
    onSearchChange,
    searchDebounceMs = 250,
    debounceControlledSearch = false,
    searchAccessory,
    category: controlledCategory,
    defaultCategory = null,
    onCategoryChange,
    dateRange: controlledDateRange,
    defaultDateRange = { from: undefined, to: undefined },
    onDateRangeChange,
    onChange,
    emitInitialChange = false,
    resultsCount,
    align = "center",
    hideSearch = false,
    hideCategories = false,
    hideDateRange = false,
    labels: labelsProp,
    formatDateRange: formatDateRangeProp,
    formatDate: formatDateProp,
    locale: localeProp,
    timeZone,
    calendarLocale,
    dir: dirProp,
    className,
  } = props;

  const rootRef = useRef<HTMLDivElement>(null);
  const dir = useDirection(rootRef, dirProp);

  // ─── Locale-aware defaults (built here, memoised — never module scope) ───
  const locale = useMemo(() => resolveLocale(localeProp), [localeProp]);
  const dateFormatters = useMemo(
    () => createDateFormatters(locale, timeZone),
    [locale, timeZone],
  );
  const formatDateRange = formatDateRangeProp ?? dateFormatters.formatDateRange;
  const formatDate = formatDateProp ?? dateFormatters.formatDate;
  const localePassed = localeProp !== undefined;
  const defaultCountText = useMemo(
    () => createCountText(localePassed ? locale : undefined),
    [localePassed, locale],
  );

  const labels = useMemo(() => {
    // An `undefined` value never erases a default (dropped before merging, for every key);
    // the default count text follows `locale`.
    const defined = Object.fromEntries(
      Object.entries(labelsProp ?? {}).filter(([, v]) => v !== undefined),
    );
    const merged = { ...DEFAULT_LABELS, ...defined };
    if (!labelsProp?.resultsCountText) merged.resultsCountText = defaultCountText;
    return merged;
  }, [labelsProp, defaultCountText]);

  const normalizedCategories = useMemo(
    () => normalizeCategories(categories),
    [categories],
  );

  // ─── Search state ────────────────────────────────────────
  const [internalSearch, setInternalSearch] = useState(defaultSearch);
  const isSearchControlled = controlledSearch !== undefined;
  const search = isSearchControlled ? controlledSearch : internalSearch;

  // ─── Category state ──────────────────────────────────────
  const [internalCategory, setInternalCategory] = useState<string | null>(
    defaultCategory,
  );
  const isCategoryControlled = controlledCategory !== undefined;
  const category = isCategoryControlled ? controlledCategory : internalCategory;

  // ─── Date range state ────────────────────────────────────
  const [internalDateRange, setInternalDateRange] = useState<DateRange>(defaultDateRange);
  const isDateRangeControlled = controlledDateRange !== undefined;
  const dateRange = isDateRangeControlled ? controlledDateRange : internalDateRange;

  // ─── Combined onChange ───────────────────────────────────
  // Emitted from the user handlers only, with the merged next value. The latest
  // render's values live in a ref so the handlers stay stable.
  const latest = useRef({ search, category, dateRange, onChange });
  useEffect(() => {
    latest.current = { search, category, dateRange, onChange };
  });

  const emit = useCallback((patch: Partial<FilterBarValue>) => {
    const cur = latest.current;
    cur.onChange?.({
      search: cur.search,
      category: cur.category,
      dateRange: cur.dateRange,
      ...patch,
    });
  }, []);

  const applySearch = useCallback(
    (next: string) => {
      if (!isSearchControlled) setInternalSearch(next);
      onSearchChange?.(next);
    },
    [isSearchControlled, onSearchChange],
  );

  const handleSearchChange = useCallback(
    (next: string) => {
      applySearch(next);
      emit({ search: next });
    },
    [applySearch, emit],
  );

  // Another control was used while a search commit was pending: commit the visible text
  // first so this interaction's single `onChange` carries it (and no late search-only
  // `onChange` follows). Returns the flushed text as a patch, or `{}`.
  const searchFlushRef = useRef<(() => string | undefined) | null>(null);
  const flushSearch = useCallback((): Partial<FilterBarValue> => {
    const pending = searchFlushRef.current?.();
    if (pending === undefined) return {};
    applySearch(pending);
    return { search: pending };
  }, [applySearch]);

  const handleCategoryChange = useCallback(
    (next: string | null) => {
      const flushed = flushSearch();
      if (!isCategoryControlled) setInternalCategory(next);
      onCategoryChange?.(next);
      emit({ ...flushed, category: next });
    },
    [isCategoryControlled, onCategoryChange, emit, flushSearch],
  );

  const handleDateRangeChange = useCallback(
    (next: DateRange) => {
      const flushed = flushSearch();
      if (!isDateRangeControlled) setInternalDateRange(next);
      onDateRangeChange?.(next);
      emit({ ...flushed, dateRange: next });
    },
    [isDateRangeControlled, onDateRangeChange, emit, flushSearch],
  );

  // Opt-in single emission on mount (a ref guards the StrictMode effect replay).
  const initialEmitted = useRef(false);
  useEffect(() => {
    if (!emitInitialChange || initialEmitted.current) return;
    initialEmitted.current = true;
    emit({});
  }, [emitInitialChange, emit]);

  const filtersRowVisible = !hideCategories || !hideDateRange;
  const justify = ALIGN_JUSTIFY[align];

  return (
    <div
      ref={rootRef}
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
          debounced={!isSearchControlled || debounceControlledSearch}
          debounceMs={searchDebounceMs}
          placeholder={labels.searchPlaceholder}
          ariaLabel={labels.searchAriaLabel}
          accessory={searchAccessory}
          flushRef={searchFlushRef}
          className="w-full max-w-xl"
        />
      ) : null}

      {filtersRowVisible ? (
        <div className={cn("flex flex-wrap items-center gap-4", justify)}>
          {!hideCategories && normalizedCategories.length > 0 ? (
            <ChipRow
              items={normalizedCategories}
              value={category}
              onChange={handleCategoryChange}
              allLabel={labels.allLabel}
              ariaLabel={labels.categoriesAriaLabel}
              className={justify}
            />
          ) : null}
          {!hideDateRange ? (
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              buttonText={labels.dateButtonText}
              clearLabel={labels.clearDateLabel}
              clearText={labels.clearDateText}
              loadErrorText={labels.calendarLoadErrorText}
              retryText={labels.calendarRetryText}
              timeZone={timeZone}
              formatRange={formatDateRange}
              formatDate={formatDate}
              calendarLocale={calendarLocale}
              dir={dir}
            />
          ) : null}
        </div>
      ) : null}

      {/* Always mounted so the first announcement is not lost to a late-inserted region. */}
      <p aria-live="polite" className="text-sm text-muted-foreground empty:hidden">
        {resultsCount !== undefined ? labels.resultsCountText(resultsCount) : null}
      </p>
    </div>
  );
}

export const FilterBar = memo(FilterBarImpl);
FilterBar.displayName = "FilterBar";

export default FilterBar;

// Re-export the value type for consumers importing from the root file.
export type { FilterBarValue };
