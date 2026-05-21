"use client";

import { cn } from "@/lib/utils";
import type { RegistrationLabels } from "../types";

export interface StepIndicatorProps {
  current: 1 | 2;
  total: number;
  labels: Pick<RegistrationLabels, "stepOf">;
}

/**
 * `1 / 2` → `2 / 2` progress indicator for the two-step flow.
 * `role="status" aria-live="polite"` announces the step number on
 * transition. Hidden entirely under `flow === "single-step"` — root
 * component does not render this for single-step.
 */
export function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  const text = labels.stepOf
    .replace("{current}", String(current))
    .replace("{total}", String(total));
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-xs text-muted-foreground"
    >
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 w-6 rounded-full transition-colors",
              i + 1 <= current ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
      <span>{text}</span>
    </div>
  );
}
