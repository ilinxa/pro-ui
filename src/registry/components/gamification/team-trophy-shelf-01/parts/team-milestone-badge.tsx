"use client";

import * as React from "react";
import { Lock, Trophy } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { isEarned } from "../lib/resolve";
import type { TeamMilestoneBadgeProps } from "../types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Deterministic, locale/TZ-independent date format (UTC parts + fixed month
 * names) so the awarded-date reads identically on server + client — no hydration
 * mismatch. Returns null for an unparseable `awardedAt`.
 */
function formatAwardedDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Tier C — the load-bearing standalone token. Earned (lime medallion + glyph +
 * awarded-date tooltip) vs locked (desaturated, dashed, `Lock` glyph). Usable
 * anywhere with zero shelf scaffolding. Interactive only when `onOpen` is passed
 * (a real `<button>`); otherwise a non-focusable `role="img"` (no dead affordances).
 * State is conveyed by glyph + text, never color alone.
 */
export function TeamMilestoneBadge({
  badge,
  size = "md",
  showLocked = true,
  onOpen,
  renderIcon,
  className,
}: TeamMilestoneBadgeProps) {
  const earned = isEarned(badge);
  if (!earned && !showLocked) return null;

  const awardedText =
    earned && badge.awardedAt ? formatAwardedDate(badge.awardedAt) : null;
  const ariaLabel = earned
    ? `${badge.label} — earned${awardedText ? ` ${awardedText}` : ""}`
    : `${badge.label} — locked`;

  const interactive = typeof onOpen === "function";
  const medallionSize = size === "sm" ? "size-10" : "size-16";
  const glyphSize = size === "sm" ? "size-4" : "size-6";

  const icon = renderIcon ? (
    renderIcon(badge)
  ) : earned ? (
    <Trophy className={glyphSize} aria-hidden />
  ) : (
    <Lock className={glyphSize} aria-hidden />
  );

  const inner = (
    <>
      <span
        className={cn(
          "flex items-center justify-center rounded-2xl transition-colors",
          medallionSize,
          earned
            ? "bg-primary text-primary-foreground shadow-sm"
            : "border border-dashed border-border bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          "max-w-32 truncate text-center text-xs",
          size === "sm" && "max-w-24",
          earned ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {badge.label}
      </span>
    </>
  );

  const wrapperCls = cn(
    "inline-flex flex-col items-center gap-1.5 rounded-2xl outline-none",
    interactive &&
      "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  const token = interactive ? (
    <button
      type="button"
      onClick={() => onOpen?.(badge)}
      aria-label={ariaLabel}
      className={wrapperCls}
    >
      {inner}
    </button>
  ) : (
    <span role="img" aria-label={ariaLabel} title={badge.label} className={wrapperCls}>
      {inner}
    </span>
  );

  // Awarded-date tooltip only for earned badges (client-only render → SSR-safe).
  if (earned && awardedText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{token}</TooltipTrigger>
          <TooltipContent>Earned {awardedText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return token;
}
