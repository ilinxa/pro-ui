"use client";

import { XIcon } from "lucide-react";

import { CATEGORIES } from "@/registry/categories";
import { cn } from "@/lib/utils";

import type { FilterFacets, FilterState } from "./filter-utils";

type ListKey = "categories" | "stacks" | "tags" | "status";

type ChipDescriptor = {
  key: string;
  prefix: string;
  label: string;
  onRemove: () => void;
};

type Props = {
  filters: FilterState;
  facets: FilterFacets;
  onClearQ: () => void;
  onRemove: <K extends ListKey>(
    key: K,
    value: FilterState[K][number],
  ) => void;
  className?: string;
};

export function ActiveChips({
  filters,
  facets,
  onClearQ,
  onRemove,
  className,
}: Props) {
  const chips: ChipDescriptor[] = [];

  if (filters.q.trim() !== "") {
    chips.push({
      key: `q:${filters.q}`,
      prefix: "search",
      label: filters.q,
      onRemove: onClearQ,
    });
  }

  for (const value of filters.categories) {
    const meta = CATEGORIES[value];
    chips.push({
      key: `cat:${value}`,
      prefix: "category",
      label: meta?.label ?? value,
      onRemove: () => onRemove("categories", value),
    });
  }

  for (const value of filters.stacks) {
    chips.push({
      key: `stack:${value}`,
      prefix: "stack",
      label:
        facets.stacks.find((s) => s.value === value)?.label ?? value,
      onRemove: () => onRemove("stacks", value),
    });
  }

  for (const value of filters.tags) {
    chips.push({
      key: `tag:${value}`,
      prefix: "tag",
      label: facets.tags.find((t) => t.value === value)?.label ?? value,
      onRemove: () => onRemove("tags", value),
    });
  }

  for (const value of filters.status) {
    chips.push({
      key: `status:${value}`,
      prefix: "status",
      label: value,
      onRemove: () => onRemove("status", value),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        className,
      )}
      role="list"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <Chip key={chip.key} chip={chip} />
      ))}
    </div>
  );
}

function Chip({ chip }: { chip: ChipDescriptor }) {
  return (
    <span
      role="listitem"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-background py-0.5 pl-2 pr-1 text-xs text-foreground"
    >
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {chip.prefix}
      </span>
      <span className="font-medium">{chip.label}</span>
      <button
        type="button"
        onClick={chip.onRemove}
        aria-label={`Remove ${chip.prefix} filter ${chip.label}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <XIcon className="h-3 w-3" aria-hidden />
      </button>
    </span>
  );
}
