import { createCountText } from "./lib/format-default";
import type { ReactNode } from "react";
import type { Locale } from "react-day-picker";

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
  /** Results count formatter. Default: "1 item found" / "{n} items found" (English plural rules). */
  resultsCountText?: (count: number) => string;
  /** ARIA group label for the chip row. Default: 'Filter by category'. */
  categoriesAriaLabel?: string;
  /** Shown when the lazily loaded calendar fails to load. Default: "Couldn't load the calendar.". */
  calendarLoadErrorText?: string;
  /** Retry button text beside the load-error message. Default: 'Try again'. */
  calendarRetryText?: string;
}

export type FilterBarAlign = "left" | "center" | "right";

export interface FilterBarProps {
  /** Categories to render in the chip row. Pass `string[]` as shorthand. */
  categories?: FilterBarCategoryItem[] | string[];

  // ─── Search (controlled-or-uncontrolled) ──────────────
  search?: string;
  defaultSearch?: string;
  onSearchChange?: (search: string) => void;
  /** Debounce in ms for uncontrolled mode (and controlled mode with `debounceControlledSearch`). Default: 250. */
  searchDebounceMs?: number;
  /**
   * Controlled `search` only. Off (default): `onSearchChange` fires on every keystroke.
   * On: the input keeps a local echo and commits after `searchDebounceMs`. The prop wins whenever
   * it changes to a value that is not one of your own commits (URL change, reset): the field
   * resyncs to it. While a commit is pending the field shows the user's typing, and a host that
   * never adopts a commit leaves the field showing the typed text until the prop next changes.
   */
  debounceControlledSearch?: boolean;
  /** Trailing slot inside the search field (after the input in tab order). */
  searchAccessory?: ReactNode;

  // ─── Category (controlled-or-uncontrolled) ────────────
  category?: string | null;
  defaultCategory?: string | null;
  onCategoryChange?: (category: string | null) => void;

  // ─── Date range (controlled-or-uncontrolled) ──────────
  dateRange?: DateRange;
  defaultDateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;

  // ─── Combined emitter ─────────────────────────────────
  /**
   * Fires from user interactions only, once each, with the merged next value. Not on mount,
   * not when this callback's identity changes, not when a controlled prop changes from outside.
   */
  onChange?: (value: FilterBarValue) => void;
  /** Fire `onChange` once on mount with the initial value. Default: false. */
  emitInitialChange?: boolean;

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
  /** BCP 47 tag for the default date + count formatting. Default `"en"`; an invalid tag falls back to `"en"`. */
  locale?: string;
  /** IANA time zone for the default date formatting and the calendar's day math. Default: the runtime's zone. */
  timeZone?: string;
  /** A react-day-picker / date-fns `Locale` object (host imports it) for the calendar's month and day names. */
  calendarLocale?: Locale;
  /** Text direction for the calendar popover. Default: resolved from the nearest `[dir]`. */
  dir?: "ltr" | "rtl";

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
  resultsCountText: (count) => createCountText(undefined)(count),
  categoriesAriaLabel: "Filter by category",
  calendarLoadErrorText: "Couldn't load the calendar.",
  calendarRetryText: "Try again",
};
