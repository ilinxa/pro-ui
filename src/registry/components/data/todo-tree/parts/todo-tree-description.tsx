"use client";

import { cn } from "@/lib/utils";

export interface TodoTreeDescriptionProps {
  description: string;
  className?: string;
}

/**
 * Second-line description preview, single-line truncated. Rendered with the
 * row's calculated left padding so the description aligns with the name,
 * minus the chevron + checkbox affordances' widths.
 */
export function TodoTreeDescription({
  description,
  className,
}: TodoTreeDescriptionProps) {
  return (
    <div
      className={cn(
        "truncate text-xs text-muted-foreground leading-tight",
        className,
      )}
    >
      {description}
    </div>
  );
}
