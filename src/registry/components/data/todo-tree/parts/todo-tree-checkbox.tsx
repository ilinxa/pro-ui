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
 * `checked` + `onChange` API the row expects.
 *
 * This is a PER-ROW boolean toggle bound to a single item's `active` — never a
 * tri-state group selector, so `checked` is always a real boolean and the box
 * never renders an "indeterminate"/mixed state. The `typeof next === "boolean"`
 * guard below exists ONLY to bridge the two checkbox backends (producer's Radix
 * passes `boolean | "indeterminate"`; consumer-installed Base UI passes only
 * `boolean`); the `: true` fallback is therefore unreachable in practice.
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
        // Cross-backend type guard (F-cross-13): Radix passes
        // `boolean | "indeterminate"`, Base UI passes only `boolean`. Since
        // `checked` is always a real boolean here, `next` is always a boolean
        // and the `: true` branch is unreachable — kept only for type-narrowing.
        const value: boolean = typeof next === "boolean" ? next : true;
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
