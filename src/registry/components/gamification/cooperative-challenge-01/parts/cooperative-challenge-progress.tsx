"use client";

import * as React from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { useCooperativeChallenge } from "../hooks/use-cooperative-challenge";
import type { ChallengeProgressMeterProps } from "../types";

function clamp01(current: number, target: number): number {
  return Math.min(Math.max(current / Math.max(target, 1), 0), 1);
}

/**
 * Tier C — dumb **collective** progress meter (system §6.3): ONE bar + ONE
 * `current / target` count (mono). There is deliberately no per-member row,
 * ranking, or "you still need to commit" framing — that would drift toward
 * per-individual tracking (excluded by design). The bar caps at 100%
 * (`clamp01`); the count shows the host's raw truth even past target. AT reads
 * the count via the accessible name (`aria-label` carries "3 of 5") — we pass
 * only `value` to the primitive, so this stays portable across the Radix ↔ Base
 * UI `Progress` divergence (Base UI has no `getValueLabel`).
 */
export function ChallengeProgressMeter({
  current,
  target,
  complete = false,
  className,
  "aria-label": ariaLabel,
}: ChallengeProgressMeterProps) {
  const pct = Math.round(clamp01(current, target) * 100);

  return (
    <div className={cn("group flex flex-col gap-1.5", className)}>
      <Progress
        value={pct}
        aria-label={ariaLabel ?? `Team progress: ${current} of ${target}`}
        className={cn(
          // Hover: the lime fill brightens + the bar gains a soft lime glow.
          "h-2.5 bg-muted transition-shadow duration-200 group-hover:shadow-[0_0_10px] group-hover:shadow-primary/30",
          "group-hover:**:data-[slot=progress-indicator]:brightness-110",
          "motion-reduce:**:data-[slot=progress-indicator]:transition-none",
        )}
      />
      <span
        className={cn(
          "font-mono text-xs tabular-nums",
          complete ? "text-primary" : "text-muted-foreground",
        )}
      >
        {current} / {target}
      </span>
    </div>
  );
}

/**
 * Tier B — context wrapper: reads the collective count from context and renders
 * the Tier-C meter. Never a per-member surface.
 */
export function CooperativeChallengeProgress() {
  const { challenge, team, derived } = useCooperativeChallenge();
  return (
    <ChallengeProgressMeter
      current={challenge.progress.current}
      target={challenge.progress.target}
      complete={derived.isComplete}
      aria-label={`${team.name ?? "Team"} progress: ${derived.countLabel}`}
    />
  );
}
