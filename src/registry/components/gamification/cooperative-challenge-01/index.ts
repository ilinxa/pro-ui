// Tier A — batteries-included assembly.
export { CooperativeChallenge01 } from "./cooperative-challenge-01";

// Tier B — headless provider + flat à-la-carte context parts.
export { CooperativeChallengeRoot } from "./parts/cooperative-challenge-root";
export { CooperativeChallengeHeader } from "./parts/cooperative-challenge-header";
export { CooperativeChallengeProgress } from "./parts/cooperative-challenge-progress";
export { CooperativeChallengeReward } from "./parts/cooperative-challenge-reward";
export { CooperativeChallengeOptIn } from "./parts/cooperative-challenge-optin";

// Tier C — standalone, context-free primitives.
export { ChallengeProgressMeter } from "./parts/cooperative-challenge-progress";
export { ChallengeRewardChip } from "./parts/cooperative-challenge-reward";
export { OptInToggle } from "./parts/cooperative-challenge-optin";
export { TeamMemberStack } from "./parts/team-member-stack";
export { CooperativeChallengeSkeleton } from "./parts/cooperative-challenge-skeleton";

// Context consumer for hand-assembled layouts.
export { useCooperativeChallenge } from "./hooks/use-cooperative-challenge";

// Public types.
export type {
  Challenge,
  Team,
  TeamMember,
  GamificationEvent,
  CooperativeChallengeProps,
  CooperativeChallengeBaseProps,
  CooperativeChallengeRootProps,
  CooperativeChallengeContextValue,
  ChallengeDerived,
  OptInToggleProps,
  ChallengeProgressMeterProps,
  ChallengeRewardChipProps,
  TeamMemberStackProps,
} from "./types";
