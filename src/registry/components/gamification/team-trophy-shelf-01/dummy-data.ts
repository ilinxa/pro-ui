import type { Badge, Team } from "./types";

/** The owning team (identity subset, D-15). */
export const TEAM_AURORA: Team = { id: "T-001", name: "Team Aurora" };

/**
 * A mixed shelf — 4 earned, 5 locked (→ "4 / 9"), exercising earned/locked
 * states, an award date, a long label (truncation), and a stale `milestoneId`
 * (points at a milestone the host may no longer have — the badge still renders).
 */
export const TEAM_AURORA_BADGES: Badge[] = [
  { id: "b-1", label: "Kickoff", awardedAt: "2026-01-08T10:00:00Z", milestoneId: "m-1" },
  { id: "b-2", label: "First playable build", awardedAt: "2026-02-03T16:30:00Z", milestoneId: "m-3" },
  { id: "b-3", label: "Internal playtest", awardedAt: "2026-02-17T09:15:00Z", milestoneId: "m-4" },
  { id: "b-4", label: "Vertical slice", awardedAt: "2026-03-02T12:00:00Z", milestoneId: "m-5" },
  { id: "b-5", label: "Beta milestone", milestoneId: "m-6" },
  { id: "b-6", label: "Content complete", milestoneId: "m-7" },
  { id: "b-7", label: "Localization pass finished", milestoneId: "m-stale" },
  { id: "b-8", label: "Launch candidate", milestoneId: "m-8" },
  { id: "b-9", label: "Shipped", milestoneId: "m-9" },
];

/** All earned — a fully-completed journey ("9 / 9"). */
export const TEAM_AURORA_ALL_EARNED: Badge[] = TEAM_AURORA_BADGES.map((b) => ({
  ...b,
  awardedAt: b.awardedAt ?? "2026-03-20T12:00:00Z",
}));

/** No badges defined yet — the always-designed empty state. */
export const EMPTY_BADGES: Badge[] = [];
