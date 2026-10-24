import type { Ref } from "react";
import { cn } from "@/lib/utils";

interface EmptyPlaceholderProps {
  ariaLabel: string;
  /** Visible text (`labels.empty`). */
  emptyText: string;
  isCollapsed: boolean;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Disabled trigger rendered when `items` is empty AND no `fallbackActiveItem`
 * is provided (Q1 default: disabled with placeholder text). Defensive
 * against the source's empty-array crash (I-2).
 */
export function EmptyPlaceholder({ ariaLabel, emptyText, isCollapsed, className, ref }: EmptyPlaceholderProps) {
  if (isCollapsed) {
    return (
      <button
        ref={ref}
        type="button"
        disabled
        aria-label={ariaLabel}
        className={cn(
          "inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-md border border-dashed border-border bg-card text-muted-foreground opacity-60",
          className,
        )}
      >
        <span className="text-xs">—</span>
      </button>
    );
  }
  return (
    <button
      ref={ref}
      type="button"
      disabled
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-full cursor-not-allowed items-center justify-between rounded-md border border-dashed border-border bg-card px-3 py-2 text-sm text-muted-foreground opacity-60",
        className,
      )}
    >
      <span>{emptyText}</span>
    </button>
  );
}
