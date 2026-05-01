"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { InfiniteLoader } from "./parts/infinite-loader";
import { MagazineTower } from "./parts/magazine-tower";
import {
  DEFAULT_GRID_LABELS,
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
                  : renderItem(featuredItem, "large")}
              </div>
            ) : null}

            <MagazineTower items={displayedItems} renderItem={renderItem} />

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
