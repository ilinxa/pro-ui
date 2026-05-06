export { PostCard01 } from "./post-card-01";
export { VerifiedBadge } from "./parts/verified-badge";
export { LikersStrip } from "./parts/likers-strip";
export { ShareMenu } from "./parts/share-menu";
export {
  defaultPostEngagementActions,
  defaultPostKebabActions,
} from "./lib/defaults";

export type {
  Post,
  PostAuthor,
  PostHandlers,
  PostCard01Props,
  PostCard01Handle,
  PostCard01Variant,
  PostCard01Labels,
  EngagementMode,
  PostLikeUser,
} from "./types";

export { DEFAULT_POST_CARD_LABELS } from "./types";

// Re-exports for consumer convenience — single import
export type { MediaItem } from "@/registry/components/media/media-carousel-01";
export type {
  Comment,
  CommentDelta,
  CommentMenuItem,
  CommentThreadCurrentUser,
  Subscribe,
  Unsubscribe,
} from "@/registry/components/data/comment-thread-01";
export type {
  EngagementAction,
  EngagementDelta,
  EngagementBar01Handle,
} from "@/registry/components/data/engagement-bar-01";

export { meta } from "./meta";
