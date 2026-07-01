// Tier A — batteries-included assembly.
export { TeamProgressBar01 } from "./team-progress-bar-01";

// Tier B — headless provider + flat à-la-carte parts.
export { TeamProgressBarRoot } from "./parts/team-progress-bar-root";
export { TeamProgressBarTrack } from "./parts/team-progress-bar-track";
export { TeamProgressBarLabel } from "./parts/team-progress-bar-label";

// Tier C — context-free primitive.
export { ProgressTrack } from "./parts/team-progress-bar-track";

// Context consumer for hand-assembled layouts.
export { useTeamProgressBar } from "./hooks/use-team-progress-bar";

// Public types.
export type {
  TeamProgressBar01Props,
  TeamProgressBarRootProps,
  TeamProgressBarBaseProps,
  TeamProgressBarContextValue,
  ProgressTrackProps,
  Milestone,
  TeamProgressBarTeam,
  GamificationEvent,
  ProgressLabelFormat,
  ProgressTick,
  ResolvedProgress,
} from "./types";
