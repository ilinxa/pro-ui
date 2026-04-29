"use client";

import { Input } from "@/components/ui/input";
import type { FilterValue, TextFilter } from "../types";

interface FilterTextProps<T> {
  category: TextFilter<T>;
  values: Record<string, FilterValue>;
  onChange: (values: Record<string, FilterValue>) => void;
  fieldId: string;
  bufferValue: string | undefined;
  onBufferChange: (value: string) => void;
  onFlush: () => void;
  onCancel: () => void;
  descriptionId?: string;
}

export function FilterText<T>({
  category,
  values,
  onChange,
  fieldId,
  bufferValue,
  onBufferChange,
  onFlush,
  onCancel,
  descriptionId,
}: FilterTextProps<T>) {
  const propValue =
    typeof values[category.id] === "string"
      ? (values[category.id] as string)
      : "";
  const inputValue = bufferValue !== undefined ? bufferValue : propValue;

  return (
    <Input
      id={fieldId}
      type="text"
      value={inputValue}
      placeholder={category.placeholder}
      aria-describedby={descriptionId}
      onChange={(e) => onBufferChange(e.target.value)}
      onBlur={onFlush}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
          if (propValue.length > 0) {
            onChange({ ...values, [category.id]: "" });
          }
        }
      }}
    />
  );
}
