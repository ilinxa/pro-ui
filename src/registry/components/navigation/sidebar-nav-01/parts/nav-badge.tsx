"use client";

import { isValidElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSidebarNav01ContextOrNull } from "../contexts/sidebar-nav-context";
import { formatBadgeValue } from "../lib/badge-format";
import type { NavBadgeConfig } from "../types";

/**
 * Shared NavBadge — exported via index.ts AND imported by
 * `bottom-tab-bar-01` via relative path `../sidebar-nav-01/parts/nav-badge`
 * per F-S1 cross-procomp lock.
 *
 * Position resolution (L33):
 *   1. Explicit `position` prop wins
 *   2. Otherwise: context auto-resolve — "corner" when sidebar collapsed,
 *      "inline-end" when expanded
 *   3. Default "inline-end" if no context (L46 — standalone use, e.g.,
 *      inside bottom-tab-bar-01 which doesn't have SidebarNav context)
 *
 * Zero-value skip per L33: returns null when value === 0 && !showZero.
 */
export function NavBadge({
  value,
  max = 9,
  variant = "number",
  tone = "destructive",
  position,
  showZero = false,
  className,
}: NavBadgeConfig & { className?: string }) {
  const ctx = useSidebarNav01ContextOrNull();
  const resolvedPosition =
    position ?? (ctx?.state.collapsed ? "corner" : "inline-end");

  // Skip-render for zero (L33)
  if (typeof value === "number" && value === 0 && !showZero) return null;

  // Tone → token mapping
  const toneClasses: Record<NonNullable<NavBadgeConfig["tone"]>, string> = {
    default: "bg-muted text-muted-foreground",
    accent: "bg-accent text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    muted: "bg-muted/60 text-muted-foreground",
  };

  // Position → layout classes
  const positionClasses =
    resolvedPosition === "corner"
      ? "absolute -top-1 -right-1"
      : "relative inline-flex";

  if (variant === "dot") {
    return (
      <span
        aria-hidden={typeof value !== "string" && !isValidElement(value)}
        className={cn(
          positionClasses,
          "h-2 w-2 rounded-full",
          toneClasses[tone],
          className,
        )}
      />
    );
  }

  if (variant === "pulse") {
    return (
      <span
        className={cn(positionClasses, "h-2 w-2", className)}
        aria-hidden="true"
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full motion-safe:animate-ping",
            toneClasses[tone],
            "opacity-75",
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            toneClasses[tone],
          )}
        />
      </span>
    );
  }

  // variant === "number"
  const display: ReactNode =
    typeof value === "number" || typeof value === "string"
      ? formatBadgeValue(value, max)
      : value;

  return (
    <span
      className={cn(
        positionClasses,
        "inline-flex items-center justify-center",
        "min-w-(--ilinxa-nav-badge-size) h-(--ilinxa-nav-badge-size)",
        "px-1.5 text-[10px] font-semibold leading-none rounded-full",
        toneClasses[tone],
        className,
      )}
    >
      {display}
    </span>
  );
}
