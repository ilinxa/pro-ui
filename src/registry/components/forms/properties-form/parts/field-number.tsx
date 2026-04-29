"use client";

import { Input } from "@/components/ui/input";
import type { FieldRendererProps } from "../types";
import { formatFieldValue } from "../lib/format-value";

interface BuiltInFieldProps extends FieldRendererProps {
  onBlur: () => void;
  required: boolean;
}

export function FieldNumber({
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
      <span className="block truncate text-right font-mono text-sm tabular-nums">
        {formatFieldValue(field, value)}
      </span>
    );
  }
  const inputValue =
    value === undefined || value === null
      ? ""
      : typeof value === "number"
        ? Number.isFinite(value)
          ? String(value)
          : ""
        : String(value);
  return (
    <Input
      id={fieldId}
      type="number"
      inputMode="decimal"
      value={inputValue}
      placeholder={field.placeholder}
      disabled={disabled}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") {
          onChange(undefined);
          return;
        }
        const parsed = Number(raw);
        onChange(Number.isNaN(parsed) ? raw : parsed);
      }}
      onBlur={onBlur}
      aria-required={required || undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className="text-right font-mono tabular-nums"
    />
  );
}
