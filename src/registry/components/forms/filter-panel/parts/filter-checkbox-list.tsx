"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type {
  CheckboxListFilter,
  FilterMode,
  FilterValue,
} from "../types";
import { SoloButton } from "./solo-button";

interface FilterCheckboxListProps<T> {
  category: CheckboxListFilter<T>;
  values: Record<string, FilterValue>;
  onChange: (values: Record<string, FilterValue>) => void;
  fieldId: string;
}

function asStringArray(value: FilterValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export function FilterCheckboxList<T>({
  category,
  values,
  onChange,
  fieldId,
}: FilterCheckboxListProps<T>) {
  const selected = asStringArray(values[category.id]);
  const selectedSet = new Set(selected);
  const showSolo = category.showSoloButtons === true;

  const handleToggle = (optionValue: string, checked: boolean) => {
    const next = checked
      ? [...selected, optionValue]
      : selected.filter((v) => v !== optionValue);
    onChange({ ...values, [category.id]: next });
  };

  const handleSolo = (optionValue: string) => {
    if (category.modeToggle) {
      const existing = values[`${category.id}__mode`];
      const fallbackMode: FilterMode = category.defaultMode ?? "union";
      const mode: FilterMode =
        existing === "union" || existing === "intersection"
          ? existing
          : fallbackMode;
      onChange({
        ...values,
        [category.id]: [optionValue],
        [`${category.id}__mode`]: mode,
      });
    } else {
      onChange({ ...values, [category.id]: [optionValue] });
    }
  };

  return (
    <ul
      role="group"
      aria-labelledby={fieldId}
      className="flex flex-col gap-1"
    >
      {category.options.map((opt) => {
        const optionId = `${fieldId}-opt-${opt.value}`;
        const checked = selectedSet.has(opt.value);
        return (
          <li
            key={opt.value}
            className="group flex items-center justify-between gap-2 rounded-md px-1 py-0.5 hover:bg-muted/40"
          >
            <label
              htmlFor={optionId}
              className="flex flex-1 cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                id={optionId}
                checked={checked}
                onCheckedChange={(state) => handleToggle(opt.value, state === true)}
              />
              <span className="truncate text-foreground">{opt.label}</span>
            </label>
            {showSolo ? (
              <span className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <SoloButton
                  optionLabel={opt.label}
                  onClick={() => handleSolo(opt.value)}
                />
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
