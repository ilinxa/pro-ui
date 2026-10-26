import type { ElementType, ReactNode } from "react";
// F-S1 lock: cross-procomp imports use RELATIVE paths to specific files.
import type {
  Comment,
  CommentThreadHandle,
  CommentThreadProps,
  CommentThreadCurrentUser,
} from "../../comment-thread/types";
import type {
  EngagementAction,
  EngagementBarHandle,
  EngagementBarLabels,
  EngagementDelta,
} from "../../engagement-bar/types";
import type { ExpandableTextLabels } from "../../expandable-text/types";
import type {
  Post,
  PostCardProps,
  ResolvedPostCardLabels,
} from "../types";

/**
 * Shared internal prop bundle passed to per-variant parts. The root dispatcher
 * computes everything here once; each variant consumes what it needs.
 */
export interface VariantInnerProps {
  post: Post;
  currentUser?: CommentThreadCurrentUser;
  authorId: string;
  /** The relative time, or `null` before the card knows "now". */
  formattedTime: string | null;

  /** The default actions menu, built once (`null` when it has no visible items). */
  kebab: ReactNode;

  engagementActions: EngagementAction[];
  engagementBarRef?: React.Ref<EngagementBarHandle>;
  engagementClassName?: string;
  engagementLabels?: EngagementBarLabels;
  engagementBarProps?: PostCardProps["engagementBarProps"];
  /** The card's `optimistic` (the bar's picker follows it unless `engagementBarProps` sets its own). */
  optimistic?: boolean;
  /** No-op forwarded to the bar's onSubscribeDelta — the root subscribes to the realtime channel itself. */
  engagementSubscribeNoop?: (delta: EngagementDelta) => void;

  bodyMaxLines: number;
  bodyClassName?: string;
  textLabels?: ExpandableTextLabels;

  headingAs: "h2" | "h3" | "h4";

  labels: ResolvedPostCardLabels;

  /** Resolved BCP 47 locale (never undefined). */
  locale: string;
  timeZone?: string;
  /** "Now", or `undefined` before the card knows it. */
  now?: Date;
  formatCount: (n: number) => string;
  formatRelativeTime: (date: Date, now: Date) => string;
  /** The props the host set explicitly, handed on to the nested repost card. */
  repostForwarding: {
    formatRelativeTime?: PostCardProps["formatRelativeTime"];
    formatCount?: PostCardProps["formatCount"];
  };

  getAuthorHref?: PostCardProps["getAuthorHref"];
  subtitle?: PostCardProps["subtitle"];
  noticeSlot?: PostCardProps["noticeSlot"];
  mediaProps?: PostCardProps["mediaProps"];

  burstKey: number;
  heartBurstWired: boolean;
  onMediaDoubleTap?: () => void;

  cardLinkable: boolean;
  linkHref?: string;
  LinkComponent: ElementType;

  renderHeader?: PostCardProps["renderHeader"];
  renderContent?: PostCardProps["renderContent"];
  renderMedia?: PostCardProps["renderMedia"];
  renderEngagementBar?: PostCardProps["renderEngagementBar"];

  // v0.2.0 header-level callbacks threaded to PostHeader (location chip,
  // replyTo "Replying to @x" mention click).
  onLocationClick?: PostCardProps["onLocationClick"];
  onMentionClick?: PostCardProps["onMentionClick"];
  /** Threaded to the auto-rendered <TagChips> sibling below content (C5). */
  onTagClick?: PostCardProps["onTagClick"];

  // v0.2.0 sensitive-media gate (C6) — feed + detail variants only per description §1.3.
  /** Current reveal state; gate renders when post.isSensitive && !sensitiveRevealed. */
  sensitiveRevealed: boolean;
  /** Single handler: flips local sensitiveRevealed=true + fires host's onRevealSensitive. */
  onSensitiveReveal: () => void;
  /** When true, gate is suppressed entirely even if post.isSensitive (moderator surfaces). */
  disableSensitiveGate?: PostCardProps["disableSensitiveGate"];
  /** Full takeover for the sensitive-media gate overlay. Receives `onReveal` helper. */
  renderSensitiveGate?: PostCardProps["renderSensitiveGate"];

  // v0.2.0 link-preview card (C7) — feed + detail variants only per description §1.3.
  /** Click handler — overrides default <a href target=_blank> navigation. */
  onLinkPreviewClick?: PostCardProps["onLinkPreviewClick"];
  /** When true, suppresses the default link-preview render even if post.linkPreview is set. */
  disableLinkPreviewRender?: PostCardProps["disableLinkPreviewRender"];
  /** Full takeover for the link-preview card. */
  renderLinkPreview?: PostCardProps["renderLinkPreview"];

  // v0.2.0 poll widget (C9) — feed + detail variants only per description §1.3.
  /** Per-card vote dispatcher. */
  onPollVote?: (optionId: string) => void;
  /** A vote is in flight (further votes are ignored). */
  pollBusy?: boolean;
  /** Resolved owner view flag — true when viewerMode === "owner". */
  isOwnerView: boolean;
  /** When true, suppresses the default poll-widget render even if post.poll is set. */
  disablePollRender?: PostCardProps["disablePollRender"];
  /** Full takeover for the poll widget. */
  renderPoll?: PostCardProps["renderPoll"];

  // v0.2.0 repost mini-card (C8) — feed + detail variants only per description §1.3.
  /** Click handler — overrides default getHref-based navigation on the nested repost card. */
  onRepostOfClick?: PostCardProps["onRepostOfClick"];
  /** When true, suppresses the default repost mini-card render even if post.repostOf is set. */
  disableRepostOfRender?: PostCardProps["disableRepostOfRender"];
  /** Full takeover for the repost mini-card. */
  renderRepostOf?: PostCardProps["renderRepostOf"];
  /** Forwarded to the nested compact `<PostCard>` for default href derivation. */
  getHref?: PostCardProps["getHref"];
  /** Forwarded to the nested compact `<PostCard>` for polymorphic anchor root. */
  linkComponent?: PostCardProps["linkComponent"];
  /** Forwarded to the nested compact `<PostCard>` for header label strings. */
  cardLabels?: PostCardProps["labels"];

  /** Inline likes/comments panel rendered below the engagement bar (feed + compact only). */
  inlinePanelNode?: ReactNode;

  className?: string;
  headerClassName?: string;
  mediaClassName?: string;
}

/** Detail variant adds the comment thread on top. */
export interface DetailVariantInnerProps extends VariantInnerProps {
  /** The comments (a stable empty array when the host gave none). */
  commentThread: Comment[];
  /** The thread's props, built once by the card and shared with the inline panel. */
  threadProps: Omit<CommentThreadProps, "comments">;
  /** What `renderCommentSection` receives. */
  commentHandlers: {
    onAddComment?: PostCardProps["onAddComment"];
    onLikeComment?: PostCardProps["onLikeComment"];
    onDeleteComment?: PostCardProps["onDeleteComment"];
    onReportComment?: PostCardProps["onReportComment"];
    onLoadMoreComments?: PostCardProps["onLoadMoreComments"];
  };
  renderCommentSection?: PostCardProps["renderCommentSection"];
  threadRef?: React.Ref<CommentThreadHandle>;
  commentSectionClassName?: string;
  commentsHeading: string;
}
