import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "team-trophy-shelf-01",
  name: "Team Trophy Shelf",
  category: "gamification",

  description:
    "A durable gallery of a team's earned milestone badges, with honest locked slots for what's ahead, an optional header count, and a brief (<1s), skippable, non-blocking reveal when a badge is newly earned. Cooperative and team-scoped: team-owned badges only — no ranking, no per-member split, ever.",
  context:
    "The \"what has this team accomplished?\" surface the progress bar can't express — recognition + shared pride, not status. Takes Badge[] (awardedAt is the single earned/locked discriminator) + the owning team; lays earned tokens and locked slots in a responsive grid, shows an awarded-date tooltip on hover, and plays a diff-driven award reveal when a controlled badges update flips a badge's awardedAt on (SSR-safe — nothing animates on load; respects prefers-reduced-motion). Ships as a shadcn-style compound — headless TeamTrophyShelfRoot + flat parts (Grid, Header, Empty) + the standalone Tier-C TeamMilestoneBadge token + a React.lazy BadgeAwardOverlay — so the bare token falls out for free and animateAward=false / the bare-token path never load the award chunk. D-16 (celebration ownership): a host routing badge events to team-feedback-loop-01 sets animateAward=false so the moment isn't celebrated twice; neither component triggers the other. Cooperative-only and team-scoped by design (D-08): no per-individual, inter-team, or public affordance. Portable: zero next/*, no app context, SSR-safe, imports no other registry component. Second component of the gamification-system.",
  features: [
    "Responsive gallery of a team's earned milestone badges + honest locked slots (showLocked)",
    "awardedAt is the single earned/locked discriminator; awarded-date on hover (tooltip)",
    "Diff-driven, SSR-safe award reveal (<1s, skippable, non-blocking, reduced-motion-aware) — nothing animates on load",
    "Standalone TeamMilestoneBadge token — usable inline with zero shelf scaffolding",
    "badges.viewed telemetry (once on first view; with badgeId on open)",
    "Cooperative + team-scoped: team-owned only, no ranking / per-member / inter-team surface — ever",
    "Compound: headless Root + flat parts + React.lazy award overlay; bare-token path & animateAward=false drop the award chunk",
    "D-16 celebration ownership — set animateAward=false to defer the moment to team-feedback-loop-01",
  ],
  tags: [
    "team-trophy-shelf",
    "gamification",
    "badges",
    "milestones",
    "achievements",
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
    shadcn: ["tooltip", "badge", "separator"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["team-progress-bar-01", "progress-timeline-01"],
};
