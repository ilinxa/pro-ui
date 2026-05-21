"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

export interface SuccessScreenProps {
  message: ReactNode | string;
}

/**
 * `role="status" aria-live="polite"` region that replaces the form
 * after `onSubmit` resolves successfully. The caller swaps this in
 * place of the `<form>`.
 *
 * No "Back to sign-up" link by default — consumers either re-render
 * parent with a fresh `status: "idle"` or pop the user to a different
 * route (e.g., `/sign-in` after email verification).
 */
export function SuccessScreen({ message }: SuccessScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 rounded-md border border-border bg-card p-6 text-center text-sm text-foreground"
    >
      <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
        <Check className="size-5" aria-hidden="true" />
      </div>
      <div className="text-base font-medium text-foreground">{message}</div>
    </div>
  );
}
