"use client";

import { Check, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { FieldRendererProps } from "../types";

interface BuiltInFieldProps extends FieldRendererProps {
  onBlur: () => void;
  required: boolean;
}

export function FieldBoolean({
  value,
  onChange,
  mode,
  disabled,
  error,
  fieldId,
  errorId,
  onBlur,
  required,
}: BuiltInFieldProps) {
  const checked = value === true;
  if (mode === "read") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        {checked ? (
          <Check
            aria-label="Yes"
            className="size-4 text-primary"
          />
        ) : (
          <X
            aria-label="No"
            className="size-4 text-muted-foreground"
          />
        )}
        <span className="sr-only">{checked ? "Yes" : "No"}</span>
      </span>
    );
  }
  return (
    <Switch
      id={fieldId}
      checked={checked}
      disabled={disabled}
      onCheckedChange={(next) => onChange(next)}
      onBlur={onBlur}
      aria-required={required || undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    />
  );
}
