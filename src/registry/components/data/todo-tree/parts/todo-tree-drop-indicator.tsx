"use client";

import { cn } from "@/lib/utils";
import type { EdgeZone } from "../lib/edge-zone";

export interface TodoTreeDropIndicatorProps {
  /** Which slot of the over-row the indicator paints in. */
  zone: EdgeZone;
  /** Indent of the dragged-over row so the line aligns with row content. */
  indentPx?: number;
  className?: string;
}

/**
 * Visual feedback for the active drop target.
 *
 * - "top"    — 2px horizontal line at the row's top edge → sibling-before.
 * - "bottom" — 2px horizontal line at the row's bottom edge → sibling-after.
 * - "middle" — inner-glow ring around the row → reparent as last child.
 *
 * The component is absolutely positioned relative to the row's bounding box.
 * The row sets `position: relative` (already true on `TodoTreeRowContent`)
 * for this to land in the right place. Pointer events are disabled so the
 * drop event still hits the row, not this overlay.
 */
export function TodoTreeDropIndicator({
  zone,
  indentPx = 0,
  className,
}: TodoTreeDropIndicatorProps) {
  if (zone === "top" || zone === "bottom") {
    return (
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-0 z-10 h-0.5 bg-primary",
          zone === "top" ? "top-0" : "bottom-0",
          className,
        )}
        style={{ left: indentPx }}
      />
    );
  }
  // zone === "middle"
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-10 rounded ring-2 ring-inset ring-primary/70",
        className,
      )}
    />
  );
}
