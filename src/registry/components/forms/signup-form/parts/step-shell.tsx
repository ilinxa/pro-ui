"use client";

import type { ReactNode } from "react";
import type { FormStep } from "../hooks/use-form-step";

export interface StepShellProps {
  step: FormStep;
  children: ReactNode;
}

/**
 * Wrapper that fades content in when the step changes. The `key`
 * collapses the children when the step transitions so the CSS
 * keyframe (`signup-form-step-fade-in`) replays from `opacity: 0`.
 *
 * The fade is purely cosmetic; `prefers-reduced-motion: reduce`
 * collapses it to a 0ms hard-swap via the CSS rule in
 * `signup-form.css`. Hard-swap = no animation, which is the
 * correct a11y behavior.
 */
export function StepShell({ step, children }: StepShellProps) {
  return (
    <div
      key={step}
      data-signup-form-step={step}
      className="flex flex-col gap-3"
    >
      {children}
    </div>
  );
}
