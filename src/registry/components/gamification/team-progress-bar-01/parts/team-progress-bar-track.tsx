"use client";

import * as React from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { useTeamProgressBar } from "../hooks/use-team-progress-bar";
import type { ProgressTrackProps } from "../types";

/**
 * Tier C — dumb, context-free fill bar over the shadcn `progress` primitive.
 * Usable anywhere with a 0–100 `pct`. The signal-lime fill comes from the
 * primitive's `bg-primary` indicator; the fill transition is gated by
 * `prefers-reduced-motion` (targeting the indicator's `data-slot`). The
 * underlying Radix `Progress` already provides `role="progressbar"` +
 * `aria-valuenow/min/max` — the single accessible representation of the value.
 *
 * Ticks are rendered as a sibling overlay (NOT inside the primitive, whose Root
 * is `overflow-x-hidden` and would clip the edge notches). They are decorative
 * (`aria-hidden`) — the progressbar value is the source of truth.
 */
export function ProgressTrack({
  pct,
  ticks,
  showTicks = false,
  className,
  "aria-label": ariaLabel,
}: ProgressTrackProps) {
  const renderTicks = showTicks && ticks != null && ticks.length > 0;

  return (
    <div className={cn("relative w-full", className)}>
      <Progress
        value={pct}
        aria-label={ariaLabel}
        className={cn(
          "h-2.5 bg-muted",
          "motion-reduce:[&_[data-slot=progress-indicator]]:transition-none",
        )}
      />
      {renderTicks ? (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {ticks.map((tick, i) => (
            <span
              key={i}
              title={tick.label}
              className={cn(
                "absolute top-0 h-full rounded-full",
                // Non-color cue: done notches are thicker + solid; pending are hairline.
                tick.done
                  ? "w-0.5 bg-primary-foreground/60"
                  : "w-px bg-muted-foreground/50",
              )}
              style={{
                insetInlineStart: `${((i + 1) / ticks.length) * 100}%`,
                transform: "translateX(-50%)",
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Tier B — context wrapper. Reads the resolved `pct` + `ticks` and renders the
 * Tier-C `ProgressTrack`. Builds a default `aria-label` from the team name + %.
 */
export function TeamProgressBarTrack({
  showTicks = false,
  className,
  "aria-label": ariaLabel,
}: {
  showTicks?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const { pct, ticks, team } = useTeamProgressBar();
  const label = ariaLabel ?? `${team.name ?? "Team"} progress: ${pct}%`;

  return (
    <ProgressTrack
      pct={pct}
      ticks={ticks}
      showTicks={showTicks}
      className={className}
      aria-label={label}
    />
  );
}
