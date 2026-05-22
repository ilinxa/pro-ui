"use client";

import { cn } from "@/lib/utils";
import type { SidebarNav01Props } from "./types";

/**
 * C1 scaffold placeholder.
 *
 * Renders a minimal `<nav>` so the docs detail page at /components/sidebar-nav-01
 * returns 200 + lays out coherently. Real implementation lands across C2–C13.
 *
 * Accepting the full SidebarNav01Props surface (typed, not implemented) so
 * downstream files (demo.tsx, usage.tsx) compile against the eventual shape
 * starting at C1 — no API churn during the build.
 */
export function SidebarNav01({
  items,
  className,
  "aria-label": ariaLabel = "Main navigation",
}: SidebarNav01Props) {
  return (
    <nav
      aria-label={ariaLabel}
      data-component="sidebar-nav-01"
      data-stage="C1-scaffold"
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card p-3",
        className,
      )}
    >
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">
          SidebarNav01 — C1 scaffold
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Types locked. Items will render in C3.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-mono">{items.length}</span> items configured
        </p>
      </div>
    </nav>
  );
}
