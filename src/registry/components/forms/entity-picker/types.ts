import type { ReactNode, Ref } from "react";

export interface EntityLike {
  id: string;
  label: string;
  kind?: string;
}

export interface KindMeta {
  label: string;
  color?: string;
}

export type PickerMode = "single" | "multi";

export interface RenderItemContext {
  selected: boolean;
  query: string;
}

export interface RenderTriggerContext<T extends EntityLike> {
  value: T | T[] | null;
  open: boolean;
  triggerRef: (node: HTMLElement | null) => void;
}

export interface RenderEmptyContext {
  query: string;
  itemCount: number;
}

export interface RenderLoadingContext {
  query: string;
  /** Rows currently shown (loading can overlay existing rows). */
  itemCount: number;
}

export interface RenderErrorContext {
  /** The `error` string, or `labels.error` when `error` is `true`. */
  message: string;
  query: string;
  /** Present only when the host passed `onRetry`. */
  onRetry?: () => void;
}

/** User-facing strings. Every key is optional on the prop; an `undefined` key keeps the default. */
export interface EntityPickerLabels {
  /** Search input placeholder. Default: "Search…". */
  searchPlaceholder: string;
  /** Accessible name of the search input. Default: "Search entities". */
  searchLabel: string;
  /** Text shown in the trigger while nothing is selected. Default: "Select…". */
  triggerPlaceholder: string;
  /** Accessible name of a chip's remove button. Default: `Remove ${label}`. */
  removeChip: (label: string) => string;
  /** Empty state when there are no items at all. Default: "Nothing to pick from". */
  nothingToPick: string;
  /** Empty state when a search matches nothing. Default: "No results". */
  noResults: string;
  /** Loading row text. Default: "Loading…". */
  loading: string;
  /** Error row text when `error` is `true`. Default: "Something went wrong". */
  error: string;
  /** Retry button text (rendered only with `onRetry`). Default: "Retry". */
  retry: string;
  /** "Load more" row text. Default: "Load more". */
  loadMore: string;
  /**
   * Polite announcement once loading settles while open. Receives the raw count and the
   * `locale`-formatted one. Default: "3 results".
   */
  resultsCount: (count: number, formatted: string) => string;
  /** Accessible name of the results listbox. Default: "Suggestions". */
  listLabel: string;
  /**
   * Visually hidden text appended to a chosen row so screen readers can tell chosen rows from
   * the highlighted one. Default: "selected".
   */
  selectedState: string;
}

/** Default English labels, exported for consumer composition. */
export const defaultEntityPickerLabels: EntityPickerLabels = {
  searchPlaceholder: "Search…",
  searchLabel: "Search entities",
  triggerPlaceholder: "Select…",
  removeChip: (label) => `Remove ${label}`,
  nothingToPick: "Nothing to pick from",
  noResults: "No results",
  loading: "Loading…",
  error: "Something went wrong",
  retry: "Retry",
  loadMore: "Load more",
  resultsCount: (count, formatted) => `${formatted} ${count === 1 ? "result" : "results"}`,
  listLabel: "Suggestions",
  selectedState: "selected",
};

export interface CommonPickerProps<T extends EntityLike> {
  items: ReadonlyArray<T>;

  match?: (item: T, query: string) => boolean;
  /** @deprecated Use `labels.searchPlaceholder`. When set it wins over the label. */
  placeholder?: string;

  /** Controlled search text; wins on every render. Omit for the uncontrolled input (resets on close). */
  query?: string;
  /**
   * Called when the search text changes (`"input"`) and when the picker closes and clears it
   * (`"reset"`, always with `""`).
   */
  onQueryChange?: (query: string, reason: "input" | "reset") => void;
  /**
   * `false` turns the built-in filtering off: `items` render as given (server-side search) and
   * `match` is ignored. Default `true`.
   */
  filterItems?: boolean;

  /** Show the loading row (and `aria-busy` on the list). Wins over `error` and the empty state. */
  loading?: boolean;
  /** `true` shows `labels.error`; a string shows that text. Ignored while `loading`. */
  error?: boolean | string;
  /** Retry handler. The Retry button renders only when this is given. */
  onRetry?: () => void;
  renderLoading?: (ctx: RenderLoadingContext) => ReactNode;
  renderError?: (ctx: RenderErrorContext) => ReactNode;

  /** More pages exist. The "Load more" row renders only with both `hasMore` and `onLoadMore`. */
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** A page is being fetched: the "Load more" row shows the loading text and is disabled. */
  loadingMore?: boolean;

  labels?: Partial<EntityPickerLabels>;
  /** BCP 47 tag for the default match's case folding and the results count format. */
  locale?: string;
  /**
   * Direction of the popover. It renders in a portal, outside your layout, so it cannot
   * inherit `dir`. Default: the trigger's direction, read after the trigger mounts. Pass it if the
   * app switches direction at runtime without remounting.
   */
  dir?: "ltr" | "rtl";

  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  kinds?: Record<string, KindMeta>;
  showKindBadges?: boolean;

  renderItem?: (item: T, ctx: RenderItemContext) => ReactNode;
  renderTrigger?: (ctx: RenderTriggerContext<T>) => ReactNode;
  renderEmpty?: (ctx: RenderEmptyContext) => ReactNode;

  disabled?: boolean;
  /**
   * @deprecated Use `labels.triggerPlaceholder` / `labels.searchLabel`. When set it wins over
   * both and also names the trigger button.
   */
  triggerLabel?: string;
  id?: string;
  className?: string;

  ref?: Ref<EntityPickerHandle>;
}

export interface SinglePickerProps<T extends EntityLike>
  extends CommonPickerProps<T> {
  mode?: "single";
  value: T | null;
  onChange: (value: T | null) => void;
}

export interface MultiPickerProps<T extends EntityLike>
  extends CommonPickerProps<T> {
  mode: "multi";
  value: T[];
  onChange: (value: T[]) => void;
}

export type EntityPickerProps<T extends EntityLike> =
  | SinglePickerProps<T>
  | MultiPickerProps<T>;

export interface EntityPickerHandle {
  focus(): void;
  open(): void;
  close(): void;
  clear(): void;
}
