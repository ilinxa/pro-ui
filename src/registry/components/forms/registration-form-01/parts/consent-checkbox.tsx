"use client";

import { useId, type ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  RegistrationLabels,
  RegistrationStep2Values,
} from "../types";

export interface ConsentCheckboxProps {
  consent: {
    required: boolean;
    label: ReactNode | string;
    href?: string;
  };
  labels: Pick<RegistrationLabels, "consentRequired">;
}

/**
 * Consent checkbox + label. Wired via `<Controller>` because the
 * underlying Radix Checkbox is controlled via `checked` / `onCheckedChange`
 * rather than the native `<input type="checkbox">` interface.
 *
 * **F-cross-13 defensive callback shape:** `onCheckedChange` receives
 * `boolean | "indeterminate"` (Radix) or `boolean` (Base UI). The
 * coercion `typeof v === "boolean" ? v : true` widens both backends.
 *
 * Label accepts `ReactNode` for inline `<Link>` composition; the
 * `string + href?` convenience overload renders a plain `<a>`.
 */
export function ConsentCheckbox({
  consent,
  labels,
}: ConsentCheckboxProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const {
    control,
    formState: { errors },
  } = useFormContext<RegistrationStep2Values>();
  const error = errors.consentAccepted?.message;

  const labelNode: ReactNode =
    typeof consent.label === "string" ? (
      consent.href ? (
        <a
          href={consent.href}
          className="underline underline-offset-2 hover:text-foreground"
          rel="noreferrer"
        >
          {consent.label}
        </a>
      ) : (
        consent.label
      )
    ) : (
      consent.label
    );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <Controller
          control={control}
          name="consentAccepted"
          render={({ field }) => (
            <Checkbox
              id={id}
              checked={!!field.value}
              onCheckedChange={(v) =>
                field.onChange(typeof v === "boolean" ? v : true)
              }
              onBlur={field.onBlur}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              aria-required={consent.required ? true : undefined}
            />
          )}
        />
        <Label
          htmlFor={id}
          className="text-sm font-normal leading-snug text-muted-foreground"
        >
          {labelNode}
        </Label>
      </div>
      <p
        id={errorId}
        role={error ? "alert" : undefined}
        className={cn(
          "min-h-5 text-xs",
          error ? "text-destructive" : "text-transparent",
        )}
      >
        {/* Always render the message text for layout stability; opacity
            collapses to transparent when no error so users don't see a
            premature "you must accept" warning at idle. */}
        {error ?? labels.consentRequired}
      </p>
    </div>
  );
}
