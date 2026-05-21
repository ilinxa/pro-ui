"use client";

import { cn } from "@/lib/utils";
import type { RegistrationForm01Props } from "./types";

/**
 * **C1 SCAFFOLD STUB** — the full implementation lands in C5.
 *
 * v0.1.0 registration form — hand-rolled on RHF v7 + zod v4. See the
 * procomp guide at `docs/procomps/registration-form-01-procomp/` for the
 * full contract.
 */
export function RegistrationForm01(props: RegistrationForm01Props) {
  const { heading, subheading, className, style } = props;
  // Reference the rest of the props so TS doesn't complain about unused
  // destructure during the scaffold-only commit. The C5 implementation
  // replaces this entire body.
  void props;
  return (
    <section
      className={cn(
        "rounded-md border border-border bg-card p-6 text-card-foreground",
        className,
      )}
      style={style}
    >
      <div className="flex flex-col gap-1">
        {heading ? (
          <span className="text-base font-semibold text-foreground">
            {heading}
          </span>
        ) : null}
        {subheading ? (
          <span className="text-sm text-muted-foreground">{subheading}</span>
        ) : null}
        <span className="mt-2 text-xs italic text-muted-foreground">
          C1 scaffold stub — full implementation lands in C5.
        </span>
      </div>
    </section>
  );
}
