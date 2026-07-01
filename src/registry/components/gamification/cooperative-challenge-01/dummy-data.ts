import type { Challenge, Team } from "./types";

/**
 * Fixtures for `cooperative-challenge-01` — exercise every state the card must
 * cover (description §10): joinable (opted-out) · active · complete · no-reward ·
 * target-0 edge · single-member · overflowing stack · long label. Team-scoped +
 * cooperative only — no per-member progress, no ranking (system §5).
 */

export const TEAM_AURORA: Team = {
  id: "team-aurora",
  name: "Team Aurora",
  members: [
    { id: "m1", displayName: "Mara Ito" },
    { id: "m2", displayName: "Devan Roy" },
    { id: "m3", displayName: "Sana Okafor" },
    { id: "m4", displayName: "Leo Fischer" },
    { id: "m5", displayName: "Priya Nair" },
  ],
};

export const TEAM_SOLO: Team = {
  id: "team-solo",
  name: "Team Nimbus",
  members: [{ id: "s1", displayName: "Ada Chen" }],
};

export const TEAM_LARGE: Team = {
  id: "team-large",
  name: "Team Meridian",
  members: [
    { id: "l1", displayName: "Noah Park" },
    { id: "l2", displayName: "Ivy Sol" },
    { id: "l3", displayName: "Kofi Mensah" },
    { id: "l4", displayName: "Rin Tanaka" },
    { id: "l5", displayName: "Omar Haddad" },
    { id: "l6", displayName: "Beatriz Luz" },
    { id: "l7", displayName: "Yuki Mori" },
  ],
};

/** Opted-out → the neutral, joinable, penalty-free invitation (the load-bearing state). */
export const CHALLENGE_JOINABLE: Challenge = {
  id: "ch-joinable",
  label: "All 5 members commit a task this morning",
  optedIn: false,
  progress: { current: 2, target: 5 },
  reward: "A shared afternoon off",
  done: false,
};

/** Opted-in, in motion. */
export const CHALLENGE_ACTIVE: Challenge = {
  id: "ch-active",
  label: "Close every stale review by Friday",
  optedIn: true,
  progress: { current: 3, target: 5 },
  reward: "Team lunch on the house",
  done: false,
};

/** Completed → whole-team earned treatment. */
export const CHALLENGE_COMPLETE: Challenge = {
  id: "ch-complete",
  label: "Ship the onboarding flow together",
  optedIn: true,
  progress: { current: 5, target: 5 },
  reward: "Team lunch on the house",
  done: true,
};

/** Active, no reward → reward chip auto-hides. */
export const CHALLENGE_NO_REWARD: Challenge = {
  id: "ch-no-reward",
  label: "Pair on one tricky bug this week",
  optedIn: true,
  progress: { current: 1, target: 4 },
  done: false,
};

/** Degenerate-but-safe: target 0 → 0% fill, "0 / 0", never NaN. */
export const CHALLENGE_TARGET_ZERO: Challenge = {
  id: "ch-target-zero",
  label: "Warm-up challenge (no target set yet)",
  optedIn: false,
  progress: { current: 0, target: 0 },
  done: false,
};

/** Long label → truncation + `title` fallback. */
export const CHALLENGE_LONG_LABEL: Challenge = {
  id: "ch-long",
  label:
    "Every member records at least one asynchronous stand-up update before noon so nobody is blocked over the long weekend",
  optedIn: false,
  progress: { current: 4, target: 7 },
  reward: "The team picks the next sprint's focus together",
  done: false,
};
