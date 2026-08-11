export { PostCard } from "./post-card";
export { VerifiedBadge } from "./parts/verified-badge";
// v0.2.0 sub-exports — host-side opt-in for inline mention highlighting via
// renderContent slot (MentionText) + standalone tag chip row (TagChips).
// The card auto-renders TagChips below content when post.tags is set; this
// sub-export is for hosts wanting to render the chips elsewhere.
export { MentionText } from "./parts/mention-text";
export type { MentionTextProps } from "./parts/mention-text";
export { TagChips } from "./parts/tag-chips";
export type { TagChipsProps } from "./parts/tag-chips";
// v0.2.0 sub-export — host-side opt-in for rendering a nested repost mini-card
// outside the auto-rendered feed/detail slot (e.g. inside a custom layout).
export { RepostOfCard } from "./parts/repost-of-card";
export type { RepostOfCardProps } from "./parts/repost-of-card";
// v0.2.0 sub-export — host-side opt-in for rendering an inline poll widget
// outside the auto-rendered feed/detail slot (e.g. a standalone poll page).
export { PollWidget } from "./parts/poll-widget";
export type { PollWidgetProps } from "./parts/poll-widget";
// LikersStrip + ShareMenu moved to engagement-bar in v0.2.0; re-exported here
// as a soft-compat affordance so v0.1 consumers that imported them from this
// barrel continue to work. New consumers should import directly from
// @ilinxa/engagement-bar.
// v0.3.1 F-S1 lock: relative + specific-file paths so shadcn 4.6.0's
// path-rewriter doesn't mangle these cross-procomp re-exports.
export { LikersStrip } from "../engagement-bar/parts/likers-strip";
export { ShareMenu } from "../engagement-bar/parts/share-menu";
export {
  defaultPostEngagementActions,
  defaultPostKebabActions,
} from "./lib/defaults";

export type {
  Post,
  PostAuthor,
  PostHandlers,
  PostCardProps,
  PostCardHandle,
  PostCardVariant,
  PostCardLabels,
  EngagementMode,
  PostLikeUser,
} from "./types";

export { DEFAULT_POST_CARD_LABELS } from "./types";

// Re-exports for consumer convenience — single import.
// v0.3.1 F-S1 lock: relative + specific-file paths.
// v0.3.2: cross-category MediaItem re-export DROPPED — the shadcn rewriter
// mangles cross-category /types imports. `PostMediaItem` is now defined in
// `./types.ts` (structurally identical to media-carousel's MediaItem),
// with a soft-compat `MediaItem` alias re-exported below.
export type { PostMediaItem, MediaItem } from "./types";
export type {
  Comment,
  CommentDelta,
  CommentMenuItem,
  CommentThreadCurrentUser,
  Subscribe,
  Unsubscribe,
} from "../comment-thread/types";
export type {
  EngagementAction,
  EngagementDelta,
  EngagementBarHandle,
} from "../engagement-bar/types";

