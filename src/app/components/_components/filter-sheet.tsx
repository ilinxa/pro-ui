"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  ComponentCategorySlug,
  ComponentStatus,
} from "@/registry/types";

import {
  CheckboxFacet,
  CommandFacet,
  ToggleFacet,
} from "./facet-section";
import type { FilterFacets, FilterState } from "./filter-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  facets: FilterFacets;
  onToggle: <K extends "categories" | "stacks" | "tags" | "status">(
    key: K,
    value: FilterState[K][number],
  ) => void;
  onSetStatus: (next: ComponentStatus[]) => void;
  onClearAll: () => void;
  hasActive: boolean;
};

export function FilterSheet({
  open,
  onOpenChange,
  filters,
  facets,
  onToggle,
  onSetStatus,
  onClearAll,
  hasActive,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-[24rem] flex-col gap-0 p-0 sm:max-w-[24rem]"
      >
        <SheetHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b border-border px-5 py-4">
          <SheetTitle className="text-base font-semibold">Filters</SheetTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            disabled={!hasActive}
            className="h-7 px-2 text-xs"
          >
            Clear all
          </Button>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-5 px-5 py-5">
            <CheckboxFacet<ComponentCategorySlug>
              title="Category"
              options={facets.categories}
              selected={filters.categories}
              onToggle={(value) => onToggle("categories", value)}
            />
            <Separator />
            <CheckboxFacet
              title="Stack"
              options={facets.stacks}
              selected={filters.stacks}
              onToggle={(value) => onToggle("stacks", value)}
            />
            <Separator />
            <CommandFacet
              title="Tags"
              options={facets.tags}
              selected={filters.tags}
              onToggle={(value) => onToggle("tags", value)}
              searchPlaceholder="Filter tags…"
            />
            <Separator />
            <ToggleFacet<ComponentStatus>
              title="Status"
              options={facets.statuses}
              selected={filters.status}
              onChange={onSetStatus}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
