export { StoryViewer01 } from "./story-viewer-01";

export {
  storyViewerReducer,
  useStoryViewerState,
  type UseStoryViewerStateOptions,
  type UseStoryViewerStateResult,
} from "./hooks/use-story-viewer-state";

export {
  useStoryProgress,
  type UseStoryProgressOptions,
} from "./hooks/use-story-progress";

export {
  useStoryKeyboardNav,
  type UseStoryKeyboardNavOptions,
} from "./hooks/use-story-keyboard-nav";

export type {
  // v0.1 core
  Story,
  StoryItem,
  StoryItemLink,
  StoryViewer01Props,
  StoryViewer01Handle,
  StoryViewer01Labels,
  ResolvedStoryViewer01Labels,
  StoryViewerDelta,
  StoryViewerLocalAction,
  RenderItemContext,
  Subscribe,
  Unsubscribe,
  // v0.2.0 — role / permissions
  StoryViewerMode,
  StoryViewerPermissions,
  StoryPermissionAction,
  // v0.2.0 — engagement realtime + actions
  StoryEngagementDelta,
  StoryEngagementLocalAction,
  StoryEngagementAction,
  StoryEngagementActionAlign,
  StoryEngagementReactionKind,
  StoryEngagementBarLabels,
  // v0.2.0 — owner overlay + reactors
  ViewerListItem,
  StoryReactorProfile,
  // v0.2.0 — DM composer / reply
  StoryCurrentUser,
  StoryReplyComposerLabels,
  // v0.2.0 — kebab
  StoryKebabMenuItem,
  // v0.2.0 — slot helpers
  StoryViewerSlotHelpers,
} from "./types";

export { DEFAULT_STORY_VIEWER_LABELS } from "./types";

