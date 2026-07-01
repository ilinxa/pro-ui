import type { Milestone, NarrativeChapter, Team } from "./types";

/**
 * Fixtures for `team-quest-log-01` — a team (with + without a `questName`),
 * milestones (mix of done / not-done, some with `doneAt`), and chapters
 * exercising every beat state: done · current ("you are here") · upcoming · an
 * unresolved-`milestoneId` beat. Team-scoped, no inter-team comparison.
 */

export const TEAM_AURORA: Team = {
  id: "team-aurora",
  name: "Team Aurora",
  questName: "The Road to Launch",
};

/** Same team, no quest name → the title falls back to the literal team name. */
export const TEAM_AURORA_DEFAULT: Team = {
  id: "team-aurora",
  name: "Team Aurora",
};

export const MILESTONES: Milestone[] = [
  { id: "m1", label: "Project kickoff", done: true, doneAt: "2026-02-03", order: 1 },
  { id: "m2", label: "First playable build", done: true, doneAt: "2026-03-18", order: 2 },
  { id: "m3", label: "Closed beta", done: false, order: 3 },
  { id: "m4", label: "Public launch", done: false, order: 4 },
  { id: "m5", label: "1.0 retrospective", done: false, order: 5 },
];

/** Full narrative — done, done, current, upcoming, upcoming. */
export const CHAPTERS: NarrativeChapter[] = [
  { id: "c1", title: "Where it began", milestoneId: "m1", order: 1 },
  { id: "c2", title: "It moves!", milestoneId: "m2", order: 2 },
  { id: "c3", title: "Into the wild (beta)", milestoneId: "m3", order: 3 },
  { id: "c4", title: "Doors open", milestoneId: "m4", order: 4 },
  { id: "c5", title: "Looking back", milestoneId: "m5", order: 5 },
];

/** All milestones done → every beat done, no "current". */
export const MILESTONES_ALL_DONE: Milestone[] = MILESTONES.map((m) => ({
  ...m,
  done: true,
  doneAt: m.doneAt ?? "2026-05-01",
}));

/** No milestones done → first beat is "current", rest upcoming. */
export const MILESTONES_NONE_DONE: Milestone[] = MILESTONES.map((m) => ({
  ...m,
  done: false,
  doneAt: undefined,
}));

/** A chapter whose milestoneId matches nothing → renders gracefully (upcoming) + dev-warns. */
export const CHAPTERS_WITH_UNRESOLVED: NarrativeChapter[] = [
  ...CHAPTERS,
  { id: "c6", title: "The lost chapter", milestoneId: "m-missing", order: 6 },
];
