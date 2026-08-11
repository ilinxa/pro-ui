"use client";

import * as React from "react";

import { TeamChallengeHeader } from "./parts/team-challenge-header";
import { TeamChallengeOptIn } from "./parts/team-challenge-optin";
import { TeamChallengeProgress } from "./parts/team-challenge-progress";
import { TeamChallengeReward } from "./parts/team-challenge-reward";
import { TeamChallengeRoot } from "./parts/team-challenge-root";
import type { TeamChallengeProps } from "./types";

/**
 * Tier A — the batteries-included assembly: `Root` + `Header` + `Progress` +
 * `Reward?` + `OptIn?`, gated by `show*`. Contains **no logic the parts don't**
 * — a hand-assembled layout (`TeamChallengeRoot` + a subset of parts)
 * gets identical derivation, identical controlled-echo, and identical telemetry.
 *
 * A safe-by-design cooperative challenge: one shared team goal, collective
 * progress, a whole-team reward, and a penalty-free opt-in. Never forced, never
 * per-individual, never competitive (system §5).
 */
export function TeamChallenge({
  challenge,
  team,
  onOptInChange,
  onEvent,
  showOptIn = true,
  showReward = true,
  showMemberStack = true,
  joinLabel,
  leaveLabel,
  noPenaltyHint,
  className,
  "aria-label": ariaLabel,
}: TeamChallengeProps) {
  return (
    <TeamChallengeRoot
      challenge={challenge}
      team={team}
      onOptInChange={onOptInChange}
      onEvent={onEvent}
      joinLabel={joinLabel}
      leaveLabel={leaveLabel}
      noPenaltyHint={noPenaltyHint}
      className={className}
      aria-label={ariaLabel}
    >
      <TeamChallengeHeader showMemberStack={showMemberStack} />
      <TeamChallengeProgress />
      {showReward ? <TeamChallengeReward /> : null}
      {showOptIn ? <TeamChallengeOptIn /> : null}
    </TeamChallengeRoot>
  );
}
