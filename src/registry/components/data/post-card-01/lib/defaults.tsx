import { Bookmark, Copy, Flag, Share2 } from "lucide-react";
import type { EngagementAction } from "@/registry/components/data/engagement-bar-01";
import type { CommentMenuItem } from "@/registry/components/data/comment-thread-01";
import type {
  Post,
  PostCard01Labels,
  PostCard01Variant,
  PostHandlers,
} from "../types";

export function defaultPostEngagementActions(
  post: Post,
  handlers: PostHandlers,
  variant: PostCard01Variant,
  /**
   * Optional separate handler for the like-count tap target. When provided, the
   * heart icon stays on `onToggle` and the count text becomes its own button
   * firing `onCountClick` (kasder UX — heart toggles like, count opens likers panel).
   */
  onLikeCountClick?: () => void,
): EngagementAction[] {
  const like: EngagementAction = {
    kind: "like",
    count: post.likes,
    liked: post.isLiked ?? false,
    onToggle: handlers.onLike
      ? (next) => handlers.onLike!(post.id, next)
      : undefined,
    onCountClick: onLikeCountClick,
  };

  const comment: EngagementAction = {
    kind: "comment",
    count: post.comments,
    onClick: handlers.onComment
      ? () => handlers.onComment!(post.id)
      : undefined,
  };

  if (variant === "compact") {
    return [like, comment];
  }

  if (variant === "list") {
    // List variant default: counts only — interactive bar opt-in via slot.
    return [];
  }

  // feed + detail
  const actions: EngagementAction[] = [
    like,
    comment,
    {
      kind: "share",
      count: post.shares,
      onClick: handlers.onShare ? () => handlers.onShare!(post.id) : undefined,
    },
    {
      kind: "bookmark",
      bookmarked: post.isBookmarked ?? false,
      onToggle: handlers.onBookmark
        ? (next) => handlers.onBookmark!(post.id, next)
        : undefined,
    },
  ];
  if (variant === "detail" && post.viewCount !== undefined) {
    actions.push({ kind: "view-count", count: post.viewCount });
  }
  return actions;
}

export function defaultPostKebabActions(
  post: Post,
  handlers: {
    onBookmark?: PostHandlers["onBookmark"];
    onShare?: PostHandlers["onShare"];
    onReport?: (postId: string) => void;
    onCopyLink?: (postId: string) => void;
  },
  labels: Required<
    Pick<
      PostCard01Labels,
      "bookmark" | "unbookmark" | "share" | "copyLink" | "report"
    >
  >,
): CommentMenuItem[] {
  const items: CommentMenuItem[] = [];
  if (handlers.onBookmark) {
    items.push({
      label: post.isBookmarked ? labels.unbookmark : labels.bookmark,
      icon: <Bookmark className="h-4 w-4" />,
      onClick: () =>
        handlers.onBookmark!(post.id, !(post.isBookmarked ?? false)),
    });
  }
  if (handlers.onShare) {
    items.push({
      label: labels.share,
      icon: <Share2 className="h-4 w-4" />,
      onClick: () => handlers.onShare!(post.id),
    });
  }
  if (handlers.onCopyLink) {
    items.push({
      label: labels.copyLink,
      icon: <Copy className="h-4 w-4" />,
      onClick: () => handlers.onCopyLink!(post.id),
    });
  }
  if (handlers.onReport) {
    items.push({
      label: labels.report,
      icon: <Flag className="h-4 w-4" />,
      destructive: true,
      onClick: () => handlers.onReport!(post.id),
    });
  }
  return items;
}
