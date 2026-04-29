"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldRendererProps } from "../types";
import { formatFieldValue } from "../lib/format-value";

interface BuiltInFieldProps extends FieldRendererProps {
  onBlur: () => void;
  required: boolean;
}

export function FieldSelect({
  value,
  onChange,
  field,
  mode,
  disabled,
  error,
  fieldId,
  errorId,
  required,
}: BuiltInFieldProps) {
  if (mode === "read") {
    return (
      <span className="block truncate text-sm">
        {formatFieldValue(field, value)}
      </span>
    );
  }
  const stringValue =
    value === undefined || value === null ? "" : String(value);
  return (
    <Select
      value={stringValue}
      disabled={disabled}
      onValueChange={(next) => onChange(next)}
    >
      <SelectTrigger
        id={fieldId}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="w-full"
      >
        <SelectValue placeholder={field.placeholder ?? "Select..."} />
      </SelectTrigger>
      <SelectContent>
        {(field.options ?? []).map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
