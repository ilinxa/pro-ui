import type { ReactNode } from "react";

/**
 * `cooperative-challenge-01` — public type surface.
 *
 * Framework-free (no `"use client"`): importable from a server component's type
 * position. Per system D-03 every type this component needs is **re-declared
 * locally** — it imports nothing from another registry component. The
 * `gamification-system` description (§4 domain model, §6 telemetry union) is the
 * source of truth these slices are copied from, not imported. The type
 * duplication across the pack is the accepted price of registry independence
 * (system D-03/D-04); the deferred `gamification-kit` may dedupe later.
 */

/**
 * A member of the owning team — identity only. Renders as an avatar in the
 * `TeamMemberStack`; never a per-member progress/contribution surface (§6.3).
 */
export interface TeamMember {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

/**
 * This team (system D-15). Renders team-identity **text** (the optional header
 * name) → takes a `team` object subset, never a bare `teamId`/`teamName` pair.
 * `id` scopes the telemetry payload; `members` feeds the avatar stack.
 */
export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

/**
 * ONE shared team goal (D-C1 — one challenge per component in v1). Progress is a
 * **collective** quantity only (D-C2); the reward is **whole-team** (D-08);
 * opting in is **controlled + never-forced** (D-C3/D-C6).
 */
export interface Challenge {
  id: string;
  /** Header label, e.g. "All 5 members commit a task this morning". Truncated + full text on `title`. */
  label: string;
  /** Controlled, team-level opt-in value (D-C6). Refusing has no penalty. */
  optedIn: boolean;
  /** Collective progress only — never a per-member breakdown (D-C2). */
  progress: { current: number; target: number };
  /** Whole-team reward chip (D-08). Undefined/empty → hidden. */
  reward?: string;
  /** Completed → lightweight inline earned treatment (D-C4). */
  done: boolean;
}

/**
 * The local slice of the system §6 `GamificationEvent` union — **only** the two
 * events this component emits (D-03; a host wiring all six components widens the
 * type at its own telemetry layer). No SDK, no `next/*`.
 */
export type GamificationEvent =
  | { type: "challenge.opened"; teamId: string; challengeId: string }
  | {
      type: "challenge.opt-in";
      teamId: string;
      challengeId: string;
      optedIn: boolean;
    };

/** Data + behavioral surface shared by the assembly and the headless `Root`. */
export interface CooperativeChallengeBaseProps {
  /** The shared team goal to render (one challenge in v1, D-C1). */
  challenge: Challenge;
  /** The team that owns the challenge — name + member stack + scope (D-15). */
  team: Team;
  /** Fires when the team opts in/out (controlled, D-C6). Omit → read-only card (control hides). */
  onOptInChange?: (optedIn: boolean) => void;
  /** Telemetry (system §6, D-07) — emits `challenge.opened` + `challenge.opt-in`. */
  onEvent?: (event: GamificationEvent) => void;
  /** Copy override — the opt-in affordance label. Default `"Join this challenge"`. */
  joinLabel?: string;
  /** Copy override — the opt-out affordance label. Default `"Leave challenge"` (penalty-free). */
  leaveLabel?: string;
  /** Copy override — the cost-free hint. Default `"Optional — no penalty for sitting this one out"`. */
  noPenaltyHint?: string;
}

/** Props for the headless provider `CooperativeChallengeRoot`. */
export interface CooperativeChallengeRootProps
  extends CooperativeChallengeBaseProps {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/** Props for the batteries-included `CooperativeChallenge01` assembly. */
export interface CooperativeChallengeProps
  extends CooperativeChallengeBaseProps {
  /** Show the opt-in control. Default `true`; `false` → card body only. */
  showOptIn?: boolean;
  /** Show the reward chip. Default `true` (auto-hides if no reward). */
  showReward?: boolean;
  /** Show the member avatar stack. Default `true`. */
  showMemberStack?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** Tier-C context-free bare opt-in toggle (droppable on any surface). */
export interface OptInToggleProps {
  optedIn: boolean;
  onOptInChange?: (optedIn: boolean) => void;
  joinLabel?: string;
  leaveLabel?: string;
  noPenaltyHint?: string;
  disabled?: boolean;
  className?: string;
}

/** Tier-C dumb collective progress meter. */
export interface ChallengeProgressMeterProps {
  current: number;
  target: number;
  /** Earned/complete tint (signal-lime); still collective-only, no per-member surface. */
  complete?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** Tier-C dumb reward chip; `earned` switches framing (available → earned). */
export interface ChallengeRewardChipProps {
  reward: string;
  earned?: boolean;
  className?: string;
}

/** Tier-C dumb avatar pile; `max` caps then `+N`. */
export interface TeamMemberStackProps {
  members: TeamMember[];
  /** Max avatars before a `+N` overflow chip. Default `5`. */
  max?: number;
  className?: string;
}

/** Pure derived state (see `lib/derive.ts`). Deterministic, no clock. */
export interface ChallengeDerived {
  /** Clamped 0..1 fill fraction. */
  progressFraction: number;
  /** `${current} / ${target}` (mono). */
  countLabel: string;
  /** `!optedIn && !done` → neutral, joinable, invitation. */
  isJoinable: boolean;
  /** `optedIn && !done` → active, in-motion. */
  isActive: boolean;
  /** `done` → earned/completed (wins over `optedIn`). */
  isComplete: boolean;
  /** `reward` present + non-empty. */
  hasReward: boolean;
}

/** The value every context part reads — one source of truth. */
export interface CooperativeChallengeContextValue {
  challenge: Challenge;
  team: Team;
  derived: ChallengeDerived;
  /** `true` when the opt-in control should render (a handler is wired). */
  canOptIn: boolean;
  /** Toggle opt-in — computes `next`, calls `onOptInChange`, emits telemetry. */
  toggleOptIn: () => void;
  joinLabel: string;
  leaveLabel: string;
  noPenaltyHint: string;
}
