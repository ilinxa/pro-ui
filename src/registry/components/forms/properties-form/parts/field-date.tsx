"use client";

import type { FieldRendererProps } from "../types";
import { formatFieldValue } from "../lib/format-value";
import { cn } from "@/lib/utils";

interface BuiltInFieldProps extends FieldRendererProps {
  onBlur: () => void;
  required: boolean;
}

export function FieldDate({
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
      <span className="block font-mono text-sm">
        {formatFieldValue(field, value)}
      </span>
    );
  }
  const inputValue =
    typeof value === "string"
      ? value
      : value instanceof Date && !Number.isNaN(value.getTime())
        ? value.toISOString().slice(0, 10)
        : "";
  return (
    <input
      id={fieldId}
      type="date"
      value={inputValue}
      placeholder={field.placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      aria-required={required || undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 font-mono text-sm transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:bg-input/30 dark:disabled:bg-input/80",
      )}
    />
  );
}
