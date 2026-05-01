# grid-layout-news-01 — procomp plan

> Stage 2.

## Final API

```ts
// types.ts

import type { ReactNode } from "react";

/** Slot identifier for `renderItem`. Layout always renders one or more `medium` slots; `large` is the lead slot in the main column when content allows. */
export type GridLayoutItemSlot = "large" | "medium";

export interface GridLayoutLabels {
  /** Loader text (visually hidden but in aria-live region). Default: 'Loading more items…'. */
  loadingLabel?: string;
  /** Terminal end-of-list text. Default: 'All items shown'. */
  endOfListText?: string;
  /** Empty state body. Default: 'No items to show.'. */
  emptyStateText?: string;
}

export interface GridLayoutNewsProps<T> {
  /** The current page of items (already filtered + paged by the consumer or `useMagazineFilter`). */
  displayedItems: T[];
  /** Optional featured item rendered above the main column on page 1. */
  featuredItem?: T;

  /** Whether more items are available beyond the current page. */
  hasMore?: boolean;
  /** Whether `loadMore` is currently fetching. */
  isLoading?: boolean;
  /** Callback fired by IntersectionObserver when the loader sentinel enters the viewport. */
  onLoadMore?: () => void;

  /** How to render one item in a given slot. */
  renderItem: (item: T, slot: GridLayoutItemSlot) => ReactNode;
  /** How to render the featured item. Defaults to `renderItem(item, 'large')`. */
  renderFeatured?: (item: T) => ReactNode;

  /** Optional hero band rendered full-width above the filter bar. */
  hero?: ReactNode;
  /** Optional filter bar rendered above the grid. */
  filterBar?: ReactNode;
  /** Optional sidebar rendered to the right (col-span-4) of the main column. */
  sidebar?: ReactNode;

  /** Optional empty-state node rendered when displayedItems is empty AND not loading. */
  emptyState?: ReactNode;

  labels?: GridLayoutLabels;
  className?: string;
  mainClassName?: string;
  sidebarClassName?: string;
}

export interface UseMagazineFilterArgs<T> {
  /** Source items (consumer's full dataset). */
  items: T[];
  /** Per-page size. Default: 6. */
  pageSize?: number;
  /** Predicate to derive the featured item (returns true for the one to feature). Default: none — first page does not feature. */
  isFeatured?: (item: T) => boolean;
  /** Filter / search predicate. Default: include everything. */
  filterPredicate?: (item: T) => boolean;
  /** Sort comparator. Default: no sort. */
  sortComparator?: (a: T, b: T) => number;
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
```

## File-by-file plan

```
src/registry/components/layout/grid-layout-news-01/
├── grid-layout-news-01.tsx        # 1
├── parts/
│   ├── magazine-tower.tsx         # 2 — main column's tower
│   └── infinite-loader.tsx        # 3 — loader region with aria-live
├── hooks/
│   ├── use-infinite-scroll.ts     # 4 — IntersectionObserver
│   └── use-magazine-filter.ts     # 5 — companion filter+page state
├── types.ts                       # 6
├── dummy-data.ts                  # 7
├── demo.tsx                       # 8
├── usage.tsx                      # 9
├── meta.ts                        # 10
└── index.ts                       # 11
```

### 1. `grid-layout-news-01.tsx` — root composer
- `"use client"` (no React state in the layout itself, but wrapped under client because it's commonly used in client trees).
- Generic `<T,>` typed function.
- Renders: optional hero → optional filterBar → 12-col grid → optional sidebar.
- 12-col grid: main column = `col-span-8` (or `col-span-12` if no sidebar), sidebar = `col-span-4`.
- Inside main column: optional featured (renderFeatured ?? renderItem(item, 'large')) → MagazineTower → InfiniteLoader.
- Empty state: when displayedItems.length === 0 && !isLoading, render `emptyState` slot or the default labeled fallback.

### 2. `parts/magazine-tower.tsx`
- Receives `items` array + `renderItem` callback + `labels`.
- Renders:
  - First item: `renderItem(items[0], 'large')` (full-width).
  - Items 1-2: 2-col grid, both `medium`.
  - Items 3+: 3-col grid, all `medium`.
- Uses CSS grid; `gap-6` between sections.

### 3. `parts/infinite-loader.tsx`
- Receives `hasMore` / `isLoading` / `onLoadMore` / `labels`.
- Uses `useInfiniteScroll` hook for the IntersectionObserver.
- Renders:
  - Loader when `isLoading`: 3 bouncing dots in `aria-live="polite"` region; visually hidden text label inside.
  - "All shown" when `!hasMore && displayedItems.length > 0`: small muted text in `aria-live="polite"`.
  - Otherwise: empty sentinel `<div ref={loaderRef}>` for the IntersectionObserver.

### 4. `hooks/use-infinite-scroll.ts`
- Pure hook: `useInfiniteScroll({ ref, hasMore, isLoading, onLoadMore })`.
- Wraps IntersectionObserver with cleanup on unmount.

### 5. `hooks/use-magazine-filter.ts`
- Pure hook: derives `displayedItems` / `featuredItem` / `hasMore` / `loadMore` from `items` + filter/sort/page state.
- Internal state: `currentPage` (default 1).
- Returns the args the layout expects.

### 6-11. Standard files.

## Dependencies

- `react`, `@/lib/utils`. No new deps.

## Composition pattern

Slot-based layout. Generic over `T`. Sealed-folder — the layout itself imports nothing from sibling registry components. Composition happens at the consumer level (and the demo).

## Client vs server

**Client component** — IntersectionObserver requires browser APIs.

## Edge cases

| Case | Behavior |
|---|---|
| `displayedItems` empty + `isLoading` | Loader visible, no tower. |
| `displayedItems` empty + `!isLoading` + `emptyState` | Renders `emptyState` slot. |
| `displayedItems` empty + `!isLoading` + no `emptyState` | Renders `labels.emptyStateText` in muted text. |
| No `featuredItem` | Tower starts immediately with `large`. |
| No `sidebar` slot | Main column expands to `col-span-12`. |
| `hasMore=false` from start | Loader sentinel renders but never triggers; "all shown" text shows after first render. |

## Accessibility

- `<aside>` for sidebar (semantic landmark).
- Loader region `aria-live="polite"`.
- "All shown" terminal also `aria-live="polite"`.
- Focus management — no focus-stealing.

## Verification checklist

- tsc / lint / build clean.
- SSR 200 with all 3 demo tabs.
- Visual: tower renders correctly; sidebar sticks; loader fires on scroll-near-bottom.

## Risks

1. **Generic typing across slot model** — `renderItem`'s `item` parameter must narrow to `T` correctly. Test in tsc.
2. **`useMagazineFilter` simplicity vs power** — too simple = consumers replace; too complex = the layout duplicates filter-bar's job. Stay simple in v0.1; add knobs as real consumers ask.
