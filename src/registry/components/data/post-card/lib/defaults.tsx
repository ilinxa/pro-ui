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
// F-S1 lock: cross-procomp imports via relative + specific-file paths.
import type { EngagementAction, EngagementActionEvent } from "../../engagement-bar/types";
import type { CommentMenuItem } from "../../comment-thread/types";
import type {
  Post,
  PostCardLabels,
  PostCardVariant,
  PostHandlers,
  PostMutationHandlers,
  PostPermissionAction,
  PostPermissions,
  PostReactions,
  PostViewerMode,
} from "../types";
import {
  canPerformActionInternal,
  resolvePostPermissions,
} from "./permissions";

/**
 * Disclosure wiring for post-card's inline panels (0.6.1). post-card passes it to its default
 * actions in inline mode; a host calling `defaultPostEngagementActions` from the
 * `engagementActions` slot omits it (its actions then carry no `aria-expanded`).
 */
export interface PostInlineDisclosure {
  /** The inline panel that is open. */
  open: "none" | "likes" | "comments" | "share";
  /** The panels' element ids (`aria-controls` targets). */
  ids: { likes: string; comments: string; share: string };
  /** Share opens a panel (`shareSuggestions` is set); otherwise the share action carries no disclosure state. */
  shareOpens: boolean;
  /** Toggles the comments panel, taking the clicked button as the opener. */
  comment: (event: EngagementActionEvent) => void;
  /** Toggles the share panel, taking the clicked button as the opener. */
  share: (event: EngagementActionEvent) => void;
}

