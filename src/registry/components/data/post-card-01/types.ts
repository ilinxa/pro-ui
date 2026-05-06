import type { ElementType, ReactNode } from "react";
import type { MediaItem } from "@/registry/components/media/media-carousel-01";
import type {
  Comment,
  CommentDelta,
  CommentMenuItem,
  CommentThreadCurrentUser,
  CommentThreadLabels,
  CommentThread01Handle,
  Subscribe,
} from "@/registry/components/data/comment-thread-01";
import type {
  EngagementAction,
  EngagementBar01Handle,
  EngagementBarLabels,
  EngagementDelta,
} from "@/registry/components/data/engagement-bar-01";

export type PostCard01Variant = "feed" | "compact" | "list" | "detail";

/**
 * Behavior of the comment + like actions:
 *  - `"inline"` (default): like splits into heart (toggle) + count (open likers panel inline);
 *    comment toggles an inline `<CommentThread01>` (with composer) below the engagement bar.
 *    Card owns the panel state. Matches the kasder PostEngagementPanel UX.
 *  - `"navigate"`: comment-icon click fires `onComment(postId)` (host navigates / scrolls);
 *    like is a single button (heart + count bundled, fires `onLike(postId, next)`). No inline panels.
 *
 * Default is `"inline"` so the canonical social UX works without opt-in. Pass `"navigate"` to
 * deactivate the inline panels for a host that wants page navigation instead.
 */
export type EngagementMode = "navigate" | "inline";

export interface PostLikeUser {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export interface PostAuthor {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  media?: MediaItem[];
  createdAt: Date | string | number;
  likes: number;
  isLiked?: boolean;
  comments: number;
  shares?: number;
  viewCount?: number;
  isBookmarked?: boolean;
}

/** Engagement-action handlers only — comment handlers stay separate. */
export interface PostHandlers {
  onLike?: (postId: string, nextLiked: boolean) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string, nextBookmarked: boolean) => void;
}

export interface PostCard01Labels {
  verifiedBadgeLabel?: string;
  bookmark?: string;
  unbookmark?: string;
  share?: string;
  copyLink?: string;
  report?: string;
  commentsHeading?: string;
  /** Inline likers panel heading. Default "Likes". */
  likersHeading?: string;
  /** Likers panel "+N" pill aria-label template; `{count}` is replaced. Default "+{count} more". */
  likersMoreLabel?: string;
  /** Inline panel "Hide" button label. Default "Hide". */
  hidePanelLabel?: string;
  /** Share panel heading. Default "Share with…". */
  shareHeading?: string;
  /** Share panel search placeholder. Default "Search people…". */
  shareSearchPlaceholder?: string;
  /** Share panel empty-state. Default "No matches." */
  shareEmptyLabel?: string;
  formatRelativeTime?: (date: Date, now: Date) => string;
  engagementLabels?: EngagementBarLabels;
  commentLabels?: CommentThreadLabels;
}

export const DEFAULT_POST_CARD_LABELS: Required<
  Omit<
    PostCard01Labels,
    "formatRelativeTime" | "engagementLabels" | "commentLabels"
  >
> = {
  verifiedBadgeLabel: "Verified account",
  bookmark: "Bookmark",
  unbookmark: "Remove bookmark",
  share: "Share",
  copyLink: "Copy link",
  report: "Report",
  commentsHeading: "Comments",
  likersHeading: "Likes",
  likersMoreLabel: "+{count} more",
  hidePanelLabel: "Hide",
  shareHeading: "Share with…",
  shareSearchPlaceholder: "Search people…",
  shareEmptyLabel: "No matches.",
};

export interface PostCard01Props extends PostHandlers {
  variant: PostCard01Variant;
  post: Post;
  currentUser?: CommentThreadCurrentUser;

  commentThread?: Comment[];
  commentPageSize?: number;

  onAddComment?: (
    content: string,
    parentId?: string,
  ) => Promise<Comment | void> | Comment | void;
  onLikeComment?: (commentId: string, nextLiked: boolean) => void;
  onDeleteComment?: (commentId: string) => void;
  onReportComment?: (commentId: string) => void;
  onLoadMoreComments?: (page: number) => Promise<Comment[]>;
  onCopyLink?: (postId: string) => void;
  onReport?: (postId: string) => void;

