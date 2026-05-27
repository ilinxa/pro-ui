export { EngagementBar01 } from "./engagement-bar-01";
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
  EngagementBar01Props,
  EngagementBar01Handle,
  EngagementBar01Variant,
  EngagementBarLabels,
  EngagementAction,
  EngagementActionAlign,
  EngagementDelta,
  EngagementLikeUser,
  EngagementLikerProfile,
  EngagementState,
  EngagementLocalAction,
  Subscribe,
  Unsubscribe,
} from "./types";

export { DEFAULT_ENGAGEMENT_BAR_LABELS } from "./types";

