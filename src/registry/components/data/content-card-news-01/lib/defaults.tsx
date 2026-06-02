import {
  Bookmark,
  BookmarkX,
  Share2,
  Link as LinkIcon,
  Languages,
  Flag,
  UserX,
  VolumeX,
  HashIcon,
  Edit3,
  Trash2,
  Send,
  CalendarClock,
  Star,
  StarOff,
  Pin,
  PinOff,
  EyeOff,
  Eye,
  Tag,
  AlertOctagon,
  BarChart3,
  ArrowUpToLine,
} from "lucide-react";
import { createElement } from "react";

// F-S1 lock: cross-procomp imports use RELATIVE paths to specific files.
import type { CommentMenuItem } from "../../comment-thread-01/types";
import type {
  ContentCardEngagementHandlers,
  ContentCardItem,
  ContentCardMutationHandlers,
  ContentCardNewsLabels,
  ContentCardPermissionAction,
  ContentCardPermissions,
  NewsViewerMode,
} from "../types";
import { DEFAULT_LABELS } from "../types";
import {
  canPerformActionInternal,
  resolveContentCardPermissions,
} from "./permissions";

/**
 * Engagement handlers exposed to the kebab — `onBookmark` / `onShare` show up
 * in the common items section. `onLike` doesn't have a kebab item (it lives
 * on the engagement-counts row); it's accepted here so the helper signature
 * mirrors the engagement-handlers bag the root passes everywhere.
 */
type KebabEngagementHandlers = Pick<
  ContentCardEngagementHandlers,
  "onBookmark" | "onShare"
>;

/**
 * Misc reader-side handlers needed by the kebab beyond the mutation bag.
 * `onCopyLink` is conceptually the same as `onShare` but copies vs opens;
 * `onReport` lives on {@link ContentCardMutationHandlers} already.
 */
interface KebabMiscHandlers {
  onCopyLink?: (articleId: string) => void;
  /**
   * Bound translator handler — receives no args (the caller pre-binds
   * `articleId` + `sourceLanguage`). Visible only when `item.language` is
   * set.
   */
  onTranslate?: () => void;
}

interface DefaultContentCardKebabArgs {
  item: ContentCardItem;
  engagementHandlers?: KebabEngagementHandlers;
  miscHandlers?: KebabMiscHandlers;
  viewerMode?: NewsViewerMode;
  permissions?: ContentCardPermissions;
  canPerformAction?: (
    action: ContentCardPermissionAction,
    item: ContentCardItem,
  ) => boolean | undefined;
  mutationHandlers?: ContentCardMutationHandlers;
  moderatorActions?: (item: ContentCardItem) => CommentMenuItem[];
  labels?: ContentCardNewsLabels;
}

/**
 * Build the canonical kebab item list for content-card-news-01.
 *
 * **Dual-mode entry-branch (Q-P29):**
 *  - When `viewerMode`, `permissions`, AND `canPerformAction` are all
 *    `undefined` → **legacy minimal kebab**: only common items render
 *    (Bookmark / Share / Copy link / Translate / Report), gated on handler
 *    presence. Same behavior as v0.2 had no kebab at all — caller decides
 *    whether to render the trigger based on returned array length.
 *  - When ANY of the three is set → **role-aware mode**: permissions matrix
 *    is resolved + items assembled per editor / viewer / moderator role.
 *
 * **Resolution layering:** the helper calls {@link resolveContentCardPermissions}
 * to compute the effective matrix, then {@link canPerformActionInternal} per
 * action to layer in the predicate. Memoize identities at the call-site.
 *
 * @returns Array of `CommentMenuItem` ready to render in any kebab UI. Empty
 *          array signals "don't render the trigger."
 */
