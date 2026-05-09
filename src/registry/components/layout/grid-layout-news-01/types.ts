import type { ReactNode } from "react";

/**
 * Slot identifier passed to `renderItem`. The layout always renders one
 * or more `medium` slots; `large` is the lead slot in the main column
 * when there are enough items.
 */
export type GridLayoutItemSlot = "large" | "medium";

export interface GridLayoutLabels {
  /** Visually-hidden loader announcement. Default: 'Loading more items…'. */
  loadingLabel?: string;
  /** Terminal end-of-list text. Default: 'All items shown'. */
  endOfListText?: string;
  /** Default empty-state body when `emptyState` slot is not provided. Default: 'No items to show.'. */
  emptyStateText?: string;
}

export interface GridLayoutNewsProps<T> {
  /** Current page of items (filtered + paged by the consumer or `useMagazineFilter`). */
  displayedItems: T[];
  /** Optional featured item rendered above the main column on page 1. */
  featuredItem?: T;

  /** Whether more items are available beyond the current page. */
  hasMore?: boolean;
  /** Whether `onLoadMore` is currently fetching. */
  isLoading?: boolean;
  /** Callback fired when the loader sentinel enters the viewport. */
  onLoadMore?: () => void;

  /**
   * How to render one item in a given slot — positional signature.
   * @deprecated Use `renderItemArgs` for the object-shape signature.
   *   Object shape extends cleanly when v0.2 widens the slot union or adds
   *   contextual args; positional `(item, slot)` is a versioning trap.
   *   This prop still works (back-compat) but emits a dev-only console.warn
   *   when called. v0.2 will remove the positional shape and rename
   *   `renderItemArgs` → `renderItem`.
   */
  renderItem?: (item: T, slot: GridLayoutItemSlot) => ReactNode;
  /**
   * How to render one item in a given slot — object-shape signature.
   * Wins over `renderItem` (deprecated positional) when both are provided.
   * Receives the slot identifier plus the item's `index` in the displayed
   * list (new context not available in the positional shape).
   *
   * Either `renderItemArgs` OR `renderItem` MUST be provided; if neither,
   * a runtime error is thrown in dev (silently no-ops in production).
   */
  renderItemArgs?: (args: {
    item: T;
    slot: GridLayoutItemSlot;
    index: number;
  }) => ReactNode;
  /** How to render the featured item. Defaults to `renderItem(featuredItem, 'large')`. */
  renderFeatured?: (item: T) => ReactNode;

  /** Optional hero band rendered full-width above the filter bar. */
  hero?: ReactNode;
  /** Optional filter bar rendered above the grid. */
  filterBar?: ReactNode;
  /** Optional sidebar rendered to the right (col-span-4) of the main column. */
  sidebar?: ReactNode;

  /** Optional empty-state node. Rendered when displayedItems is empty AND not loading. */
  emptyState?: ReactNode;

  labels?: GridLayoutLabels;
  className?: string;
  mainClassName?: string;
  sidebarClassName?: string;
}

export const DEFAULT_GRID_LABELS: Required<GridLayoutLabels> = {
  loadingLabel: "Loading more items…",
  endOfListText: "All items shown",
  emptyStateText: "No items to show.",
};

export interface UseMagazineFilterArgs<T> {
  /** Source items (consumer's full dataset). */
  items: T[];
  /** Per-page size. Default: 6. */
  pageSize?: number;
  /** Predicate to derive the featured item (returns true for the one to feature on page 1). */
  isFeatured?: (item: T) => boolean;
  /** Filter / search predicate. Default: include everything. */
  filterPredicate?: (item: T) => boolean;
  /** Sort comparator. Default: no sort. */
  sortComparator?: (a: T, b: T) => number;
  /** Artificial loading delay in ms (for demos). Default: 0. */
  simulatedLoadingMs?: number;
}

export interface UseMagazineFilterReturn<T> {
  displayedItems: T[];
  featuredItem: T | undefined;
  hasMore: boolean;
  isLoading: boolean;
  filteredCount: number;
  loadMore: () => void;
  reset: () => void;
}
