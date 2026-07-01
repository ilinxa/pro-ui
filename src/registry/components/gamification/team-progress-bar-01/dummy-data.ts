import type { Milestone } from "./types";

/**
 * A team's milestone journey — 5 of 8 done (→ 63%), exercising tick ordering
 * and labels. `order` is intentionally out of array order on a couple of rows
 * so the resolver's sort-by-order is visibly load-bearing.
 */
export const TEAM_AURORA_MILESTONES: Milestone[] = [
  { id: "m-1", label: "Kickoff & team charter", done: true, order: 1, doneAt: "2026-01-08" },
  { id: "m-2", label: "Research synthesis", done: true, order: 2, doneAt: "2026-01-20" },
  { id: "m-4", label: "Internal playtest", done: true, order: 4, doneAt: "2026-02-17" },
  { id: "m-3", label: "First playable build", done: true, order: 3, doneAt: "2026-02-03" },
  { id: "m-5", label: "Vertical slice", done: true, order: 5, doneAt: "2026-03-02" },
  { id: "m-6", label: "Beta milestone", done: false, order: 6 },
  { id: "m-7", label: "Content complete", done: false, order: 7 },
  { id: "m-8", label: "Launch candidate", done: false, order: 8 },
];

/** No milestones yet — the always-visible 0% edge case (`total === 0`). */
export const EMPTY_MILESTONES: Milestone[] = [];

/** The team identity passed alongside the milestones (system D-15 subset). */
export const TEAM_AURORA = { id: "T-001", name: "Team Aurora" } as const;
