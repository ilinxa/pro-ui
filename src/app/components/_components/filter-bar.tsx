"use client";

import { SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { ActiveChips } from "./active-chips";
import type { FilterFacets, FilterState } from "./filter-utils";

type Props = {
  filters: FilterState;
  facets: FilterFacets;
  activeCount: number;
  onSearchChange: (q: string) => void;
  onOpenSheet: () => void;
  onRemoveListValue: <K extends "categories" | "stacks" | "tags" | "status">(
    key: K,
    value: FilterState[K][number],
  ) => void;
  className?: string;
};

export function FilterBar({
  filters,
  facets,
  activeCount,
  onSearchChange,
  onOpenSheet,
  onRemoveListValue,
  className,
}: Props) {
  const facetCount = activeCount - (filters.q.trim() === "" ? 0 : 1);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={filters.q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search components by name, tag, or description…"
            aria-label="Search components"
            className="h-10 bg-card pl-9 pr-9"
          />
          {filters.q !== "" ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <XIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onOpenSheet}
          className="h-10 gap-2 sm:flex-none"
        >
          <SlidersHorizontalIcon className="h-4 w-4" aria-hidden />
          <span>Filters</span>
          {facetCount > 0 ? (
            <span
              aria-label={`${facetCount} active`}
              className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground tabular-nums"
            >
              {facetCount}
            </span>
          ) : null}
        </Button>
      </div>
      <ActiveChips
        filters={filters}
        facets={facets}
        onClearQ={() => onSearchChange("")}
        onRemove={onRemoveListValue}
      />
    </div>
  );
}
