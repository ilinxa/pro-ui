"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { useProgressTelemetry } from "../hooks/use-progress-telemetry";
import { TeamProgressBarContext } from "../hooks/use-team-progress-bar";
import { resolveLabelFormat, resolveProgress } from "../lib/resolve-progress";
import type {
  TeamProgressBarContextValue,
  TeamProgressBarRootProps,
} from "../types";

/**
 * Tier B — headless provider. The **single** place the percentage is resolved
 * and the **single** place `progress-bar.checked` fires, so every part and any
 * hand-assembly read one resolved value (the math + the emit can't drift or
 * double-fire). No data/persistence state, no layout opinion — renders children.
 */
export function TeamProgressBarRoot({
  value,
  milestones,
  team,
  labelFormat = "percent",
  onEvent,
  className,
  children,
}: TeamProgressBarRootProps) {
  const resolved = React.useMemo(
    () => resolveProgress({ value, milestones }),
    [value, milestones],
  );

  const effectiveLabelFormat = React.useMemo(
    () => resolveLabelFormat(labelFormat, resolved.total),
    [labelFormat, resolved.total],
  );

  // Telemetry target — IntersectionObserver attaches here (client-only, in an effect).
  const targetRef = useProgressTelemetry({ teamId: team.id, onEvent });

  const contextValue = React.useMemo<TeamProgressBarContextValue>(
    () => ({
      pct: resolved.pct,
      doneCount: resolved.doneCount,
      total: resolved.total,
      ticks: resolved.ticks,
      team,
      labelFormat: effectiveLabelFormat,
    }),
    [resolved, team, effectiveLabelFormat],
  );

  return (
    <TeamProgressBarContext.Provider value={contextValue}>
      <div
        ref={targetRef}
        className={cn("reveal-up flex w-full flex-col gap-1.5", className)}
      >
        {children}
      </div>
    </TeamProgressBarContext.Provider>
  );
}
