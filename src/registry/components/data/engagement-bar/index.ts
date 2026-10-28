export { EngagementBar } from "./engagement-bar";
export { EngagementHeartBurst } from "./parts/engagement-heart-burst";
export type { EngagementHeartBurstProps } from "./parts/engagement-heart-burst";
export { LikersStrip, defaultLikersStripLabels } from "./parts/likers-strip";
export type { LikersStripProps, LikersStripLabels } from "./parts/likers-strip";
export { ShareMenu, defaultShareMenuLabels } from "./parts/share-menu";
export type { ShareMenuProps, ShareMenuLabels } from "./parts/share-menu";
export { ReactionPicker } from "./parts/reaction-picker";
export type { ReactionPickerProps } from "./parts/reaction-picker";
export { ReactionAction } from "./parts/reaction-action";
export type { ReactionActionProps } from "./parts/reaction-action";
export {
  engagementReducer,
  useEngagementState,
  deriveStateFromActions,
} from "./hooks/use-engagement-state";
export type {
  UseEngagementStateOptions,
  UseEngagementStateResult,
} from "./hooks/use-engagement-state";
export { formatEngagementCount } from "./lib/format-count";

export type {
  EngagementBarProps,
  EngagementBarHandle,
  EngagementBarVariant,
  EngagementBarLabels,
  ResolvedEngagementBarLabels,
  EngagementAction,
  EngagementActionAlign,
  EngagementActionEvent,
  EngagementCount,
  EngagementHandler,
  EngagementDelta,
  EngagementLikeUser,
  EngagementLikerProfile,
  EngagementReactionKind,
  EngagementState,
  EngagementLocalAction,
  Subscribe,
  Unsubscribe,
} from "./types";

export { defaultEngagementBarLabels, DEFAULT_ENGAGEMENT_BAR_LABELS } from "./types";
