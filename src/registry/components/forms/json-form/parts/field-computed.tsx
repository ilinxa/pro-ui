"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { FieldRenderer } from "../types";
import { useComputed } from "../hooks/use-computed";

export const FieldComputed: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  ariaProps,
}) => {
  const computed = useComputed(field);
  const display = computed == null ? "" : String(computed);

  // Push computed value into RHF state so consumers can read it via
  // `formApi.getValues()`. Skipped in editable mode (consumer types over).
  useEffect(() => {
    if (field.editable) return;
    if (value !== computed) onChange(computed);
  }, [computed, field.editable, value, onChange]);

  if (field.editable) {
    return (
      <Input
        id={ariaProps.id}
        type="text"
        value={typeof value === "string" ? value : display}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={field.placeholder}
        aria-required={ariaProps["aria-required"]}
        aria-invalid={ariaProps["aria-invalid"]}
        aria-disabled={ariaProps["aria-disabled"]}
        aria-describedby={ariaProps["aria-describedby"]}
      />
    );
  }

  return (
    <output
      id={ariaProps.id}
      aria-labelledby={ariaProps.labelledBy}
      aria-describedby={ariaProps["aria-describedby"]}
      data-jsonform-computed
      className="inline-flex h-8 w-full items-center rounded-lg border border-dashed border-input bg-muted/30 px-2.5 text-sm text-muted-foreground"
    >
      {display || (
        <span className="text-muted-foreground/60">—</span>
      )}
    </output>
  );
};

export default FieldComputed;
