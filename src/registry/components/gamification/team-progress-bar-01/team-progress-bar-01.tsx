"use client";

import { TeamProgressBarLabel } from "./parts/team-progress-bar-label";
import { TeamProgressBarRoot } from "./parts/team-progress-bar-root";
import { TeamProgressBarTrack } from "./parts/team-progress-bar-track";
import type { TeamProgressBar01Props } from "./types";

/**
 * Tier A — the batteries-included assembly: `Root` + `Label` (gated by
 * `showLabel`) + `Track` (threading `showTicks`). Contains **no logic the parts
 * don't** — a hand-assembled layout (`TeamProgressBarRoot` + a subset of parts)
 * gets identical resolution + identical single-fire telemetry.
 *
 * One team, one milestone-completion %, always visible, read-only. No comparison,
 * no ranking, no second series — ever (system §5.3 / D-08).
 */
export function TeamProgressBar01({
  milestones,
  value,
  team,
  showLabel = true,
  showTicks = false,
  labelFormat = "percent",
  onEvent,
  className,
  "aria-label": ariaLabel,
}: TeamProgressBar01Props) {
  return (
    <TeamProgressBarRoot
      milestones={milestones}
      value={value}
      team={team}
      labelFormat={labelFormat}
      onEvent={onEvent}
      className={className}
    >
      {showLabel ? <TeamProgressBarLabel /> : null}
      <TeamProgressBarTrack showTicks={showTicks} aria-label={ariaLabel} />
    </TeamProgressBarRoot>
  );
}
