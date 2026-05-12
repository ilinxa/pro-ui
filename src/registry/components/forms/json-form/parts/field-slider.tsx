"use client";

import { Slider } from "@/components/ui/slider";
import type { FieldRenderer } from "../types";

export const FieldSlider: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  ariaProps,
}) => {
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 1;
  const numeric = typeof value === "number" ? value : Number(value);
  const safe = Number.isFinite(numeric) ? numeric : min;

  return (
    <div className="flex w-full items-center gap-3" onBlur={onBlur}>
      <Slider
        id={ariaProps.id}
        value={[safe]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(v) => onChange(firstNumber(v, min))}
        aria-labelledby={ariaProps.labelledBy}
        aria-required={ariaProps["aria-required"]}
        aria-invalid={ariaProps["aria-invalid"]}
        aria-disabled={ariaProps["aria-disabled"]}
        aria-describedby={ariaProps["aria-describedby"]}
        className="flex-1"
      />
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
        {safe}
      </span>
    </div>
  );
};

/** Slider's onValueChange emits `number | readonly number[]` depending on
 *  the installed shadcn version. Normalize to a single number. */
function firstNumber(v: number | readonly number[], fallback: number): number {
  if (typeof v === "number") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return fallback;
}

export default FieldSlider;
