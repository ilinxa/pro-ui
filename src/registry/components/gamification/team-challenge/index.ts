// Tier A — batteries-included assembly.
export { TeamChallenge } from "./team-challenge";

// Tier B — headless provider + flat à-la-carte context parts.
export { TeamChallengeRoot } from "./parts/team-challenge-root";
export { TeamChallengeHeader } from "./parts/team-challenge-header";
export { TeamChallengeProgress } from "./parts/team-challenge-progress";
export { TeamChallengeReward } from "./parts/team-challenge-reward";
export { TeamChallengeOptIn } from "./parts/team-challenge-optin";

// Tier C — standalone, context-free primitives.
export { ChallengeProgressMeter } from "./parts/team-challenge-progress";
export { ChallengeRewardChip } from "./parts/team-challenge-reward";
export { OptInToggle } from "./parts/team-challenge-optin";
export { TeamMemberStack } from "./parts/team-member-stack";
export { TeamChallengeSkeleton } from "./parts/team-challenge-skeleton";

// Context consumer for hand-assembled layouts.
export { useTeamChallenge } from "./hooks/use-team-challenge";

// Public types.
export type {
  Challenge,
  Team,
  TeamMember,
  GamificationEvent,
  TeamChallengeProps,
  TeamChallengeBaseProps,
  TeamChallengeRootProps,
  TeamChallengeContextValue,
  ChallengeDerived,
  OptInToggleProps,
  ChallengeProgressMeterProps,
  ChallengeRewardChipProps,
  TeamMemberStackProps,
} from "./types";
