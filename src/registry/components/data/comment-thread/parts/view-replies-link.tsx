"use client";

import { cn } from "@/lib/utils";

export interface ViewRepliesLinkProps {
  count: number;
  label: string;
  controlsId?: string;
  onExpand: () => void;
  /** Replies are loading: shows `loadingLabel`, marks the link busy, ignores clicks (focus stays). */
  loading?: boolean;
  loadingLabel?: string;
  className?: string;
}

export function ViewRepliesLink({
  count,
  label,
  controlsId,
  onExpand,
  loading = false,
  loadingLabel,
  className,
}: ViewRepliesLinkProps) {
  if (count <= 0) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (!loading) onExpand();
      }}
      aria-controls={controlsId}
      aria-expanded={false}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      className={cn(
        "mt-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
        loading && "opacity-60",
        className,
      )}
    >
      {loading && loadingLabel ? loadingLabel : label}
    </button>
  );
}
