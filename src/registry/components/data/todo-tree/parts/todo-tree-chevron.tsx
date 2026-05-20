"use client";

import { ChevronRight } from "lucide-react";
import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

export interface TodoTreeChevronProps {
  collapsed: boolean;
  hasChildren: boolean;
  onToggle?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

/**
 * Disclosure triangle for the row. Renders as a hidden 16px slot when the
 * item has no children so the row alignment stays consistent across rows
 * with and without children.
 */
export function TodoTreeChevron({
  collapsed,
  hasChildren,
  onToggle,
  className,
}: TodoTreeChevronProps) {
  if (!hasChildren) {
    return (
      <span
        aria-hidden
        className={cn("inline-block size-4 shrink-0", className)}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand" : "Collapse"}
      aria-expanded={!collapsed}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
    >
      <ChevronRight
        className={cn(
          "size-3 transition-transform duration-150",
          !collapsed && "rotate-90",
        )}
      />
    </button>
  );
}
