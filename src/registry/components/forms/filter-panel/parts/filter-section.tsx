"use client";

import { useId } from "react";
import type {
  FilterCategory,
  FilterMode,
  FilterValue,
} from "../types";
import { isCategoryEmpty } from "../lib/default-is-empty";
import { ClearButton } from "./clear-button";
import { ModeToggle } from "./mode-toggle";
import { FilterCheckboxList } from "./filter-checkbox-list";
import { FilterToggle } from "./filter-toggle";
import { FilterText } from "./filter-text";
import { FilterCustom } from "./filter-custom";
import type { TextBufferApi } from "../hooks/use-text-buffer";
import { defaultTextIsEmpty } from "../lib/default-is-empty";

interface FilterSectionProps<T> {
  category: FilterCategory<T>;
  values: Record<string, FilterValue>;
  onChange: (values: Record<string, FilterValue>) => void;
  items: ReadonlyArray<T>;
  textBuffer: TextBufferApi;
}

function readMode<T>(
  category: FilterCategory<T>,
  values: Record<string, FilterValue>,
): FilterMode {
  if (category.type !== "checkbox-list" || !category.modeToggle) return "union";
  const stored = values[`${category.id}__mode`];
  if (stored === "union" || stored === "intersection") return stored;
  return category.defaultMode ?? "union";
}

export function FilterSection<T>({
  category,
  values,
  onChange,
  items,
  textBuffer,
}: FilterSectionProps<T>) {
  const reactId = useId();
  const fieldId = `${reactId}-${category.id}`;
  const descriptionId = category.description ? `${fieldId}-desc` : undefined;
  const empty = isCategoryEmpty(category, values[category.id]);
  const showClear = !empty;

  const handleClear = () => {
    if (category.type === "text") textBuffer.cancel(category.id);
    const next = { ...values };
    delete next[category.id];
    if (category.type === "checkbox-list" && category.modeToggle) {
      delete next[`${category.id}__mode`];
    }
    onChange(next);
  };

  return (
    <fieldset className="flex flex-col gap-2 rounded-md border border-border bg-card/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend
          id={fieldId}
          className="px-1 text-sm font-medium text-foreground"
        >
          {category.label}
        </legend>
        <div className="flex items-center gap-2">
          {category.type === "checkbox-list" && category.modeToggle ? (
            <ModeToggle
              value={readMode(category, values)}
              ariaLabel={`${category.label} mode`}
              onChange={(next) =>
                onChange({ ...values, [`${category.id}__mode`]: next })
              }
            />
          ) : null}
          {showClear ? (
            <ClearButton
              onClick={handleClear}
              ariaLabel={`Clear ${category.label}`}
            />
          ) : null}
        </div>
      </div>
      {category.description ? (
        <p id={descriptionId} className="px-1 text-xs text-muted-foreground">
          {category.description}
        </p>
      ) : null}
      {(() => {
        switch (category.type) {
          case "checkbox-list":
            return (
              <FilterCheckboxList
                category={category}
                values={values}
                onChange={onChange}
                fieldId={fieldId}
              />
            );
          case "toggle":
            return (
              <FilterToggle
                category={category}
                values={values}
                onChange={onChange}
                fieldId={fieldId}
              />
            );
          case "text": {
            const bufferValue = textBuffer.buffer[category.id];
            const debounceMs = category.debounceMs ?? 250;
            return (
              <FilterText
                category={category}
                values={values}
                onChange={onChange}
                fieldId={fieldId}
                descriptionId={descriptionId}
                bufferValue={bufferValue}
                onBufferChange={(v) =>
                  textBuffer.setBuffer(category.id, v, debounceMs)
                }
                onFlush={() => {
                  textBuffer.flush(category.id);
                  if (
                    bufferValue !== undefined &&
                    defaultTextIsEmpty(bufferValue) &&
                    typeof values[category.id] === "string" &&
                    !defaultTextIsEmpty(values[category.id])
                  ) {
                    onChange({ ...values, [category.id]: "" });
                  }
                }}
                onCancel={() => textBuffer.cancel(category.id)}
              />
            );
          }
          case "custom":
            return (
              <FilterCustom
                category={category}
                values={values}
                onChange={onChange}
                items={items}
                fieldId={fieldId}
              />
            );
        }
      })()}
    </fieldset>
  );
}
