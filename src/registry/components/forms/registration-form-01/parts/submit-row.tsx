"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ButtonVariant,
  RegistrationFormStatus,
  RegistrationLabels,
} from "../types";

export interface SubmitRowProps {
  status: RegistrationFormStatus;
  flow: "single-step" | "two-step";
  step: "step1" | "step2";
  skippableStepTwo: boolean;
  submitLabel: string;
  submitVariant?: ButtonVariant;
  labels: Pick<RegistrationLabels, "continueLabel" | "backLabel" | "skipForNowLabel">;
  onBack: () => void;
  onSkip: () => void;
}

/**
 * Submit / Back / Skip-for-now button row.
 *
 * - Submit: always rendered, `type="submit"`, disabled during submitting.
 *   On step-1 of two-step flow, label is `continueLabel`; otherwise it's
 *   the consumer-provided `submitLabel` (or default "Create account").
 * - Back: only on step-2 of two-step flow. `type="button"` so it doesn't
 *   trip the form's submit handler.
 * - Skip-for-now: only on step-2 of two-step flow when `skippableStepTwo`
 *   is true. `type="button"`.
 */
export function SubmitRow({
  status,
  flow,
  step,
  skippableStepTwo,
  submitLabel,
  submitVariant,
  labels,
  onBack,
  onSkip,
}: SubmitRowProps) {
  const isSubmitting = status === "submitting";
  const isStep1OfTwoStep = flow === "two-step" && step === "step1";
  const isStep2OfTwoStep = flow === "two-step" && step === "step2";
  const effectiveLabel = isStep1OfTwoStep ? labels.continueLabel : submitLabel;

  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      <div className="flex gap-2">
        {isStep2OfTwoStep ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isSubmitting}
          >
            {labels.backLabel}
          </Button>
        ) : null}
        {isStep2OfTwoStep && skippableStepTwo ? (
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            disabled={isSubmitting}
          >
            {labels.skipForNowLabel}
          </Button>
        ) : null}
      </div>
      <Button
        type="submit"
        variant={submitVariant ?? "default"}
        aria-busy={isSubmitting || undefined}
        disabled={isSubmitting}
      >
        <span className={cn("inline-flex items-center gap-2")}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {effectiveLabel}
        </span>
      </Button>
    </div>
  );
}
