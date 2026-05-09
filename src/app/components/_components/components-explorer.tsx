"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ORDERED_CATEGORIES } from "@/registry/categories";
import type { ComponentMeta } from "@/registry/types";

import { ComponentCard } from "./component-card";
import { FilterBar } from "./filter-bar";
import { FilterSheet } from "./filter-sheet";
import {
  applyFilters,
  isEmpty,
  type FilterFacets,
} from "./filter-utils";
import { useFilters } from "./use-filters";

type Props = {
  entries: ComponentMeta[];
  facets: FilterFacets;
};

export function ComponentsExplorer({ entries, facets }: Props) {
  const {
    filters,
    setFilter,
    toggleListValue,
    removeListValue,
    clearAll,
    hasActive,
    activeCount,
  } = useFilters();
  const [sheetOpen, setSheetOpen] = useState(false);

  const deferredFilters = useDeferredValue(filters);
  const visible = useMemo(
    () => applyFilters(entries, deferredFilters),
    [entries, deferredFilters],
  );

  const groupedView = isEmpty(deferredFilters);
  const totalCount = entries.length;
  const visibleCount = visible.length;
  const categoriesCount = facets.categories.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {groupedView ? (
          <>
            <span>
              {totalCount} component{totalCount === 1 ? "" : "s"}
            </span>
            <span aria-hidden>·</span>
            <span>
              {categoriesCount} categor{categoriesCount === 1 ? "y" : "ies"}
            </span>
          </>
        ) : (
          <span aria-live="polite">
            {visibleCount} of {totalCount} match
            {visibleCount === 1 ? "" : "es"}
          </span>
        )}
      </div>

      <FilterBar
        filters={filters}
        facets={facets}
        activeCount={activeCount}
        onSearchChange={(q) => setFilter("q", q)}
        onOpenSheet={() => setSheetOpen(true)}
        onRemoveListValue={removeListValue}
      />

      {groupedView ? (
        <GroupedGrid entries={entries} />
      ) : visible.length === 0 ? (
        <EmptyState onClear={clearAll} />
      ) : (
        <FlatGrid entries={visible} />
      )}

      <FilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filters={filters}
        facets={facets}
        onToggle={toggleListValue}
        onSetStatus={(next) => setFilter("status", next)}
        onClearAll={clearAll}
        hasActive={hasActive}
      />
    </div>
  );
}

function GroupedGrid({ entries }: { entries: ComponentMeta[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, ComponentMeta[]>();
    for (const meta of entries) {
      const list = map.get(meta.category) ?? [];
      list.push(meta);
      map.set(meta.category, list);
    }
    return ORDERED_CATEGORIES.map((cat) => ({
      category: cat,
      list: map.get(cat.slug) ?? [],
    })).filter((g) => g.list.length > 0);
  }, [entries]);

  if (grouped.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        No components yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {grouped.map(({ category, list }) => (
        <section key={category.slug}>
          <div className="mb-4 flex items-baseline justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {category.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {list.length} item{list.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((meta) => (
              <ComponentCard key={meta.slug} meta={meta} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FlatGrid({ entries }: { entries: ComponentMeta[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((meta) => (
        <ComponentCard key={meta.slug} meta={meta} />
      ))}
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border bg-card px-6 py-16 text-center">
      <p className="text-sm font-medium text-foreground">
        No components match your filters.
      </p>
      <p className="max-w-md text-xs text-muted-foreground">
        Try removing a filter, clearing the search, or resetting everything.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onClear}>
        Clear all filters
      </Button>
    </div>
  );
}
