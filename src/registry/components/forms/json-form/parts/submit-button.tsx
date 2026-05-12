"use client";

import { Button } from "@/components/ui/button";
import { useJsonFormContext } from "../json-form-context";
import type { ButtonVariant } from "../types";

export interface JsonFormSubmitButtonProps {
  label?: string;
  variant?: ButtonVariant;
  disableWhenInvalid?: boolean;
  className?: string;
}

/**
 * Standalone submit button. Reads `isSubmitting` + `isValid` from context.
 * Opt-in `disableWhenInvalid` (the description Q19 / Q40 anti-pattern is
 * disabled by default).
 */
export function JsonFormSubmitButton({
  label,
  variant = "default",
  disableWhenInvalid = false,
  className,
}: JsonFormSubmitButtonProps) {
  const ctx = useJsonFormContext();
  const isSubmitting = ctx.rhf.formState.isSubmitting;
  const isValid = ctx.rhf.formState.isValid;
  const disabled = isSubmitting || (disableWhenInvalid && !isValid);

  return (
    <Button
      type="submit"
      variant={variant}
      disabled={disabled}
      data-jsonform-submit
      className={className}
    >
      {label ?? ctx.strings.submit}
    </Button>
  );
}

export default JsonFormSubmitButton;
