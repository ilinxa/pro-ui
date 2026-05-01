"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CategoryChip } from "./parts/category-chip";
import type {
  CategoryCloudItem,
  CategoryCloudProps,
  NormalizedItem,
} from "./types";

const defaultFormatCount = (count: number): string => ` (${count})`;

const normalizeItems = (
  items: CategoryCloudItem[] | string[],
): NormalizedItem[] =>
  items.map((entry) => {
    if (typeof entry === "string") {
      return { value: entry, label: entry, count: undefined };
    }
    return {
      value: entry.value,
      label: entry.label ?? entry.value,
      count: entry.count,
    };
  });

/**
 * CategoryCloud01 — always-visible flex-wrap of clickable category chips
 * with optional counts. Single-select, controlled-or-uncontrolled.
 *
 * Pass `string[]` as shorthand for items without counts:
 *   <CategoryCloud01 items={["All", "Tech", "Design"]} />
 *
 * Or full form for counts + display labels:
 *   <CategoryCloud01 items={[{ value: "tech", label: "Technology", count: 12 }]} />
 */
function CategoryCloud01Impl(props: CategoryCloudProps) {
  const {
    items,
    value: controlledValue,
    defaultValue = null,
    onChange,
    toggleable = true,
    title,
    headingAs = "h3",
    formatCount = defaultFormatCount,
    ariaLabel,
    className,
    titleClassName,
  } = props;

  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const normalized = useMemo(() => normalizeItems(items), [items]);

  const handleClick = useCallback(
    (next: string) => {
      const resolved =
        toggleable && value === next ? null : next;
      if (!isControlled) setInternalValue(resolved);
      onChange?.(resolved);
    },
    [isControlled, onChange, toggleable, value],
  );

  const HeadingTag = headingAs;
  const groupLabel = ariaLabel ?? title ?? "Categories";

  return (
    <div className={className}>
      {title ? (
        <HeadingTag
          className={cn(
            "mb-4 border-b border-border pb-2 font-serif text-lg font-bold text-foreground",
            titleClassName,
          )}
        >
          {title}
        </HeadingTag>
      ) : null}
      <div
        role="group"
        aria-label={groupLabel}
        className="flex flex-wrap gap-2"
      >
        {normalized.map((item) => (
          <CategoryChip
            key={item.value}
            item={item}
            isActive={value === item.value}
            countLabel={item.count !== undefined ? formatCount(item.count) : ""}
            onClick={() => handleClick(item.value)}
          />
        ))}
      </div>
    </div>
  );
}

export const CategoryCloud01 = memo(CategoryCloud01Impl);
CategoryCloud01.displayName = "CategoryCloud01";

export default CategoryCloud01;
