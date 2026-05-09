"use client";

import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { InfiniteLoader } from "./parts/infinite-loader";
import { MagazineTower } from "./parts/magazine-tower";
import {
  DEFAULT_GRID_LABELS,
  type GridLayoutItemSlot,
  type GridLayoutNewsProps,
} from "./types";

/**
 * GridLayoutNews01 — slot-based magazine layout. Composes the news-domain
 * components (page-hero / filter-bar / content-cards / category-cloud /
 * newsletter-card) at the consumer level via slots; the layout itself
 * imports none of them at runtime.
 *
 * Generic over `T` — the item shape. Pair with `useMagazineFilter` for
 * filter + page state, or drive `displayedItems` / `featuredItem` /
 * `hasMore` / `isLoading` / `onLoadMore` directly.
 */
export function GridLayoutNews01<T>(props: GridLayoutNewsProps<T>) {
  const {
    displayedItems,
    featuredItem,
    hasMore = false,
    isLoading = false,
    onLoadMore,
    renderItem,
    renderItemArgs,
    renderFeatured,
    hero,
    filterBar,
    sidebar,
    emptyState,
    labels: labelsProp,
    className,
    mainClassName,
    sidebarClassName,
  } = props;

  const labels = useMemo(
    () => ({ ...DEFAULT_GRID_LABELS, ...labelsProp }),
    [labelsProp],
  );

  // Resolve the renderItem callback — prefers `renderItemArgs` (object shape,
  // forward-compatible). Falls back to deprecated `renderItem` (positional)
  // with a dev-only console.warn. F-cross-12 transition; v0.2 will remove
  // the positional shape and rename `renderItemArgs` → `renderItem`.
  // Computed inline; React Compiler memoizes automatically.
  const renderItemResolved: (
    item: T,
    slot: GridLayoutItemSlot,
    index: number,
  ) => ReactNode = renderItemArgs
    ? (item, slot, index) => renderItemArgs({ item, slot, index })
    : renderItem
      ? (() => {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "[grid-layout-news-01] `renderItem` positional signature `(item, slot)` is @deprecated. Use `renderItemArgs({ item, slot, index })` for the object-shape signature; v0.2 will remove the positional shape and rename `renderItemArgs` → `renderItem`.",
            );
          }
          return (item, slot) => renderItem(item, slot);
        })()
      : (() => {
          if (process.env.NODE_ENV !== "production") {
            console.error(
              "[grid-layout-news-01] At least one of `renderItem` or `renderItemArgs` must be provided.",
            );
          }
          return () => null;
        })();

  const hasContent = displayedItems.length > 0 || featuredItem !== undefined;
  const isEmpty = !hasContent && !isLoading;

  const showSidebar = sidebar !== undefined;

  return (
    <div className={cn("w-full", className)}>
      {hero ? <div className="mb-12">{hero}</div> : null}

      {filterBar ? <div className="mb-8">{filterBar}</div> : null}

      {isEmpty ? (
        <div className="py-20 text-center">
          {emptyState ?? (
            <p className="text-muted-foreground">{labels.emptyStateText}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <div
            className={cn(
              "space-y-8",
              showSidebar ? "col-span-12 lg:col-span-8" : "col-span-12",
              mainClassName,
            )}
          >
            {featuredItem !== undefined ? (
              <div>
                {renderFeatured
                  ? renderFeatured(featuredItem)
                  : renderItemResolved(featuredItem, "large", 0)}
              </div>
            ) : null}

            <MagazineTower items={displayedItems} renderItem={renderItemResolved} />

            <InfiniteLoader
              hasMore={hasMore}
              isLoading={isLoading}
              onLoadMore={onLoadMore}
              hasItems={hasContent}
              labels={labels}
            />
          </div>

          {showSidebar ? (
            <aside
              className={cn(
                "col-span-12 lg:col-span-4",
                sidebarClassName,
              )}
            >
              <div className="sticky top-24 space-y-8">{sidebar}</div>
            </aside>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default GridLayoutNews01;
