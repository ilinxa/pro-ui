"use client";

import { cn } from "@/lib/utils";

export interface ViewRepliesLinkProps {
  count: number;
  label: string;
  /** The replies list this link controls; referenced by `aria-controls` only while `expanded`. */
  controlsId?: string;
  /** The controlled replies list is in the DOM. Default `false`. */
  expanded?: boolean;
  /**
   * The link shows / hides replies (a disclosure) and reports `aria-expanded`. `false` for a link
   * that loads MORE replies into an already-open list — pressing it never collapses anything, so it
   * carries no `aria-expanded`. Default `true`.
   */
  disclosure?: boolean;
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
  expanded = false,
  disclosure = true,
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
      aria-controls={expanded ? controlsId : undefined}
      aria-expanded={disclosure ? expanded : undefined}
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
