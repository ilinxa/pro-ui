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
          "flex items-center justify-center rounded-2xl transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out",
          medallionSize,
          earned
            ? "bg-primary text-primary-foreground shadow-sm group-hover:shadow-md group-hover:shadow-primary/25 motion-safe:group-hover:-translate-y-0.5"
            : "border border-dashed border-border bg-muted text-muted-foreground group-hover:border-solid group-hover:bg-muted/70 motion-safe:group-hover:-translate-y-0.5",
        )}
      >
        {icon}
      </span>
      <span
        className={cn(
          // Fixed 2-line footprint so cells stay uniform regardless of name length.
          "line-clamp-2 min-h-8 w-full wrap-break-word text-center text-xs leading-tight transition-colors",
          earned
            ? "text-foreground/90 group-hover:text-foreground"
            : "text-muted-foreground",
        )}
      >
        {badge.label}
      </span>
    </>
  );

  // Fixed, size-driven cell width → every token occupies the same footprint, so
  // the shelf grid keeps an even rhythm no matter how long the label is.
  const wrapperCls = cn(
    "group inline-flex w-24 flex-col items-center gap-1.5 rounded-2xl p-1 outline-none",
    size === "sm" && "w-20",
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
