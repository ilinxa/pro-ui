"use client";

import { cn } from "@/lib/utils";
import type { RichSidebarEventArgs } from "../types";

interface SidebarSkipLinkProps {
  target: string;
  label: string;
  onActivated?: (args: RichSidebarEventArgs["skipLinkActivated"]) => void;
}

/**
 * Opt-in skip link (L31). Hidden until focused; appears at the top of the
 * sidebar's stacking context on keyboard focus. Activating jumps focus /
 * scroll to the consumer-supplied `skipLinkTarget` (e.g. `#main-content`).
 *
 * The component intentionally renders a plain `<a>` — using the consumer's
 * `linkComponent` for an in-page anchor would risk SPA frameworks treating
 * it as a route change. Native anchor behavior is the right primitive.
 */
export function SidebarSkipLink({
  target,
  label,
  onActivated,
}: SidebarSkipLinkProps) {
  return (
    <a
      href={target}
      data-sidebar-skip-link
      onClick={(event) => onActivated?.({ event })}
      className={cn(
        // sr-only by default — appears on focus
        "sr-only focus:not-sr-only",
        "focus:absolute focus:left-2 focus:top-2 focus:z-50",
        // RTL: skip link should sit on the same logical inline-start edge,
        // which means physical-right when direction is RTL
        "rtl:focus:left-auto rtl:focus:right-2",
        "focus:inline-flex focus:items-center focus:rounded-md",
        "focus:bg-card focus:px-3 focus:py-2",
        "focus:text-sm focus:font-medium focus:text-foreground",
        "focus:shadow-md focus:ring-1 focus:ring-border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
      )}
    >
      {label}
    </a>
  );
}
