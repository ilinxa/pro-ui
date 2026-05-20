"use client";

import { cn } from "@/lib/utils";

export interface TodoTreeNameProps {
  name: string;
  active?: boolean;
  className?: string;
}

/**
 * Bold name span with single-line truncation. Inactive items render dimmed +
 * strikethrough as a visual affordance — the active state is also reflected
 * via the row checkbox; the dimming pairs the two so an inactive item reads
 * "done" from the row glance alone.
 */
export function TodoTreeName({ name, active, className }: TodoTreeNameProps) {
  return (
    <span
      className={cn(
        "flex-1 truncate font-semibold",
        active === false && "text-muted-foreground line-through opacity-70",
        className,
      )}
    >
      {name}
    </span>
  );
}
