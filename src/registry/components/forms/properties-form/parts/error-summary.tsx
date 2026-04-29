"use client";

import { AlertCircle } from "lucide-react";
import type { PropertiesFormField } from "../types";
import { cn } from "@/lib/utils";

interface ErrorSummaryProps {
  schema: ReadonlyArray<PropertiesFormField>;
  errors: Record<string, string>;
  formError: string | undefined;
  onFocusField: (key: string) => void;
  className?: string;
}

export function ErrorSummary({
  schema,
  errors,
  formError,
  onFocusField,
  className,
}: ErrorSummaryProps) {
  const orderedKeys = schema
    .map((f) => f.key)
    .filter((k) => errors[k]);
  if (!formError && orderedKeys.length === 0) return null;

  return (
    <div
      role="alert"
      className={cn(
        "mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">
            {formError ?? "Please fix the errors below."}
          </p>
          {orderedKeys.length > 0 ? (
            <ul className="mt-2 space-y-0.5">
              {orderedKeys.map((key) => {
                const field = schema.find((f) => f.key === key);
                const label = field?.label ?? key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => onFocusField(key)}
                      className="text-left underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/60 focus-visible:rounded-sm"
                    >
                      {label}: {errors[key]}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
