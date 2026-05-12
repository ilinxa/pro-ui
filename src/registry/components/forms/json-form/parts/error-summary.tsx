"use client";

import { useFormState } from "react-hook-form";
import {
  useJsonFormContext,
  useJsonFormHasSubmitted,
} from "../json-form-context";
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

  const flat = flattenErrors(errors);
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

function flattenErrors(
  errors: Record<string, unknown>,
  prefix = "",
): Array<{ name: string; message: string }> {
  const out: Array<{ name: string; message: string }> = [];
  for (const [key, val] of Object.entries(errors)) {
    if (!val) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      typeof val === "object" &&
      val !== null &&
      "message" in val &&
      typeof (val as { message?: unknown }).message === "string"
    ) {
      out.push({
        name: path,
        message: String((val as { message?: unknown }).message),
      });
      continue;
    }
    if (typeof val === "object" && val !== null) {
      out.push(...flattenErrors(val as Record<string, unknown>, path));
    }
  }
  return out;
}

export default JsonFormErrorSummary;