  engagementSubscribe?: Subscribe<EngagementDelta>;
  commentSubscribe?: Subscribe<CommentDelta>;
  onSubscribeEngagementDelta?: (delta: EngagementDelta) => void;
  onSubscribeCommentDelta?: (delta: CommentDelta) => void;

  /** Card overlay-link target + Copy-link kebab item. Ignored for overlay-link in detail variant. */
  getHref?: (post: Post) => string;
  /** Polymorphic root component for overlay-link. Default "a". */
  linkComponent?: ElementType;
  /** Opt-out for the canonical heart-burst flow. Default false. */
  disableHeartBurst?: boolean;

  // ─── Inline engagement panels (kasder UX) ───
  /**
   * `"navigate"` (default): comment click → `onComment(postId)`; no inline panels.
   * `"inline"`: comment click toggles `<CommentThread01>` panel; like opens inline likers strip.
   */
  engagementMode?: EngagementMode;
  /** Pre-loaded likers (for inline likers panel). Only used when `engagementMode === "inline"`. */
  likers?: PostLikeUser[];
  /** Fetch more likers — host returns appended page; component appends to local state. */
  onLoadMoreLikers?: () => Promise<PostLikeUser[]>;

  /** Recent / suggested users for the share panel. When provided, share button opens
   * an inline searchable user list (kasder UX). Otherwise share fires `onShare(postId)`. */
  shareSuggestions?: PostLikeUser[];
  /** Optional async search for the share panel. Receives the query, returns matching users. */
  onShareSearch?: (query: string) => Promise<PostLikeUser[]>;
  /** Fired when the user picks a recipient from the share panel. */
  onShareTo?: (postId: string, recipient: PostLikeUser) => void;
  /** Max-height of the inline comments panel before scroll. Default `"24rem"` (~384px). */
  inlineCommentsMaxHeight?: string;
  /** Open one of the inline panels by default on mount (only when `engagementMode === "inline"`). */
  defaultInlinePanel?: "none" | "likes" | "comments";
  /** Auto-open the likers panel on like (matches kasder). Default true under inline mode. */
  openLikersOnLike?: boolean;

  renderHeader?: (
    post: Post,
    helpers: { currentUser?: CommentThreadCurrentUser },
  ) => ReactNode;
  renderContent?: (post: Post) => ReactNode;
  renderMedia?: (
    media: MediaItem[],
    helpers: { onDoubleTap?: () => void },
  ) => ReactNode;
  engagementActions?: (
    post: Post,
    handlers: PostHandlers,
    variant: PostCard01Variant,
  ) => EngagementAction[];
  renderEngagementBar?: (
    post: Post,
    defaults: { actions: EngagementAction[] },
  ) => ReactNode;
  kebabActions?: (post: Post) => CommentMenuItem[];
  commentActions?: (
    comment: Comment,
    helpers: {
      currentUser?: CommentThreadCurrentUser;
      isOwn: boolean;
      depth: number;
    },
  ) => CommentMenuItem[];
  renderCommentSection?: (
    post: Post,
    handlers: {
      onAddComment?: PostCard01Props["onAddComment"];
      onLikeComment?: PostCard01Props["onLikeComment"];
      onDeleteComment?: PostCard01Props["onDeleteComment"];
      onReportComment?: PostCard01Props["onReportComment"];
      onLoadMoreComments?: PostCard01Props["onLoadMoreComments"];
    },
  ) => ReactNode;

  headingAs?: "h2" | "h3" | "h4";
  bodyMaxLines?: number;

  labels?: PostCard01Labels;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  mediaClassName?: string;
  engagementClassName?: string;
  commentSectionClassName?: string;

  ref?: React.Ref<PostCard01Handle>;
}

export interface PostCard01Handle {
  openKebab: () => void;
  /** Card-level "canonical Instagram tap" — flips like via bar AND bumps burst counter (when wired). */
  triggerLike: () => void;
  /** Read the current local mirror state (post + engagement deltas applied). */
  getCurrentPost: () => Post;
  /** Replace the post (re-derives local engagement mirror on next render). */
  reset: (next: Post) => void;
  getEngagementHandle: () => EngagementBar01Handle | null;
  getThreadHandle: () => CommentThread01Handle | null;
}
