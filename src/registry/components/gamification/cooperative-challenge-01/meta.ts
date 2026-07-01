import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "cooperative-challenge-01",
  name: "Cooperative Challenge",
  category: "gamification",

  description:
    "A safe-by-design cooperative team challenge card: one shared goal, collective progress, a whole-team reward, and a penalty-free opt-in where opting out is neutral and cost-free. Never forced, never per-individual, never competitive.",
  context:
    "The Relatedness surface of the gamification pack (E3). Renders one Challenge for one Team — label + member stack, a collective progress meter (current / target, never per-member), a whole-team reward chip (system D-08), and a team-level opt-in control where opted-out is a first-class, neutral, joinable state (the CRITICAL never-forced rule made literal: joining is a prominent invite, leaving is one click with no confirm/guilt, and a visible no-penalty hint states refusing is cost-free). On done, a lightweight inline earned acknowledgement (a 'Completed together' pill, non-blocking, no modal) — the heavy celebration overlay belongs to team-feedback-loop-01 (E6), composed alongside; neither triggers the other. Opt-in is controlled-only; omitting onOptInChange collapses to a read-only card. Ships as a light shadcn-style compound — headless CooperativeChallengeRoot (controlled echo + telemetry chokepoint) + flat parts (Header, Progress, Reward, OptIn) + context-free primitives (ChallengeProgressMeter, ChallengeRewardChip, OptInToggle, TeamMemberStack, Skeleton) + the CooperativeChallenge01 assembly — so a card-body-only or opt-in-control-only subset falls out. Emits challenge.opened (first mount, double-emit-guarded) + challenge.opt-in via onEvent. Portable: zero next/*, own types.ts slice, no other registry import; SSR-safe. Third component of the gamification-system.",
  features: [
    "One shared team goal — label + member stack, collective progress (current / target), whole-team reward",
    "Never-forced opt-in: opted-out is a neutral, first-class, cost-free invitation — never greyed-as-failure",
    "Penalty-free leave: one click, no confirm dialog, no guilt copy; a visible no-penalty hint in both states",
    "Collective progress only — never a per-member breakdown or ranking; the avatar stack is identity, not progress",
    "Whole-team reward framing (the team earns / earned) — never first-person, never per-member",
    "Done = a lightweight inline 'Completed together' ack (non-blocking, no modal); heavy celebration deferred to E6",
    "challenge.opened + challenge.opt-in telemetry via onEvent — no SDK, no next/*",
    "Light compound: headless Root + flat parts + context-free primitives; drop to a card-body-only or toggle-only subset",
  ],
  tags: [
    "cooperative-challenge",
    "gamification",
    "challenge",
    "relatedness",
    "opt-in",
    "team",
    "cooperative",
    "telemetry",
  ],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-07-01",
  updatedAt: "2026-07-01",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["progress", "avatar", "button", "badge", "skeleton"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["team-progress-bar-01", "team-trophy-shelf-01", "team-feedback-loop-01"],
};
