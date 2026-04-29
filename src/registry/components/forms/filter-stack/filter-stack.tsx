"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type {
  FilterStackHandle,
  FilterStackProps,
  FilterValue,
} from "./types";
import { isCategoryEmpty } from "./lib/default-is-empty";
import { validateCategorySchema } from "./lib/validate-schema";
import { useFilteredItems } from "./hooks/use-filtered-items";
import { useTextBuffer } from "./hooks/use-text-buffer";
import { FilterSection } from "./parts/filter-section";
import { FilterStackFooter } from "./parts/filter-stack-footer";
import { cn } from "@/lib/utils";

const SCHEMA_INSTABILITY_THRESHOLD = 5;

export function FilterStack<T = unknown>(props: FilterStackProps<T>) {
  const {
    items,
    categories,
    values,
    onChange,
    onFilteredChange,
    showClearAll = true,
    clearAllLabel = "Clear all",
    ariaLabel,
    className,
    ref,
  } = props;

  const valuesRef = useRef(values);
  const categoriesRef = useRef(categories);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valuesRef.current = values;
    categoriesRef.current = categories;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    validateCategorySchema(
      categories as ReadonlyArray<import("./types").FilterCategory<unknown>>,
    );
  }, [categories]);

  const schemaInstabilityRef = useRef({
    last: categories,
    count: 0,
    warned: false,
  });
  useEffect(() => {
    const tracker = schemaInstabilityRef.current;
    if (tracker.last === categories) {
      tracker.count = 0;
      return;
    }
    tracker.last = categories;
    tracker.count++;
    if (
      tracker.count > SCHEMA_INSTABILITY_THRESHOLD &&
      !tracker.warned &&
      process.env.NODE_ENV !== "production"
    ) {
      tracker.warned = true;
      console.warn(
        "[filter-stack] `categories` prop is changing every render. " +
          "Wrap with `useMemo` or hoist to module scope to avoid re-computation.",
      );
    }
  }, [categories]);

  const commitText = useCallback((id: string, value: string) => {
    const current = valuesRef.current;
    onChangeRef.current({ ...current, [id]: value });
  }, []);

  const textBuffer = useTextBuffer(commitText);

  useFilteredItems(items, categories, values, onFilteredChange);

  const isEmpty = useCallback((): boolean => {
    for (const cat of categoriesRef.current) {
      if (!isCategoryEmpty(cat, valuesRef.current[cat.id])) return false;
    }
    return true;
  }, []);

  const clear = useCallback(
    (categoryId: string) => {
      const cat = categoriesRef.current.find((c) => c.id === categoryId);
      if (!cat) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[filter-stack] clear("${categoryId}") — unknown category id; no-op.`,
          );
        }
        return;
      }
      if (cat.type === "text") textBuffer.cancel(categoryId);
      const next = { ...valuesRef.current };
      delete next[categoryId];
      if (cat.type === "checkbox-list" && cat.modeToggle) {
        delete next[`${categoryId}__mode`];
      }
      onChangeRef.current(next);
    },
    [textBuffer],
  );

  const clearAll = useCallback(() => {
    textBuffer.cancelAll();
    const current = valuesRef.current;
    const next: Record<string, FilterValue> = {};
    for (const key of Object.keys(current)) {
      if (key.endsWith("__mode")) next[key] = current[key];
    }
    onChangeRef.current(next);
  }, [textBuffer]);

  useImperativeHandle(
    ref,
    (): FilterStackHandle => ({ clearAll, clear, isEmpty }),
    [clearAll, clear, isEmpty],
  );

  let allEmpty = true;
  for (const cat of categories) {
    if (!isCategoryEmpty(cat, values[cat.id])) {
      allEmpty = false;
      break;
    }
  }

  return (
    <form
      noValidate
      role="region"
      aria-label={ariaLabel}
      className={cn("flex flex-col gap-3", className)}
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex flex-col gap-3">
        {categories.map((cat) => (
          <FilterSection<T>
            key={cat.id}
            category={cat}
            values={values}
            onChange={onChange}
            items={items}
            textBuffer={textBuffer}
          />
        ))}
      </div>
      {showClearAll ? (
        <FilterStackFooter
          onClearAll={clearAll}
          disabled={allEmpty}
          label={clearAllLabel}
        />
      ) : null}
    </form>
  );
}
