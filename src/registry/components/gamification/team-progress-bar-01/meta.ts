import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "team-progress-bar-01",
  name: "Team Progress Bar",
  category: "gamification",

  description:
    "An always-visible, read-only progress bar showing one team's milestone-completion % — signal-lime fill, optional per-milestone ticks and numeric/fraction readout, with a viewed-once telemetry event. Cooperative and team-scoped: no comparison, no ranking, ever.",
  context:
    "The header cue for a gamified team board: answers \"how far is our team through the journey?\" to build competence (SDT) without tipping into comparison. Takes either a Milestone[] (computes done/total) or a direct value (0–100); draws a signal-lime fill on the shadcn progress primitive, optionally overlays per-milestone tick notches and a percent/fraction readout, animates the fill on change (reduced-motion aware), and emits progress-bar.checked once when first scrolled into view. Ships as a light shadcn-style compound — headless TeamProgressBarRoot (resolves the % + owns telemetry + holds context) + flat parts (TeamProgressBarTrack, TeamProgressBarLabel) + a context-free ProgressTrack primitive + the TeamProgressBar01 assembly — so a bar-only header falls out by dropping the Label. Cooperative-only and team-scoped by design (system D-08): one team's own % only — never another team's bar, a leaderboard, a ranking, or a per-member split. Portable: zero next/*, no app context, no other registry import; SSR-safe; all data is the host's. First component of the gamification-system.",
  features: [
    "One team's milestone-completion % — done/total from a Milestone[], or a direct 0–100 value",
    "Always visible, read-only: no milestones yet renders a 0% bar, never nothing",
    "Optional per-milestone tick notches (filled = done, in order) + percent/fraction readout",
    "Signal-lime fill with a reduced-motion-aware transition; one reveal-up entrance",
    "progress-bar.checked telemetry — emitted once per mount on first in-viewport reveal",
    "Cooperative + team-scoped: no comparison, second series, ranking, or per-member split — ever",
    "Light compound: headless Root + flat parts + context-free ProgressTrack; drop the Label for a free bar-only header",
  ],
  tags: [
    "team-progress-bar",
    "gamification",
    "progress",
    "milestones",
    "team",
    "cooperative",
    "telemetry",
  ],

  version: "0.1.1",
  status: "alpha",
  createdAt: "2026-07-01",
  updatedAt: "2026-07-01",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["progress"],
    npm: {},
    internal: [],
  },

  related: ["progress-timeline-01", "stat-card"],
};
