"use client";

import { isValidElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAppSidebarContextOrNull } from "../contexts/sidebar-nav-context";
import { formatBadgeValue } from "../lib/badge-format";
import type { NavBadgeConfig, NavBadgeTone } from "../types";

/**
 * Shared NavBadge — exported via index.ts; usable standalone (no sidebar
 * context) as well as inside <AppSidebar>.
 *
 * Position resolution (L33):
 *   1. Explicit `position` prop wins
 *   2. Otherwise: context auto-resolve — "corner" when sidebar collapsed,
 *      "inline-end" when expanded
 *   3. Default "inline-end" if no context (L46 — standalone use)
 *
 * Zero-value skip per L33: returns null when value === 0 && !showZero.
 *
 * v0.5.0: `value === null | undefined | ""` renders nothing (C6); `active` swaps
 * `tone` for `activeTone` (the row passes its active state); counts format
 * through the context's `formatBadgeCount` (C3); the corner size and halo read
 * `--ilinxa-nav-badge-corner-size` / `--ilinxa-nav-badge-halo`; the corner
 * anchor is logical (`-end-2`) so it mirrors in RTL without a physical pair.
 */
export function NavBadge({
  value,
  max = 9,
  variant = "number",
  tone = "destructive",
  activeTone,
  position,
  showZero = false,
  active = false,
  className,
}: NavBadgeConfig & {
  className?: string;
  /** v0.5.0 — the badge's row is the active item; applies `activeTone` when set. */
  active?: boolean;
}) {
  const ctx = useAppSidebarContextOrNull();
  const resolvedPosition =
    position ?? (ctx?.state.collapsed ? "corner" : "inline-end");

  // C6 — a withheld badge renders nothing
  // `""` is an empty badge, not a value — the row name already ignores it.
  if (value === null || value === undefined || value === "") return null;
  // Skip-render for zero (L33)
  if (typeof value === "number" && value === 0 && !showZero) return null;

  const resolvedTone: NavBadgeTone = active && activeTone ? activeTone : tone;

  // Tone → token mapping
  const toneClasses: Record<NavBadgeTone, string> = {
    default: "bg-muted text-muted-foreground",
    accent: "bg-accent text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    muted: "bg-muted/60 text-muted-foreground",
    brand: "bg-brand text-brand-foreground",
  };
  const toneClass = toneClasses[resolvedTone];

  // Position → layout classes. RTL flip: in collapsed-mode the badge corner
  // anchors on the icon's inline-end edge (`-end-2`: right in LTR, left in
  // RTL — no physical pair needed). The deeper offset (-8px instead of -4px) lets the badge
  // sit on the icon's outer corner with only a slight overlap, so the
  // underlying icon glyph stays readable instead of being masked.
  const positionClasses =
    resolvedPosition === "corner"
      ? "absolute -top-2 -end-2"
      : "relative inline-flex";

  if (variant === "dot") {
    return (
      <span
        aria-hidden={typeof value !== "string" && !isValidElement(value)}
        className={cn(
          positionClasses,
          "h-2 w-2 rounded-full",
          toneClass,
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
            toneClass,
            "opacity-75",
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            toneClass,
          )}
        />
      </span>
    );
  }

  // variant === "number"
  const display: ReactNode =
    typeof value === "number" || typeof value === "string"
      ? typeof value === "number" && ctx?.formatBadgeCount
        ? ctx.formatBadgeCount(value, max)
        : formatBadgeValue(value, max)
      : value;

  // Corner-position badges run smaller + tighter than inline-end ones so they
  // don't mask the icon glyph they're decorating. Inline-end keeps the
  // theme-token sizing for visual parity with shadcn Badge.
  const sizeClasses =
    resolvedPosition === "corner"
      ? "min-w-(--ilinxa-nav-badge-corner-size,1rem) h-(--ilinxa-nav-badge-corner-size,1rem) px-1 text-[9px] ring-2 ring-(--ilinxa-nav-badge-halo,var(--card))"
      : "min-w-(--ilinxa-nav-badge-size,1.25rem) h-(--ilinxa-nav-badge-size,1.25rem) px-1.5 text-[10px]";

  return (
    <span
      className={cn(
        positionClasses,
        "inline-flex items-center justify-center",
        sizeClasses,
        "font-semibold leading-none rounded-full",
        toneClass,
        className,
      )}
    >
      {display}
    </span>
  );
}
