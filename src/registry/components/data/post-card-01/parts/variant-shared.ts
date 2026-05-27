import type { ElementType } from "react";
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
