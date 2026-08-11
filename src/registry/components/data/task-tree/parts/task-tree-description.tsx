"use client";

import { cn } from "@/lib/utils";

export interface TaskTreeDescriptionProps {
  description: string;
  className?: string;
}

/**
 * Second-line description preview, single-line truncated. Rendered with the
 * row's calculated left padding so the description aligns with the name,
 * minus the chevron + checkbox affordances' widths.
 */
export function TaskTreeDescription({
  description,
  className,
}: TaskTreeDescriptionProps) {
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
