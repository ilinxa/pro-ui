"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ComposerCtx, ComposerStepCtx } from "../types";
import { ComposerStepContext } from "../hooks/use-composer-context";
import { StepIndicator } from "./step-indicator";

export interface ComposerShellProps {
  ctx: ComposerCtx;
  mode: "inline" | "dialog";
  /** the mounted slot for the active step (`<SlotMount>`) */
  children: React.ReactNode;
  /** publish region (draft/publish/schedule arms) — supplied by the root at C11 */
  footer?: React.ReactNode;
  /** screen-reader announcement (gate failures, save acks) — managed by the root */
  announcement?: string;
  /** escape hatch — extra chrome above the step body */
  renderStepChrome?: (ctx: ComposerCtx) => React.ReactNode;
  className?: string;
}

/**
 * The inline presentation frame: step nav + the active step's slot + a footer
 * with backward/forward navigation and the publish region. Provides the per-step
 * context so custom fields/slots can read `useComposerStep()`. The orchestrated
 * `reveal-up` fires once per step transition (keyed on the active step id) — the
 * single reveal per surface mandated by the design system.
 */
export function ComposerShell({
  ctx,
  mode,
  children,
  footer,
  announcement,
  renderStepChrome,
  className,
}: ComposerShellProps) {
  const { steps, cursor, goToStep } = ctx;
  const step = steps[cursor];
  const isFirst = cursor <= 0;
  const isLast = cursor >= steps.length - 1;

  const stepCtx = React.useMemo<ComposerStepCtx | null>(
    () =>
      step
        ? {
            stepId: step.id,
            contentType: ctx.contentType,
            mode,
            isDirty: ctx.isDirty,
            stepErrors: ctx.stepErrors[step.id] ?? [],
          }
        : null,
    [step, ctx.contentType, mode, ctx.isDirty, ctx.stepErrors],
  );

  return (
    <div
      data-slot="composer-shell"
      data-mode={mode}
      className={cn("flex flex-col gap-4", className)}
    >
      <StepIndicator
        steps={steps}
        cursor={cursor}
        stepErrors={ctx.stepErrors}
        onStepClick={(i) => void goToStep(i)}
      />

      {renderStepChrome?.(ctx)}

      <div key={step?.id} className="reveal-up min-h-0">
        <ComposerStepContext.Provider value={stepCtx}>
          {children}
        </ComposerStepContext.Provider>
      </div>

      {/* gate-failure / save-ack announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={isFirst}
          onClick={() => void goToStep(cursor - 1)}
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          {!isLast && (
            <Button type="button" onClick={() => void goToStep(cursor + 1)}>
              Next
            </Button>
          )}
          {footer}
        </div>
      </div>
    </div>
  );
}
