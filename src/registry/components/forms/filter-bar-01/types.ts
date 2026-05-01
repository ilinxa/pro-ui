export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface FilterBarValue {
  search: string;
  category: string | null;
  dateRange: DateRange;
}

export interface FilterBarCategoryItem {
  value: string;
  label?: string;
}

export interface FilterBarLabels {
  /** Search placeholder. Default: 'Search…'. */
  searchPlaceholder?: string;
  /** Search input aria-label. Default: 'Search'. */
  searchAriaLabel?: string;
  /** "All" chip label. Default: 'All'. */
  allLabel?: string;
  /** Date trigger label when no range set. Default: 'Filter by date'. */
  dateButtonText?: string;
  /** Aria-label on the clear-date button. Default: 'Clear date filter'. */
  clearDateLabel?: string;
  /** Visible text on the clear-date button. Default: 'Clear date'. */
  clearDateText?: string;
  /** Results count formatter. Default: (n) => `${n} items found`. */
  resultsCountText?: (count: number) => string;
  /** ARIA group label for the chip row. Default: 'Filter by category'. */
  categoriesAriaLabel?: string;
}

export type FilterBarAlign = "left" | "center" | "right";

export interface FilterBarProps {
  /** Categories to render in the chip row. Pass `string[]` as shorthand. */
  categories?: FilterBarCategoryItem[] | string[];

  // ─── Search (controlled-or-uncontrolled) ──────────────
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  /** Debounce in ms for uncontrolled mode. Default: 250. */
  searchDebounceMs?: number;

  // ─── Category (controlled-or-uncontrolled) ────────────
  category?: string | null;
  defaultCategory?: string | null;
  onCategoryChange?: (category: string | null) => void;

  // ─── Date range (controlled-or-uncontrolled) ──────────
  dateRange?: DateRange;
  defaultDateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;

  // ─── Combined emitter ─────────────────────────────────
  onChange?: (value: FilterBarValue) => void;

  // ─── Display ──────────────────────────────────────────
  resultsCount?: number;
  align?: FilterBarAlign;
  hideSearch?: boolean;
  hideCategories?: boolean;
  hideDateRange?: boolean;

  // ─── i18n + theming ───────────────────────────────────
  labels?: FilterBarLabels;
  formatDateRange?: (range: { from: Date; to: Date }) => string;
  formatDate?: (date: Date) => string;

  // ─── Overrides ────────────────────────────────────────
  className?: string;
}

export const DEFAULT_LABELS: Required<FilterBarLabels> = {
  searchPlaceholder: "Search…",
  searchAriaLabel: "Search",
  allLabel: "All",
  dateButtonText: "Filter by date",
  clearDateLabel: "Clear date filter",
  clearDateText: "Clear date",
  resultsCountText: (count) => `${count} items found`,
  categoriesAriaLabel: "Filter by category",
};
