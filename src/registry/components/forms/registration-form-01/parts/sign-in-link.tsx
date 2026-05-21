"use client";

import type { RegistrationLabels } from "../types";

export interface SignInLinkProps {
  href: string;
  labels: Pick<RegistrationLabels, "signInLabel">;
}

/**
 * "Already have an account? Sign in" link below the form. Plain `<a>`
 * (registry portability lock — can't import `next/link`). Caller checks
 * for `signInHref` and skips mounting if undefined.
 */
export function SignInLink({ href, labels }: SignInLinkProps) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      <a
        href={href}
        className="underline underline-offset-2 hover:text-foreground"
      >
        {labels.signInLabel}
      </a>
    </p>
  );
}
