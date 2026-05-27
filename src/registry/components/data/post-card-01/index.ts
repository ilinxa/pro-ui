export { PostCard01 } from "./post-card-01";
export { VerifiedBadge } from "./parts/verified-badge";
// v0.2.0 sub-exports — host-side opt-in for inline mention highlighting via
// renderContent slot (MentionText) + standalone tag chip row (TagChips).
// The card auto-renders TagChips below content when post.tags is set; this
// sub-export is for hosts wanting to render the chips elsewhere.
export { MentionText } from "./parts/mention-text";
export type { MentionTextProps } from "./parts/mention-text";
export { TagChips } from "./parts/tag-chips";
export type { TagChipsProps } from "./parts/tag-chips";
// LikersStrip + ShareMenu moved to engagement-bar-01 in v0.2.0; re-exported here
// as a soft-compat affordance so v0.1 consumers that imported them from this
// barrel continue to work. New consumers should import directly from
// @ilinxa/engagement-bar-01.
export {
  LikersStrip,
  ShareMenu,
} from "@/registry/components/data/engagement-bar-01";
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

