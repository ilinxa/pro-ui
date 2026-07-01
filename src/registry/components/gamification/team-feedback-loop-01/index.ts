// Tier A — batteries-included assembly.
export { TeamFeedbackLoop01 } from "./team-feedback-loop-01";

// Tier B — headless provider + flat à-la-carte parts.
export { TeamFeedbackLoopRoot } from "./parts/team-feedback-loop-root";
export { TeamFeedbackCelebration } from "./parts/team-feedback-celebration";
export { TeamFeedbackNudge } from "./parts/team-feedback-nudge";

// Tier C — context-free primitives. ConfettiBurst is the lazy-chunk host; the
// Grid pulls it via React.lazy, so importing it here for standalone use does not
// force it into a default consumer's bundle (unused re-exports tree-shake).
export { CelebrationOverlay } from "./parts/celebration-overlay";
export { NextTaskNudge } from "./parts/next-task-nudge";
export { default as ConfettiBurst } from "./parts/confetti-burst";

// Context consumer for hand-assembled layouts.
export { useTeamFeedbackLoop } from "./hooks/use-team-feedback-context";

// Public types.
export type {
  TeamFeedbackLoop01Props,
  TeamFeedbackLoopRootProps,
  TeamFeedbackLoopBaseProps,
  TeamFeedbackLoopHandle,
  TeamFeedbackContextValue,
  CelebrationOverlayProps,
  NextTaskNudgeProps,
  FeedbackEvent,
  NextTaskSuggestion,
  NudgePlacement,
  GamificationEvent,
} from "./types";
