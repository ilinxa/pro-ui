import type { ElementType } from "react";
// F-S1 lock: cross-procomp imports use RELATIVE paths to specific files.
import type {
  Comment,
  CommentDelta,
  CommentMenuItem,
  CommentThreadCurrentUser,
  CommentThreadLabels,
  CommentThread01Handle,
  Subscribe,
} from "../../comment-thread-01/types";
import type {
  EngagementAction,
  EngagementBar01Handle,
  EngagementBarLabels,
  EngagementDelta,
} from "../../engagement-bar-01/types";
import type {
  Post,
  PostCard01Labels,
  PostCard01Props,
} from "../types";

/**
 * Shared internal prop bundle passed to per-variant parts. The root dispatcher
 * computes everything here once; each variant consumes what it needs.
 */
export interface VariantInnerProps {
  post: Post;
  currentUser?: CommentThreadCurrentUser;
  authorId: string;
  formattedTime: string;

  kebabOpen: boolean;
  onKebabOpenChange: (next: boolean) => void;
  kebabItems: CommentMenuItem[];

  engagementActions: EngagementAction[];
  engagementBarRef?: React.Ref<EngagementBar01Handle>;
  engagementClassName?: string;
  engagementLabels?: EngagementBarLabels;
  /** No-op forwarded to the bar's onSubscribeDelta — the root subscribes to the realtime channel itself. */
  engagementSubscribeNoop?: (delta: EngagementDelta) => void;

  bodyMaxLines: number;
  bodyClassName?: string;

  headingAs: "h2" | "h3" | "h4";

  labels: Required<
    Omit<
      PostCard01Labels,
      "formatRelativeTime" | "engagementLabels" | "commentLabels"
    >
  >;

  burstKey: number;
  heartBurstWired: boolean;
  onMediaDoubleTap?: () => void;

  cardLinkable: boolean;
  linkHref?: string;
  LinkComponent: ElementType;

  renderHeader?: PostCard01Props["renderHeader"];
  renderContent?: PostCard01Props["renderContent"];
  renderMedia?: PostCard01Props["renderMedia"];
  renderEngagementBar?: PostCard01Props["renderEngagementBar"];

  // v0.2.0 header-level callbacks threaded to PostHeader (location chip,
  // replyTo "Replying to @x" mention click).
  onLocationClick?: PostCard01Props["onLocationClick"];
  onMentionClick?: PostCard01Props["onMentionClick"];
  /** Threaded to the auto-rendered <TagChips> sibling below content (C5). */
  onTagClick?: PostCard01Props["onTagClick"];

  // v0.2.0 sensitive-media gate (C6) — feed + detail variants only per description §1.3.
  /** Current reveal state; gate renders when post.isSensitive && !sensitiveRevealed. */
  sensitiveRevealed: boolean;
  /** Single handler: flips local sensitiveRevealed=true + fires host's onRevealSensitive. */
  onSensitiveReveal: () => void;
  /** When true, gate is suppressed entirely even if post.isSensitive (moderator surfaces). */
  disableSensitiveGate?: PostCard01Props["disableSensitiveGate"];
  /** Full takeover for the sensitive-media gate overlay. Receives `onReveal` helper. */
  renderSensitiveGate?: PostCard01Props["renderSensitiveGate"];

  // v0.2.0 link-preview card (C7) — feed + detail variants only per description §1.3.
  /** Click handler — overrides default <a href target=_blank> navigation. */
  onLinkPreviewClick?: PostCard01Props["onLinkPreviewClick"];
  /** When true, suppresses the default link-preview render even if post.linkPreview is set. */
  disableLinkPreviewRender?: PostCard01Props["disableLinkPreviewRender"];
  /** Full takeover for the link-preview card. */
  renderLinkPreview?: PostCard01Props["renderLinkPreview"];

  // v0.2.0 poll widget (C9) — feed + detail variants only per description §1.3.
  /** Per-card vote dispatcher — wraps setPollVote(local-mirror) + onVotePoll(host). */
  onPollVote?: (optionId: string) => void;
  /** Local-mirror optimistic vote (from useState in post-card-01.tsx). */
  pollOptimisticVote: { optionId: string; votedAt: Date } | null;
  /** Resolved owner view flag — true when viewerMode === "owner". */
  isOwnerView: boolean;
  /** When true, suppresses the default poll-widget render even if post.poll is set. */
  disablePollRender?: PostCard01Props["disablePollRender"];
  /** Full takeover for the poll widget. */
  renderPoll?: PostCard01Props["renderPoll"];
  /** Relative-time formatter for the closesAt countdown line. */
  formatRelativeTime?: (date: Date, now: Date) => string;

  // v0.2.0 repost mini-card (C8) — feed + detail variants only per description §1.3.
  /** Click handler — overrides default getHref-based navigation on the nested repost card. */
  onRepostOfClick?: PostCard01Props["onRepostOfClick"];
  /** When true, suppresses the default repost mini-card render even if post.repostOf is set. */
  disableRepostOfRender?: PostCard01Props["disableRepostOfRender"];
  /** Full takeover for the repost mini-card. */
  renderRepostOf?: PostCard01Props["renderRepostOf"];
  /** Forwarded to the nested compact `<PostCard01>` for default href derivation. */
  getHref?: PostCard01Props["getHref"];
  /** Forwarded to the nested compact `<PostCard01>` for polymorphic anchor root. */
  linkComponent?: PostCard01Props["linkComponent"];
  /** Forwarded to the nested compact `<PostCard01>` for header label strings. */
  cardLabels?: PostCard01Props["labels"];

  /** Inline likes/comments panel rendered below the engagement bar (feed + compact only). */
  inlinePanelNode?: import("react").ReactNode;

  className?: string;
  headerClassName?: string;
  mediaClassName?: string;
}

/** Detail variant adds comment-thread props on top. */
export interface DetailVariantInnerProps extends VariantInnerProps {
  commentThread: Comment[];
  commentPageSize: number;
  commentSubscribe?: Subscribe<CommentDelta>;
  onSubscribeCommentDelta?: (delta: CommentDelta) => void;
  onAddComment?: PostCard01Props["onAddComment"];
  onLikeComment?: PostCard01Props["onLikeComment"];
  onDeleteComment?: PostCard01Props["onDeleteComment"];
  onReportComment?: PostCard01Props["onReportComment"];
  onLoadMoreComments?: PostCard01Props["onLoadMoreComments"];
  commentActions?: PostCard01Props["commentActions"];
  renderCommentSection?: PostCard01Props["renderCommentSection"];
  commentLabels?: CommentThreadLabels;
  threadRef?: React.Ref<CommentThread01Handle>;
  commentSectionClassName?: string;
  commentsHeading: string;
}
