"use client";

import { Button } from "@/components/ui/button";
import { useJsonFormContext } from "../json-form-context";
import type { ButtonVariant } from "../types";

export interface JsonFormResetButtonProps {
  label?: string;
  variant?: ButtonVariant;
  className?: string;
}

/**
 * Standalone reset button. Calls `formApi.reset()` — does NOT fire the
 * native form reset (which would clear values outside RHF's tracking).
 */
export function JsonFormResetButton({
  label,
  variant = "outline",
  className,
}: JsonFormResetButtonProps) {
  const ctx = useJsonFormContext();
  return (
    <Button
      type="button"
      variant={variant}
      onClick={(e) => {
        e.preventDefault();
        ctx.reset();
      }}
      data-jsonform-reset
      className={className}
    >
      {label ?? ctx.strings.reset}
    </Button>
  );
}

export default JsonFormResetButton;
