"use client";

import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { defaultStrengthCalculator } from "../lib/strength-calculator";
import type { RegistrationLabels, StrengthCalculator } from "../types";

export type StrengthLabels = Pick<
  RegistrationLabels,
  | "strengthWeak"
  | "strengthFair"
  | "strengthStrong"
  | "strengthExcellent"
  | "strengthLabel"
>;

export interface UseStrengthMeterArgs {
  calculator?: StrengthCalculator;
  labels: StrengthLabels;
}

export interface UseStrengthMeterReturn {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

/**
 * Narrow-deps password-strength hook. Subscribes to the `password` field
 * via RHF's `useWatch({ name })` against the active FormProvider context;
 * re-computes when the password changes. The consumer-supplied
 * `strengthCalculator` is clamped defensively so a buggy BYO heuristic
 * returning out-of-range values can't crash the meter.
 *
 * `label` interpolates `labels.strengthLabel` (`"Strength: {level}"`)
 * with the bucketed `strengthWeak`/`Fair`/`Strong`/`Excellent` text. For
 * score 0 (empty), `label` is the empty string — the meter is rendered
 * but the descriptive text disappears.
 */
export function useStrengthMeter(
  args: UseStrengthMeterArgs,
): UseStrengthMeterReturn {
  const { calculator, labels } = args;
  const password = useWatch({ name: "password" }) as string | undefined;

  return useMemo<UseStrengthMeterReturn>(() => {
    const calc = calculator ?? defaultStrengthCalculator;
    const raw = calc(password ?? "");
    const score = clampScore(raw);
    if (score === 0) return { score, label: "" };
    const levelText =
      score === 1
        ? labels.strengthWeak
        : score === 2
          ? labels.strengthFair
          : score === 3
            ? labels.strengthStrong
            : labels.strengthExcellent;
    return { score, label: labels.strengthLabel.replace("{level}", levelText) };
  }, [calculator, password, labels]);
}

function clampScore(raw: number): 0 | 1 | 2 | 3 | 4 {
  if (raw <= 0) return 0;
  if (raw === 1) return 1;
  if (raw === 2) return 2;
  if (raw === 3) return 3;
  return 4;
}