export function defaultContentCardKebabActions(
  args: DefaultContentCardKebabArgs,
): CommentMenuItem[] {
  const {
    item,
    engagementHandlers = {},
    miscHandlers = {},
    viewerMode,
    permissions,
    canPerformAction,
    mutationHandlers = {},
    moderatorActions,
    labels,
  } = args;

  const resolvedLabels: Required<ContentCardNewsLabels> = {
    ...DEFAULT_LABELS,
    ...labels,
  };

  // Detect role-aware mode entry. ALL three undefined → legacy path.
  const isRoleAware =
    viewerMode !== undefined ||
    permissions !== undefined ||
    canPerformAction !== undefined;

  if (!isRoleAware) {
    return buildLegacyKebab({
      item,
      engagementHandlers,
      miscHandlers,
      mutationHandlers,
      labels: resolvedLabels,
    });
  }

  // Role-aware path — resolve once, layer predicate per action.
  const resolved = resolveContentCardPermissions(viewerMode, permissions);
  const allowed = (action: ContentCardPermissionAction): boolean =>
    canPerformActionInternal(action, item, resolved, canPerformAction);

  const items: CommentMenuItem[] = [];

  // ─── Editor-side section ────────────────────────────────────────────────
  if (viewerMode === "editor") {
    if (allowed("edit") && mutationHandlers.onEdit) {
      items.push({
        label: resolvedLabels.edit,
        icon: createElement(Edit3, { className: "size-4", "aria-hidden": true }),
        onClick: () => mutationHandlers.onEdit?.(item.id),
      });
    }
    // Publish / Unpublish — single slot, label + handler flip on status
    if (item.status !== "published") {
      if (allowed("publish") && mutationHandlers.onPublish) {
        items.push({
          label: resolvedLabels.publish,
          icon: createElement(Send, { className: "size-4", "aria-hidden": true }),
          onClick: () => mutationHandlers.onPublish?.(item.id),
        });
      }
    } else {
      if (allowed("unpublish") && mutationHandlers.onUnpublish) {
        items.push({
          label: resolvedLabels.unpublish,
          icon: createElement(EyeOff, { className: "size-4", "aria-hidden": true }),
          onClick: () => mutationHandlers.onUnpublish?.(item.id),
        });
      }
    }
    if (allowed("schedule") && mutationHandlers.onSchedule) {
      items.push({
        label: resolvedLabels.schedule,
        icon: createElement(CalendarClock, { className: "size-4", "aria-hidden": true }),
        onClick: () =>
          mutationHandlers.onSchedule?.(
            item.id,
            item.scheduledFor ? toDate(item.scheduledFor) : undefined,
          ),
      });
    }
    if (allowed("feature") && mutationHandlers.onFeature) {
      const nextFeatured = !item.isFeatured;
      items.push({
        label: item.isFeatured ? resolvedLabels.unfeature : resolvedLabels.feature,
        icon: createElement(item.isFeatured ? StarOff : Star, {
          className: "size-4",
          "aria-hidden": true,
        }),
        onClick: () => mutationHandlers.onFeature?.(item.id, nextFeatured),
      });
    }
    if (allowed("pin") && mutationHandlers.onPin) {
      const nextPinned = !item.isPinned;
      items.push({
        label: item.isPinned ? resolvedLabels.unpin : resolvedLabels.pin,
        icon: createElement(item.isPinned ? PinOff : Pin, {
          className: "size-4",
          "aria-hidden": true,
        }),
        onClick: () => mutationHandlers.onPin?.(item.id, nextPinned),
      });
    }
    if (allowed("pushToTop") && mutationHandlers.onPushToTop) {
      items.push({
        label: resolvedLabels.pushToTop,
        icon: createElement(ArrowUpToLine, { className: "size-4", "aria-hidden": true }),
        onClick: () => mutationHandlers.onPushToTop?.(item.id),
      });
    }
    if (allowed("changeVisibility") && mutationHandlers.onChangeVisibility) {
      items.push({
        label: resolvedLabels.changeVisibility,
        icon: createElement(Eye, { className: "size-4", "aria-hidden": true }),
        onClick: () =>
          mutationHandlers.onChangeVisibility?.(item.id, item.visibility),
      });
    }
    if (allowed("changeCategory") && mutationHandlers.onChangeCategory) {
      items.push({
        label: resolvedLabels.changeCategory,
        icon: createElement(Tag, { className: "size-4", "aria-hidden": true }),
        onClick: () =>
          mutationHandlers.onChangeCategory?.(item.id, item.category),
      });
    }
    if (allowed("markSensitive") && mutationHandlers.onMarkSensitive) {
      const isSensitive = item.sensitivity?.isSensitive ?? false;
      items.push({
        label: isSensitive
          ? resolvedLabels.unmarkSensitive
          : resolvedLabels.markSensitive,
        icon: createElement(AlertOctagon, { className: "size-4", "aria-hidden": true }),
        onClick: () =>
          mutationHandlers.onMarkSensitive?.(
            item.id,
            !isSensitive,
            item.sensitivity?.reason,
          ),
      });
    }
    if (allowed("seeAnalytics") && mutationHandlers.onSeeAnalytics) {
      items.push({
        label: resolvedLabels.seeAnalytics,
        icon: createElement(BarChart3, { className: "size-4", "aria-hidden": true }),
        onClick: () => mutationHandlers.onSeeAnalytics?.(item.id),
      });
    }
  }

  // ─── Common items (Bookmark / Share / Copy link / Translate) ────────────
  const commonStart = items.length;
  if (allowed("bookmark") && engagementHandlers.onBookmark) {
    items.push({
      label: item.isBookmarked
        ? resolvedLabels.unbookmark
        : resolvedLabels.bookmark,
      icon: createElement(item.isBookmarked ? BookmarkX : Bookmark, {
        className: "size-4",
        "aria-hidden": true,
      }),
      onClick: () =>
        engagementHandlers.onBookmark?.(item.id, !item.isBookmarked),
    });
  }
  if (allowed("share") && engagementHandlers.onShare) {
    items.push({
      label: resolvedLabels.share,
      icon: createElement(Share2, { className: "size-4", "aria-hidden": true }),
      onClick: () => engagementHandlers.onShare?.(item.id),
    });
  }
  if (miscHandlers.onCopyLink) {
    items.push({
      label: resolvedLabels.copyLink,
      icon: createElement(LinkIcon, { className: "size-4", "aria-hidden": true }),
      onClick: () => miscHandlers.onCopyLink?.(item.id),
    });
  }
  if (item.language && miscHandlers.onTranslate) {
    items.push({
      label: resolvedLabels.translate,
      icon: createElement(Languages, { className: "size-4", "aria-hidden": true }),
      onClick: () => miscHandlers.onTranslate?.(),
    });
  }
  // Mark divider before common items if editor-side items preceded.
  if (commonStart > 0 && items.length > commonStart) {
    items[commonStart] = { ...items[commonStart], separatorBefore: true };
  }

  // ─── Moderator section (orthogonal — divider above) ─────────────────────
  if (allowed("moderate") && moderatorActions) {
    const modItems = moderatorActions(item);
    if (modItems.length > 0) {
      modItems[0] = { ...modItems[0], separatorBefore: true };
      items.push(...modItems);
    }
  }

  // ─── Reader-side destructive items ──────────────────────────────────────
  const destructiveStart = items.length;
  if (viewerMode === "viewer") {
    if (allowed("report") && mutationHandlers.onReport) {
      items.push({
        label: resolvedLabels.report,
        icon: createElement(Flag, { className: "size-4", "aria-hidden": true }),
        destructive: true,
        onClick: () => mutationHandlers.onReport?.(item.id),
      });
    }
    if (allowed("muteAuthor") && mutationHandlers.onMuteAuthor) {
      const authorId = item.authorEntity?.id;
      if (authorId) {
        items.push({
          label: resolvedLabels.muteAuthor,
          icon: createElement(VolumeX, { className: "size-4", "aria-hidden": true }),
          destructive: true,
          onClick: () => mutationHandlers.onMuteAuthor?.(authorId),
        });
      }
    }
    if (allowed("blockAuthor") && mutationHandlers.onBlockAuthor) {
      const authorId = item.authorEntity?.id;
      if (authorId) {
        items.push({
          label: resolvedLabels.blockAuthor,
          icon: createElement(UserX, { className: "size-4", "aria-hidden": true }),
          destructive: true,
          onClick: () => mutationHandlers.onBlockAuthor?.(authorId),
        });
      }
    }
    if (
      allowed("unfollowTopic") &&
      mutationHandlers.onUnfollowTopic &&
      item.topics &&
      item.topics.length > 0
    ) {
      const firstTopic = item.topics[0];
      items.push({
        label: resolvedLabels.unfollowTopic,
        icon: createElement(HashIcon, { className: "size-4", "aria-hidden": true }),
        destructive: true,
        onClick: () => mutationHandlers.onUnfollowTopic?.(firstTopic),
      });
    }
  }
  if (destructiveStart > 0 && items.length > destructiveStart) {
    items[destructiveStart] = {
      ...items[destructiveStart],
      separatorBefore: true,
    };
  }

  // ─── Editor-mode delete (last, destructive, separated) ──────────────────
  if (
    viewerMode === "editor" &&
    allowed("delete") &&
    mutationHandlers.onDelete
  ) {
    items.push({
      label: resolvedLabels.delete,
      icon: createElement(Trash2, { className: "size-4", "aria-hidden": true }),
      destructive: true,
      separatorBefore: true,
      onClick: () => mutationHandlers.onDelete?.(item.id),
    });
  }

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy minimal kebab — v0.2-compatible handler-driven path
// ─────────────────────────────────────────────────────────────────────────────

interface LegacyKebabArgs {
  item: ContentCardItem;
  engagementHandlers: KebabEngagementHandlers;
  miscHandlers: KebabMiscHandlers;
  mutationHandlers: ContentCardMutationHandlers;
  labels: Required<ContentCardNewsLabels>;
}

function buildLegacyKebab(args: LegacyKebabArgs): CommentMenuItem[] {
  const { item, engagementHandlers, miscHandlers, mutationHandlers, labels } =
    args;
  const items: CommentMenuItem[] = [];

  if (engagementHandlers.onBookmark) {
    items.push({
      label: item.isBookmarked ? labels.unbookmark : labels.bookmark,
      icon: createElement(item.isBookmarked ? BookmarkX : Bookmark, {
        className: "size-4",
        "aria-hidden": true,
      }),
      onClick: () =>
        engagementHandlers.onBookmark?.(item.id, !item.isBookmarked),
    });
  }
  if (engagementHandlers.onShare) {
    items.push({
      label: labels.share,
      icon: createElement(Share2, { className: "size-4", "aria-hidden": true }),
      onClick: () => engagementHandlers.onShare?.(item.id),
    });
  }
  if (miscHandlers.onCopyLink) {
    items.push({
      label: labels.copyLink,
      icon: createElement(LinkIcon, { className: "size-4", "aria-hidden": true }),
      onClick: () => miscHandlers.onCopyLink?.(item.id),
    });
  }
  if (item.language && miscHandlers.onTranslate) {
    items.push({
      label: labels.translate,
      icon: createElement(Languages, { className: "size-4", "aria-hidden": true }),
      onClick: () => miscHandlers.onTranslate?.(),
    });
  }
  if (mutationHandlers.onReport) {
    items.push({
      label: labels.report,
      icon: createElement(Flag, { className: "size-4", "aria-hidden": true }),
      destructive: true,
      separatorBefore: items.length > 0,
      onClick: () => mutationHandlers.onReport?.(item.id),
    });
  }

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Recursion-strip helper for quoted articles (used at C9)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip `quotedArticle` from a `ContentCardItem` to prevent infinite recursion
 * when rendering nested quoted-article mini-cards. Used by `QuotedArticleCard`
 * to ensure a quoted article's own quotedArticle field is dropped at render
 * time (Q-P32).
 *
 * Pure — returns a shallow copy with `quotedArticle: undefined`. Doesn't
 * mutate the input.
 */
export function stripQuotedRecursion(item: ContentCardItem): ContentCardItem {
  if (!item.quotedArticle) return item;
  return { ...item, quotedArticle: undefined };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal date coercion (mirrors lib/format-default.ts but kept self-contained
// to avoid bidirectional dep)
// ─────────────────────────────────────────────────────────────────────────────

function toDate(value: string | Date | number): Date {
  if (value instanceof Date) return value;
  return new Date(value);
}
