"use client";

import { Textarea } from "@/components/ui/textarea";
import type { FieldRendererProps } from "../types";

interface BuiltInFieldProps extends FieldRendererProps {
  onBlur: () => void;
  required: boolean;
}

export function FieldTextarea({
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
  const stringValue =
    value === undefined || value === null
      ? ""
      : typeof value === "string"
        ? value
        : String(value);
  if (mode === "read") {
    if (stringValue.length === 0) {
      return <span className="block text-sm text-muted-foreground">—</span>;
    }
    return (
      <p className="block max-h-48 overflow-y-auto text-sm whitespace-pre-wrap">
        {stringValue}
      </p>
    );
  }
  return (
    <Textarea
      id={fieldId}
      value={stringValue}
      placeholder={field.placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      aria-required={required || undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      rows={4}
    />
  );
}
