import {
  BarChart3,
  Bookmark,
  Copy,
  EyeOff,
  Flag,
  Globe,
  Languages,
  Pencil,
  Pin,
  PinOff,
  Share2,
  ShieldAlert,
  Trash2,
  UserX,
  VolumeX,
} from "lucide-react";
import type { EngagementAction } from "@/registry/components/data/engagement-bar-01";
import type { CommentMenuItem } from "@/registry/components/data/comment-thread-01";
import type {
  Post,
  PostCard01Labels,
  PostCard01Variant,
  PostHandlers,
  PostMutationHandlers,
  PostPermissionAction,
  PostPermissions,
  PostViewerMode,
} from "../types";
import {
  canPerformActionInternal,
  resolvePostPermissions,
} from "./permissions";

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

/**
 * Default kebab item builder. Dual-mode helper:
 *
 *   - **Legacy mode (v0.1 backwards-compat):** when `viewerMode` / `permissions` /
 *     `canPerformAction` are ALL `undefined`, the helper takes the exact v0.1
 *     handler-driven code path. Items are built from "which handler is wired."
 *     Zero behavior drift for v0.1 consumers.
 *
 *   - **Role-aware mode (v0.2.0):** when ANY of the three role-aware args is set,
 *     the helper calls `resolvePostPermissions` + `canPerformActionInternal` to
 *     produce role-appropriate items per the resolution order in plan §3.
 *     Owner mode shows Edit / Delete / Pin / Change-visibility / Mark-sensitive /
 *     See-analytics; viewer mode shows Report / Block author / Mute author;
 *     common actions (Bookmark / Share / Copy link / Translate) gated by the
 *     resolved matrix.
 *
 * Backwards-compat: trailing args (`viewerMode`, `permissions`, `canPerformAction`,
 * `mutationHandlers`, `onTranslate`) are all optional. Old v0.1 call sites
 * compile unchanged.
 */
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
  > &
    Partial<
      Pick<
        PostCard01Labels,
        | "edit"
        | "delete"
        | "pin"
        | "unpin"
        | "changeVisibility"
        | "markSensitive"
        | "unmarkSensitive"
        | "seeAnalytics"
        | "blockAuthor"
        | "muteAuthor"
        | "translate"
      >
    >,
  viewerMode?: PostViewerMode,
  permissions?: PostPermissions,
  canPerformAction?: (
    action: PostPermissionAction,
    post: Post,
  ) => boolean | undefined,
  mutationHandlers?: Partial<PostMutationHandlers>,
  onTranslate?: (postId: string, sourceLanguage: string) => void,
): CommentMenuItem[] {
  const roleAwareMode =
    viewerMode !== undefined ||
    permissions !== undefined ||
    canPerformAction !== undefined;

  // ─── Legacy mode (v0.1 path) ─── unchanged behavior; resolver NOT called
  if (!roleAwareMode) {
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

  // ─── Role-aware mode (v0.2.0) ─── resolve matrix + assemble items per resolution order
  const matrix = resolvePostPermissions(viewerMode, permissions);
  const canDo = (action: PostPermissionAction) =>
    canPerformActionInternal(action, post, matrix, canPerformAction);
  const items: CommentMenuItem[] = [];

  // Owner-side items — only shown when matrix allows AND handler is wired
  if (canDo("edit") && mutationHandlers?.onEdit) {
    items.push({
      label: labels.edit ?? "Edit",
      icon: <Pencil className="h-4 w-4" />,
      onClick: () => mutationHandlers.onEdit!(post.id),
    });
  }
  if (canDo("pin") && mutationHandlers?.onPin) {
    items.push({
      label: post.isPinned ? (labels.unpin ?? "Unpin") : (labels.pin ?? "Pin to top"),
      icon: post.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />,
      onClick: () => mutationHandlers.onPin!(post.id, !(post.isPinned ?? false)),
    });
  }
  if (canDo("changeVisibility") && mutationHandlers?.onChangeVisibility) {
    items.push({
      label: labels.changeVisibility ?? "Change visibility",
      icon: <Globe className="h-4 w-4" />,
      onClick: () => mutationHandlers.onChangeVisibility!(post.id, post.visibility),
    });
  }
  if (canDo("markSensitive") && mutationHandlers?.onMarkSensitive) {
    items.push({
      label: post.isSensitive
        ? (labels.unmarkSensitive ?? "Remove sensitive mark")
        : (labels.markSensitive ?? "Mark as sensitive"),
      icon: post.isSensitive ? <EyeOff className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />,
      onClick: () =>
        mutationHandlers.onMarkSensitive!(post.id, !(post.isSensitive ?? false)),
    });
  }
  if (canDo("seeAnalytics") && mutationHandlers?.onSeeAnalytics) {
    items.push({
      label: labels.seeAnalytics ?? "See analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      onClick: () => mutationHandlers.onSeeAnalytics!(post.id),
    });
  }

  // Common items (host-policy gated) — Bookmark / Share / Copy link
  if (canDo("bookmark") && handlers.onBookmark) {
    items.push({
      label: post.isBookmarked ? labels.unbookmark : labels.bookmark,
      icon: <Bookmark className="h-4 w-4" />,
      onClick: () =>
        handlers.onBookmark!(post.id, !(post.isBookmarked ?? false)),
    });
  }
  if (canDo("share") && handlers.onShare) {
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

  // Translate (gated by post.language presence + handler) — not a canX matrix action
  if (post.language && onTranslate) {
    items.push({
      label: labels.translate ?? "Translate",
      icon: <Languages className="h-4 w-4" />,
      onClick: () => onTranslate(post.id, post.language!),
    });
  }

  // Viewer-side items (destructive at the bottom)
  if (canDo("muteAuthor") && mutationHandlers?.onMuteAuthor) {
    items.push({
      label: labels.muteAuthor ?? "Mute author",
      icon: <VolumeX className="h-4 w-4" />,
      onClick: () => mutationHandlers.onMuteAuthor!(post.author.id),
    });
  }
  if (canDo("blockAuthor") && mutationHandlers?.onBlockAuthor) {
    items.push({
      label: labels.blockAuthor ?? "Block author",
      icon: <UserX className="h-4 w-4" />,
      destructive: true,
      onClick: () => mutationHandlers.onBlockAuthor!(post.author.id),
    });
  }
  if (canDo("report") && handlers.onReport) {
    items.push({
      label: labels.report,
      icon: <Flag className="h-4 w-4" />,
      destructive: true,
      onClick: () => handlers.onReport!(post.id),
    });
  }

  // Owner-side destructive (last) — Delete
  if (canDo("delete") && mutationHandlers?.onDelete) {
    items.push({
      label: labels.delete ?? "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      destructive: true,
      onClick: () => mutationHandlers.onDelete!(post.id),
    });
  }

  return items;
}
