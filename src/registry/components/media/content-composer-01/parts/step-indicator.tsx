"use client";

import { Check, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComposerStep } from "../types";

export interface StepIndicatorProps {
  steps: ComposerStep[];
  /** index into `steps` of the active step */
  cursor: number;
  /** per-step error slices (keyed by step id) */
  stepErrors: Record<string, string[]>;
  /** invoked with the target step index; the shell runs the gate (forward) or jumps free (backward) */
  onStepClick: (index: number) => void;
}

/**
 * Labeled step nav (`<nav aria-label="Composer steps">`) with `aria-current="step"`
 * on the active step. Past steps render a check; errored steps render a warning.
 * Backward steps are always reachable; forward jumps run the blocking gate (the
 * shell decides — this is a presentational click surface).
 */
export function StepIndicator({
  steps,
  cursor,
  stepErrors,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <nav aria-label="Composer steps">
      <ol className="flex flex-wrap items-center gap-1.5">
        {steps.map((step, i) => {
          const isCurrent = i === cursor;
          const isComplete = i < cursor;
          const hasError = (stepErrors[step.id]?.length ?? 0) > 0;
          return (
            <li key={step.id} className="flex items-center gap-1.5">
              <button
                type="button"
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onStepClick(i)}
                className={cn(
                  "group flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  isCurrent
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                    hasError
                      ? "bg-destructive/15 text-destructive"
                      : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isComplete
                          ? "bg-primary/25 text-foreground"
                          : "bg-muted text-muted-foreground",
                  )}
                >
                  {hasError ? (
                    <TriangleAlert className="size-3.5" />
                  ) : isComplete ? (
                    <Check className="size-3.5" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={cn("font-medium", isCurrent && "text-foreground")}>
                  {step.title}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="h-px w-4 shrink-0 bg-border sm:w-6"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
