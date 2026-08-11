"use client";

import { Switch } from "@/components/ui/switch";
import type { FilterValue, ToggleFilter } from "../types";

interface FilterToggleProps<T> {
  category: ToggleFilter<T>;
  values: Record<string, FilterValue>;
  onChange: (values: Record<string, FilterValue>) => void;
  fieldId: string;
}

export function FilterToggle<T>({
  category,
  values,
  onChange,
  fieldId,
}: FilterToggleProps<T>) {
  const checked = values[category.id] === true;
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <span id={`${fieldId}-state`} className="text-sm text-foreground">
        {checked ? "On" : "Off"}
      </span>
      <Switch
        id={fieldId}
        checked={checked}
        onCheckedChange={(next) =>
          onChange({ ...values, [category.id]: next })
        }
        aria-labelledby={fieldId}
      />
    </div>
  );
}
