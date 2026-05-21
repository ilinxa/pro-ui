"use client";

import { useFormState } from "react-hook-form";
import {
  useJsonFormContext,
  useJsonFormHasSubmitted,
} from "../json-form-context";
import { flattenRhfErrorsToList } from "../lib/flatten-errors";
import { fieldIdSlug } from "./field-wrapper";

export interface JsonFormErrorSummaryProps {
  /** Override the form-level `summaryStrategy`. */
  strategy?: "always" | "post-submit";
  className?: string;
}

/**
 * Standalone error-summary atom. `<div role="alert" aria-live="polite">`
 * with anchor-linked errors. Per default, only renders post-submit.
 * Doubles as the form's live region for validation state changes.
 *
 * v0.1.3 — reads `hasSubmitted` via the narrow `useJsonFormHasSubmitted`
 * accessor so the main context's identity doesn't churn when the flag
 * flips (F-R4 fix).
 */
export function JsonFormErrorSummary({
  strategy,
  className,
}: JsonFormErrorSummaryProps) {
  const ctx = useJsonFormContext();
  const hasSubmitted = useJsonFormHasSubmitted();
  const { errors } = useFormState({ control: ctx.rhf.control });
  const effective = strategy ?? "post-submit";

  const flat = flattenRhfErrorsToList(errors as Record<string, unknown>);
  if (flat.length === 0) return null;
  if (effective === "post-submit" && !hasSubmitted) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={
        "rounded-md border border-destructive/30 bg-destructive/5 p-3 " +
        (className ?? "")
      }
    >
      <h3 className="mb-1.5 text-sm font-medium text-destructive">
        {ctx.strings.summaryHeading}
      </h3>
      <ul className="ml-4 list-disc space-y-0.5 text-xs text-destructive">
        {flat.map(({ name, message }) => (
          <li key={name}>
            <a
              href={`#${fieldIdSlug(ctx.formId, name)}`}
              className="underline-offset-2 hover:underline"
              onClick={(e) => {
                // Browser default scrolls to `id`, but does NOT focus the
                // control (only focusable elements get focus on `href`-jump
                // and group-style controls have id on the wrapper). Force
                // focus via RHF so keyboard users land on the offending
                // input, not just near it.
                e.preventDefault();
                const slug = fieldIdSlug(ctx.formId, name);
                const target = typeof document !== "undefined"
                  ? document.getElementById(slug)
                  : null;
                target?.scrollIntoView({ behavior: "smooth", block: "center" });
                try {
                  ctx.rhf.setFocus(name as never);
                } catch {
                  // setFocus throws on non-registered names; fall through to
                  // letting the scroll-into-view land where it can.
                }
              }}
            >
              <span className="font-medium">{name}</span>
              <span className="px-1">—</span>
              <span>{message}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JsonFormErrorSummary;
