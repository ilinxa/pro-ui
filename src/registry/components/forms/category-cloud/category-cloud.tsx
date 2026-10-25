"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CategoryChip } from "./parts/category-chip";
import { resolveLocale } from "./lib/resolve-locale";
import {
  defaultCategoryCloudLabels,
  type CategoryCloudItem,
  type CategoryCloudLabels,
  type CategoryCloudProps,
  type NormalizedItem,
} from "./types";

/** Merge `labels` over the defaults — an `undefined` key never erases a default (C2). */
function resolveLabels(labels: CategoryCloudLabels | undefined): Required<CategoryCloudLabels> {
  return {
    group: labels?.group ?? defaultCategoryCloudLabels.group,
    count: labels?.count ?? defaultCategoryCloudLabels.count,
  };
}

const normalizeItems = (
  items: CategoryCloudItem[] | string[],
): NormalizedItem[] => {
  const seen = new Map<string, number>();
  return items.map((entry) => {
    const raw =
      typeof entry === "string"
        ? { value: entry, label: entry, count: undefined }
        : { value: entry.value, label: entry.label ?? entry.value, count: entry.count };
    const n = seen.get(raw.value) ?? 0;
    seen.set(raw.value, n + 1);
    // NUL separator: no real `value` contains it, so a repeat's key cannot collide with another value.
    return { ...raw, key: n === 0 ? raw.value : `${raw.value}\u0000${n}` };
  });
};

/**
 * CategoryCloud — always-visible flex-wrap of clickable category chips
 * with optional counts. Single-select, controlled-or-uncontrolled.
 *
 * Pass `string[]` as shorthand for items without counts:
 *   <CategoryCloud items={["All", "Tech", "Design"]} />
 *
 * Or full form for counts + display labels:
 *   <CategoryCloud items={[{ value: "tech", label: "Technology", count: 12 }]} />
 */
function CategoryCloudImpl(props: CategoryCloudProps) {
  const {
    items,
    value: controlledValue,
    defaultValue = null,
    onChange,
    toggleable = true,
    title,
    headingAs = "h3",
    formatCount,
    ariaLabel,
    labels: labelsProp,
    locale: localeProp,
    getHref,
    linkComponent,
    className,
    titleClassName,
  } = props;

  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const normalized = useMemo(() => normalizeItems(items), [items]);

  const labels = useMemo(() => resolveLabels(labelsProp), [labelsProp]);
  const locale = useMemo(() => resolveLocale(localeProp), [localeProp]);
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  // Dev-only: a controlled `value` that matches no item, and repeated `item.value`s — once per change
  // of the problem (an inline `items` array re-renders with the same content and must not re-warn).
  const lastWarning = useRef("");
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const values = normalized.map((n) => n.value);
    const dups = [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];
    const warnings: string[] = [];
    if (dups.length > 0) {
      warnings.push(
        `[CategoryCloud] Duplicate item values: ${dups.join(", ")}. Each value should be unique; repeated chips all read as active together.`,
      );
    }
    if (isControlled && controlledValue != null && !values.includes(controlledValue)) {
      warnings.push(
        `[CategoryCloud] Controlled value "${controlledValue}" matches no item, so no chip is active.`,
      );
    }
    const key = warnings.join("\n");
    if (key === lastWarning.current) return;
    lastWarning.current = key;
    for (const warning of warnings) console.warn(warning);
  }, [normalized, isControlled, controlledValue]);

  const handleClick = useCallback(
    (next: string, linkChip: boolean) => {
      const resolved =
        !linkChip && toggleable && value === next ? null : next;
      if (!isControlled) setInternalValue(resolved);
      onChange?.(resolved);
    },
    [isControlled, onChange, toggleable, value],
  );

  const HeadingTag = headingAs;
  const groupLabel = ariaLabel ?? title ?? labels.group;

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
        {normalized.map((item) => {
          const href = getHref?.({ value: item.value, label: item.label, count: item.count });
          const countLabel =
            item.count === undefined
              ? ""
              : formatCount
                ? formatCount(item.count)
                : labels.count(item.count, numberFormat.format(item.count === 0 ? 0 : item.count));
          return (
            <CategoryChip
              key={item.key}
              item={item}
              isActive={value === item.value}
              countLabel={countLabel}
              href={href}
              linkComponent={linkComponent}
              onClick={() => handleClick(item.value, typeof href === "string")}
            />
          );
        })}
      </div>
    </div>
  );
}

export const CategoryCloud = memo(CategoryCloudImpl);
CategoryCloud.displayName = "CategoryCloud";

export default CategoryCloud;
