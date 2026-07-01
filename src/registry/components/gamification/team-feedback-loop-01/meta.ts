import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "team-feedback-loop-01",
  name: "Team Feedback Loop",
  category: "gamification",

  description:
    "A host-triggered, NON-BLOCKING cooperative feedback layer: a brief (<1s), skippable celebration overlay when team progress advances (milestone / badge / task-complete), plus a gentle, dismissible next-task nudge. Owns no state — the host triggers it, it renders the moment and gets out of the way. Team-scoped copy only, never an individual.",
  context:
    "The gamification-system's feedback layer (E6, Competence) — closes the engagement + progression loops. The host pushes a FeedbackEvent (controlled event prop OR imperative celebrate() — both funnel into one reducer, newest wins, never stack) and the component renders a brief celebration band and a standing next-task nudge. The cardinal constraint is D-10 NON-BLOCKING: the board stays fully interactive during a celebration (pointer-events:none except the skip button), focus is never moved or trapped, and celebrationDurationMs is clamped to <1000ms so a lingering modal is impossible; skip via ✕ or Esc. Reduced-motion is a real static branch (no movement, no confetti, still time-boxed + skippable). The default flourish is token CSS reveal-up (zero library); an opt-in canvas-confetti burst is React.lazy for milestone/badge only, so the default consumer never loads it. Ships as a shadcn-style compound — headless TeamFeedbackLoopRoot (the reducer + timer + reduced-motion + imperative handle) + flat parts (TeamFeedbackCelebration, TeamFeedbackNudge) + Tier-C primitives (CelebrationOverlay, NextTaskNudge, lazy ConfettiBurst). D-16: neither this nor team-trophy-shelf-01 triggers the other; the host routes each event kind to exactly one celebrator (set the shelf's animateAward=false to let this own it). Cooperative + team-scoped (D-08): no individual-subject copy, no per-member call-out, no inter-team/public surface. Portable: zero next/*, SSR-safe, imports no other registry component. Third component of the gamification-system.",
  features: [
    "Brief (<1s), skippable, NON-BLOCKING celebration overlay — clamped timer, click-through, no focus trap (D-10)",
    "Two trigger paths (controlled event prop + imperative celebrate()) funnel into one reducer — newest wins, never stack",
    "Gentle, penalty-free next-task nudge (inline or corner), independent of the celebration lifecycle",
    "Reduced-motion static branch — no movement, no confetti, still time-boxed + skippable",
    "Opt-in canvas-confetti burst, React.lazy for milestone/badge — the default CSS flourish keeps it out of the bundle",
    "Team-scoped copy only — never an individual (D-08); onEvent accepted for symmetry, emits nothing (E6)",
    "Compound: headless Root + flat parts + lazy confetti; drop either surface for a subset",
    "D-16 celebration ownership — set the trophy shelf's animateAward=false to defer the moment here",
  ],
  tags: [
    "team-feedback-loop",
    "gamification",
    "celebration",
    "confetti",
    "nudge",
    "non-blocking",
    "team",
    "cooperative",
  ],

  version: "0.1.1",
  status: "alpha",
  createdAt: "2026-07-01",
  updatedAt: "2026-07-01",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button"],
    npm: {
      "canvas-confetti": "^1.9.4",
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["team-trophy-shelf-01", "team-progress-bar-01"],
};
