"use client";

import { useStrengthMeter, type StrengthLabels } from "../hooks/use-strength-meter";
import { cn } from "@/lib/utils";
import type { StrengthCalculator } from "../types";

export interface StrengthMeterProps {
  calculator?: StrengthCalculator;
  labels: StrengthLabels;
}

/**
 * 4-segment password strength bar + descriptive text. The bar is
 * `role="presentation"` (the textual companion is the AT-readable
 * surface; the bar is purely visual). The companion has
 * `aria-live="polite"` so SR users hear "Strength: strong" on update.
 *
 * Segments highlight from left to right based on the score (0–4).
 * Color gradient mirrors json-form's strength conventions: destructive
 * → amber → primary (signal-lime) for "fair / strong / excellent".
 */
export function StrengthMeter({ calculator, labels }: StrengthMeterProps) {
  const { score, label } = useStrengthMeter({ calculator, labels });
  return (
    <div className="flex flex-col gap-1">
      <div
        role="presentation"
        aria-hidden="true"
        className="flex gap-1"
      >
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              segment > score
                ? "bg-border"
                : score === 1
                  ? "bg-destructive"
                  : score === 2
                    ? "bg-amber-500"
                    : "bg-primary",
            )}
          />
        ))}
      </div>
      <span
        aria-live="polite"
        className="min-h-4 text-xs text-muted-foreground"
      >
        {label}
      </span>
    </div>
  );
}
