"use client";

import * as React from "react";

import { CooperativeChallengeHeader } from "./parts/cooperative-challenge-header";
import { CooperativeChallengeOptIn } from "./parts/cooperative-challenge-optin";
import { CooperativeChallengeProgress } from "./parts/cooperative-challenge-progress";
import { CooperativeChallengeReward } from "./parts/cooperative-challenge-reward";
import { CooperativeChallengeRoot } from "./parts/cooperative-challenge-root";
import type { CooperativeChallengeProps } from "./types";

/**
 * Tier A — the batteries-included assembly: `Root` + `Header` + `Progress` +
 * `Reward?` + `OptIn?`, gated by `show*`. Contains **no logic the parts don't**
 * — a hand-assembled layout (`CooperativeChallengeRoot` + a subset of parts)
 * gets identical derivation, identical controlled-echo, and identical telemetry.
 *
 * A safe-by-design cooperative challenge: one shared team goal, collective
 * progress, a whole-team reward, and a penalty-free opt-in. Never forced, never
 * per-individual, never competitive (system §5).
 */
export function CooperativeChallenge01({
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
}: CooperativeChallengeProps) {
  return (
    <CooperativeChallengeRoot
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
      <CooperativeChallengeHeader showMemberStack={showMemberStack} />
      <CooperativeChallengeProgress />
      {showReward ? <CooperativeChallengeReward /> : null}
      {showOptIn ? <CooperativeChallengeOptIn /> : null}
    </CooperativeChallengeRoot>
  );
}
