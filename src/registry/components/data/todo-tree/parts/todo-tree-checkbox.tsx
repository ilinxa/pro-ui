"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface TodoTreeCheckboxProps {
  checked: boolean;
  /** Disabled state from permission gate; the click is a no-op when true. */
  disabled?: boolean;
  /** Next active state — already inverted from `checked`. */
  onChange?: (nextActive: boolean) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Wrapper around the shadcn `<Checkbox>` primitive that bridges the boolean
 * `checked` + `onChange` API the row expects. The primitive's `onCheckedChange`
 * argument can be `boolean | "indeterminate"`; we coerce indeterminate to
 * `true` (the only state we transition to when a partial check is committed).
 */
export function TodoTreeCheckbox({
  checked,
  disabled,
  onChange,
  ariaLabel,
  className,
}: TodoTreeCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel ?? (checked ? "Mark inactive" : "Mark active")}
      aria-disabled={disabled || undefined}
      onCheckedChange={(next) => {
        if (disabled) return;
        const value = next === "indeterminate" ? true : next;
        onChange?.(value);
      }}
      onClick={(e) => {
        // Stop row click from also firing — checkbox is a leaf interaction.
        e.stopPropagation();
      }}
      className={cn("size-4 shrink-0", className)}
    />
  );
}
