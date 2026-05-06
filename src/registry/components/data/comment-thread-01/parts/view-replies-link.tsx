"use client";

import { cn } from "@/lib/utils";

export interface ViewRepliesLinkProps {
  count: number;
  label: string;
  controlsId?: string;
  onExpand: () => void;
  className?: string;
}

export function ViewRepliesLink({
  count,
  label,
  controlsId,
  onExpand,
  className,
}: ViewRepliesLinkProps) {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-controls={controlsId}
      aria-expanded={false}
      className={cn(
        "mt-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {label}
    </button>
  );
}
