"use client";

import { useCallback, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type {
  RegistrationStep1Values,
  RegistrationStep2Values,
} from "../types";

export type FormStep = "step1" | "step2";

export interface UseFormStepArgs {
  /** When `false`, the hook locks step at `"step1"` and goNext/goBack are no-ops. */
  enabled: boolean;
  form: UseFormReturn<RegistrationStep2Values>;
}

export interface UseFormStepReturn {
  step: FormStep;
  /** Validate step-1 fields; advance to step-2 only if valid. Returns whether the transition succeeded. */
  goNext: () => Promise<boolean>;
  goBack: () => void;
}

/**
 * Step-state hook for the two-step flow. Encapsulates:
 *  - `useState<FormStep>("step1")`
 *  - Partial validation of step-1 fields via `form.trigger([...])`
 *  - No-op behavior under `flow === "single-step"` (enabled=false) so the
 *    hook is always called for hook-order stability without affecting
 *    behavior.
 *
 * Step-1 fields = `email`, `password` (when present), `consentAccepted`.
 * Honeypot is NOT in the step-1 trigger list — it's intentionally
 * "validated" at submit time (where we read it for the trip flag) and
 * has no Zod check.
 */
export function useFormStep(args: UseFormStepArgs): UseFormStepReturn {
  const { enabled, form } = args;
  const [step, setStep] = useState<FormStep>("step1");

  const step1Fields = useMemo<
    Array<keyof RegistrationStep1Values>
  >(() => ["email", "password", "consentAccepted"], []);

  const goNext = useCallback(async () => {
    if (!enabled) return false;
    if (step === "step2") return true;
    const ok = await form.trigger(step1Fields);
    if (ok) setStep("step2");
    return ok;
  }, [enabled, step, form, step1Fields]);

  const goBack = useCallback(() => {
    if (!enabled) return;
    setStep("step1");
  }, [enabled]);

  return { step, goNext, goBack };
}
