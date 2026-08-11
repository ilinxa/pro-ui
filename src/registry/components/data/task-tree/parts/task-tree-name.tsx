"use client";

import { cn } from "@/lib/utils";

export interface TaskTreeNameProps {
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
export function TaskTreeName({ name, active, className }: TaskTreeNameProps) {
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
