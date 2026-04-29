"use client";

import { Input } from "@/components/ui/input";
import type { FieldRendererProps } from "../types";
import { formatFieldValue } from "../lib/format-value";

interface BuiltInFieldProps extends FieldRendererProps {
  onBlur: () => void;
  required: boolean;
}

export function FieldString({
  value,
  onChange,
  field,
  mode,
  disabled,
  error,
  fieldId,
  errorId,
  onBlur,
  required,
}: BuiltInFieldProps) {
  if (mode === "read") {
    return (
      <span className="block truncate text-sm">
        {formatFieldValue(field, value)}
      </span>
    );
  }
  const stringValue = typeof value === "string" ? value : value == null ? "" : String(value);
  return (
    <Input
      id={fieldId}
      type="text"
      value={stringValue}
      placeholder={field.placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      aria-required={required || undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    />
  );
}
