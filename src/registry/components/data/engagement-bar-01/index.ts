export { EngagementBar01 } from "./engagement-bar-01";
export { EngagementHeartBurst } from "./parts/engagement-heart-burst";
export type { EngagementHeartBurstProps } from "./parts/engagement-heart-burst";
export {
  engagementReducer,
  useEngagementState,
  deriveStateFromActions,
} from "./hooks/use-engagement-state";
export type {
  UseEngagementStateOptions,
  UseEngagementStateResult,
} from "./hooks/use-engagement-state";
export { formatEngagementCount } from "./utils/format-count";

export type {
  EngagementBar01Props,
  EngagementBar01Handle,
  EngagementBar01Variant,
  EngagementBarLabels,
  EngagementAction,
  EngagementActionAlign,
  EngagementDelta,
  EngagementLikeUser,
  EngagementState,
  EngagementLocalAction,
  Subscribe,
  Unsubscribe,
} from "./types";

export { DEFAULT_ENGAGEMENT_BAR_LABELS } from "./types";

export { meta } from "./meta";
