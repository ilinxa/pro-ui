export { EngagementBar } from "./engagement-bar";
export { EngagementHeartBurst } from "./parts/engagement-heart-burst";
export type { EngagementHeartBurstProps } from "./parts/engagement-heart-burst";
export { LikersStrip } from "./parts/likers-strip";
export type { LikersStripProps } from "./parts/likers-strip";
export { ShareMenu } from "./parts/share-menu";
export type { ShareMenuProps } from "./parts/share-menu";
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
  EngagementAction,
  EngagementActionAlign,
  EngagementDelta,
  EngagementLikeUser,
  EngagementLikerProfile,
  EngagementReactionKind,
  EngagementState,
  EngagementLocalAction,
  Subscribe,
  Unsubscribe,
} from "./types";

export { DEFAULT_ENGAGEMENT_BAR_LABELS } from "./types";