export function defaultPostEngagementActions(
  post: Post,
  handlers: PostHandlers,
  variant: PostCardVariant,
  /**
   * Optional separate handler for the like-count tap target. When provided, the
   * heart icon stays on `onToggle` and the count text becomes its own button
   * firing `onCountClick` (kasder UX — heart toggles like, count opens likers panel).
   */
  onLikeCountClick?: (event: EngagementActionEvent) => void,
  /**
   * With reactions, a `kind: "reaction"` action takes the place of the like: `counts` merge into
   * the kinds' tallies, `viewerReaction` / `totalCount` / `clearOnTap` pass through and a pick
   * calls `reactions.onReact(post.id, kind)`.
   */
  reactions?: PostReactions,
  /** Inline mode only: which panel is open, the panels' ids, and the event-aware openers. */
  inline?: PostInlineDisclosure,
): EngagementAction[] {
  const likeD = inline ? { countExpanded: inline.open === "likes", countControls: inline.ids.likes } : null;
  const like: EngagementAction = reactions
    ? {
        kind: "reaction",
        kinds: reactions.kinds.map((k) => {
          const tally = reactions.counts?.[k.key];
          return tally === undefined ? k : { ...k, count: tally };
        }),
        totalCount: reactions.totalCount,
        viewerReaction: reactions.viewerReaction,
        clearOnTap: reactions.clearOnTap,
        onSelect: reactions.onReact
          ? (kind) => reactions.onReact!(post.id, kind)
          : undefined,
        onCountClick: onLikeCountClick,
        ...likeD,
      }
    : {
        kind: "like",
        count: post.likes,
        liked: post.isLiked ?? false,
        onToggle: handlers.onLike
          ? (next) => {
              handlers.onLike!(post.id, next);
            }
          : undefined,
        onCountClick: onLikeCountClick,
        ...likeD,
      };

  const comment: EngagementAction = {
    kind: "comment",
    count: post.comments,
    onClick: inline
      ? inline.comment
      : handlers.onComment
        ? () => handlers.onComment!(post.id)
        : undefined,
    ...(inline ? { expanded: inline.open === "comments", controls: inline.ids.comments } : null),
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
      onClick: inline ? inline.share : handlers.onShare ? () => handlers.onShare!(post.id) : undefined,
      ...(inline?.shareOpens ? { expanded: inline.open === "share", controls: inline.ids.share } : null),
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
      PostCardLabels,
      "bookmark" | "unbookmark" | "share" | "copyLink" | "report"
    >
  > &
    Partial<
      Pick<
        PostCardLabels,
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
  /**
   * v0.3.0 — supplier for the moderator section. Items render between common
   * items and viewer-destructive items, with `separatorBefore: true` injected
   * on the first item so the host kebab renders a divider above the group.
   * Gated by `canDo("moderate")` — host opts the viewer in via
   * `permissions.canModerate` or `canPerformAction("moderate", post)`.
   */
  moderatorActions?: (post: Post) => CommentMenuItem[],
  /**
   * 0.6.0 - items appended after every default item (after the destructive group, not gated by
   * `canModerate`), in both modes. `hidden` items are left out later, by the menu.
   */
  extraItems?: CommentMenuItem[],
): CommentMenuItem[] {
  // `permissions` that only carries `disabled` does not switch on role-aware mode: the legacy
  // handler-driven items stay, with the named ones disabled.
  const permissionsOnlyDisables =
    permissions !== undefined &&
    permissions.disabled !== undefined &&
    (Object.keys(permissions) as (keyof PostPermissions)[]).every(
      (k) => k === "disabled" || permissions[k] === undefined,
    );
  const roleAwareMode =
    viewerMode !== undefined ||
    (permissions !== undefined && !permissionsOnlyDisables) ||
    canPerformAction !== undefined;
  const isDisabled = (action: PostPermissionAction) =>
    permissions?.disabled?.[action] === true;
  const withExtras = (items: CommentMenuItem[]) =>
    extraItems && extraItems.length > 0 ? [...items, ...extraItems] : items;

  // ─── Legacy mode (v0.1 path) ─── unchanged behavior; resolver NOT called
  if (!roleAwareMode) {
    const items: CommentMenuItem[] = [];
    if (handlers.onBookmark) {
      items.push({
        label: post.isBookmarked ? labels.unbookmark : labels.bookmark,
        icon: <Bookmark className="h-4 w-4" />,
        disabled: isDisabled("bookmark") || undefined,
        onClick: () =>
          handlers.onBookmark!(post.id, !(post.isBookmarked ?? false)),
      });
    }
    if (handlers.onShare) {
      items.push({
        label: labels.share,
        icon: <Share2 className="h-4 w-4" />,
        disabled: isDisabled("share") || undefined,
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
        disabled: isDisabled("report") || undefined,
        onClick: () => handlers.onReport!(post.id),
      });
    }
    return withExtras(items);
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
      disabled: isDisabled("edit") || undefined,
      onClick: () => mutationHandlers.onEdit!(post.id),
    });
  }
  if (canDo("pin") && mutationHandlers?.onPin) {
    items.push({
      label: post.isPinned ? (labels.unpin ?? "Unpin") : (labels.pin ?? "Pin to top"),
      icon: post.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />,
      disabled: isDisabled("pin") || undefined,
      onClick: () => mutationHandlers.onPin!(post.id, !(post.isPinned ?? false)),
    });
  }
  if (canDo("changeVisibility") && mutationHandlers?.onChangeVisibility) {
    items.push({
      label: labels.changeVisibility ?? "Change visibility",
      icon: <Globe className="h-4 w-4" />,
      disabled: isDisabled("changeVisibility") || undefined,
      onClick: () => mutationHandlers.onChangeVisibility!(post.id, post.visibility),
    });
  }
  if (canDo("markSensitive") && mutationHandlers?.onMarkSensitive) {
    items.push({
      label: post.isSensitive
        ? (labels.unmarkSensitive ?? "Remove sensitive mark")
        : (labels.markSensitive ?? "Mark as sensitive"),
      icon: post.isSensitive ? <EyeOff className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />,
      disabled: isDisabled("markSensitive") || undefined,
      onClick: () =>
        mutationHandlers.onMarkSensitive!(post.id, !(post.isSensitive ?? false)),
    });
  }
  if (canDo("seeAnalytics") && mutationHandlers?.onSeeAnalytics) {
    items.push({
      label: labels.seeAnalytics ?? "See analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      disabled: isDisabled("seeAnalytics") || undefined,
      onClick: () => mutationHandlers.onSeeAnalytics!(post.id),
    });
  }

  // Common items (host-policy gated) — Bookmark / Share / Copy link
  if (canDo("bookmark") && handlers.onBookmark) {
    items.push({
      label: post.isBookmarked ? labels.unbookmark : labels.bookmark,
      icon: <Bookmark className="h-4 w-4" />,
      disabled: isDisabled("bookmark") || undefined,
      onClick: () =>
        handlers.onBookmark!(post.id, !(post.isBookmarked ?? false)),
    });
  }
  if (canDo("share") && handlers.onShare) {
    items.push({
      label: labels.share,
      icon: <Share2 className="h-4 w-4" />,
      disabled: isDisabled("share") || undefined,
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

  // ─── v0.3.0 moderator section ─── ILX-3
  // Rendered between common items and viewer-destructive items. Gated by
  // `canDo("moderate")` AND a non-empty `moderatorActions(post)` return.
  // The first moderator item carries `separatorBefore: true` so the host
  // kebab renders a divider above the whole group.
  if (canDo("moderate") && moderatorActions) {
    const modItems = moderatorActions(post).map((m) =>
      isDisabled("moderate") ? { ...m, disabled: true } : m,
    );
    if (modItems.length > 0) {
      items.push({ ...modItems[0], separatorBefore: true });
      for (let i = 1; i < modItems.length; i++) {
        items.push(modItems[i]);
      }
    }
  }

  // Viewer-side items (destructive at the bottom)
  if (canDo("muteAuthor") && mutationHandlers?.onMuteAuthor) {
    items.push({
      label: labels.muteAuthor ?? "Mute author",
      icon: <VolumeX className="h-4 w-4" />,
      disabled: isDisabled("muteAuthor") || undefined,
      onClick: () => mutationHandlers.onMuteAuthor!(post.author.id),
    });
  }
  if (canDo("blockAuthor") && mutationHandlers?.onBlockAuthor) {
    items.push({
      label: labels.blockAuthor ?? "Block author",
      icon: <UserX className="h-4 w-4" />,
      disabled: isDisabled("blockAuthor") || undefined,
      destructive: true,
      onClick: () => mutationHandlers.onBlockAuthor!(post.author.id),
    });
  }
  if (canDo("report") && handlers.onReport) {
    items.push({
      label: labels.report,
      icon: <Flag className="h-4 w-4" />,
      destructive: true,
      disabled: isDisabled("report") || undefined,
      onClick: () => handlers.onReport!(post.id),
    });
  }

  // Owner-side destructive (last) — Delete
  if (canDo("delete") && mutationHandlers?.onDelete) {
    items.push({
      label: labels.delete ?? "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      disabled: isDisabled("delete") || undefined,
      destructive: true,
      onClick: () => mutationHandlers.onDelete!(post.id),
    });
  }

  return withExtras(items);
}
