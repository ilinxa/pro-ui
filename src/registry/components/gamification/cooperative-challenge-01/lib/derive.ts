import type { Challenge, ChallengeDerived } from "../types";

/**
 * The pure derivation layer — SSR-deterministic (derives only from the
 * `challenge` prop; never reads `Date`, `Math.random`, layout, or env). Test-
 * ready and a prime candidate to hoist into a shared `gamification-kit` once
 * 2–3 components prove the surface (system §7.3) — keep it standalone.
 *
 * No component-invented progress notion (system D-09 spirit): progress is
 * exactly `challenge.progress`; the card never derives it from milestones.
 */

/** Default never-forced copy — one source of truth for the Root + the bare Tier-C toggle. */
export const DEFAULT_JOIN_LABEL = "Join this challenge";
export const DEFAULT_LEAVE_LABEL = "Leave challenge";
export const DEFAULT_NO_PENALTY_HINT =
  "Optional — no penalty for sitting this one out";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}

/**
 * Resolve every rendered value from the `challenge`. The `max(target, 1)`
 * divisor avoids NaN/Infinity on the `target === 0` degenerate input (§9); the
 * count label always shows the host's raw `current / target` (never silently
 * rewritten, even when `current > target` — the bar caps at 100%, the count
 * tells the truth).
 */
export function deriveChallenge(challenge: Challenge): ChallengeDerived {
  const { current, target } = challenge.progress;
  const progressFraction = clamp(current / Math.max(target, 1), 0, 1);
  const isComplete = challenge.done;
  const hasReward =
    challenge.reward != null && challenge.reward.trim() !== "";

  return {
    progressFraction,
    countLabel: `${current} / ${target}`,
    // `done` wins over `optedIn` — a completed challenge reads as earned regardless.
    isJoinable: !challenge.optedIn && !isComplete,
    isActive: challenge.optedIn && !isComplete,
    isComplete,
    hasReward,
  };
}
