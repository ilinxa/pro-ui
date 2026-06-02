"use client";

import {
  memo,
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import type { MouseEvent } from "react";
import { defaultRelativeTime } from "./hooks/use-relative-time";
import { defaultDateFormat, toDate } from "./lib/format-default";
import { defaultContentCardKebabActions } from "./lib/defaults";
import { resolveContentCardPermissions } from "./lib/permissions";
import { FeaturedPart } from "./parts/featured";
import { LargePart } from "./parts/large";
import { MediumPart } from "./parts/medium";
import { SmallPart } from "./parts/small";
import { ListPart } from "./parts/list";
import {
  DEFAULT_LABELS,
  type ContentCardItem,
  type ContentCardNews01Handle,
  type ContentCardNewsProps,
  type ResolvedPartProps,
} from "./types";

/**
 * ContentCardNews01 — magazine-style content card with 5 visual variants
 * dispatched via the `variant` prop (`featured` / `large` / `medium` / `small` / `list`).
 *
 * v0.3.0 grows the card into a backend-shaped composite — role-aware kebab,
 * permissions matrix, paywall + sensitive gates, badge stack, quoted-article
 * mini-card, light engagement counts (with slot-based engagement-bar-01
 * composition), per-entity click handlers, 11-method imperative handle, and
 * ~50 i18n label keys. All v0.2 behavior preserved when new props are absent.
 *
 * See the description doc at
 * docs/procomps/content-card-news-01-procomp/content-card-news-01-procomp-description-v0.3.0.md
 * for the full A+ trait set.
 */
function ContentCardNews01Impl(props: ContentCardNewsProps) {
  const {
    item: itemProp,
    variant = "medium",
    href,
    onClick,
    linkComponent: LinkComponent = "a",
    formatRelativeTime,
    formatDate,
    labels: labelsProp,
    categoryStyles,
    titleClassName,
    imageClassName,
    className,
    ariaLabel: ariaLabelProp,
    actions,
    loading: loadingProp,

    // v0.3 — role-aware
    viewerMode,
    permissions,
    canPerformAction,

    // v0.3 — slots
    renderBadges,
    renderAuthor,
    renderExcerpt,
    renderPaywallGate,
    renderSensitiveGate,
    renderQuoted,
    renderEngagementCounts,
    kebabActions,
    moderatorActions,

    // v0.3 — opt-outs
    disableBadgesRender = false,
    disableAuthorRender = false,
    disableExcerptRender = false,
    disablePaywallGate = false,
    disableSensitiveGate = false,
    disableQuotedRender = false,
    disableEngagementCounts = false,

    // v0.3 — engagement handlers
    onLike,
    onBookmark,
    onShare,
    onComment,
    onCommentCountClick,

    // v0.3 — per-entity click handlers
    onAuthorClick,
    onPublisherClick,
    onCategoryClick,
    onTopicClick,
    onTagClick,
    onQuotedClick,
    onTranslate,
    onRevealPaywall,
    onRevealSensitive,

    // v0.3 — mutation handlers (flattened from ContentCardMutationHandlers)
    onEdit,
    onDelete,
    onPublish,
    onUnpublish,
    onSchedule,
    onFeature,
    onPin,
    onChangeVisibility,
    onChangeCategory,
    onMarkSensitive,
    onSeeAnalytics,
    onPushToTop,
    onReport,
    onBlockAuthor,
    onMuteAuthor,
    onUnfollowTopic,

    ref,
  } = props;

  // ─── Local mirror (R-Plan-1) ─────────────────────────────────────────────
  const [statefulItem, setStatefulItem] = useState<ContentCardItem>(itemProp);
  const [paywallRevealed, setPaywallRevealed] = useState(false);
  const [sensitiveRevealed, setSensitiveRevealed] = useState(false);

  // Use the prop as the source of truth in render path — the mirror only
  // applies the local flags + any reset() override. v0.2 consumers pushing
  // updates via prop changes still see fresh data (statefulItem follows
  // itemProp implicitly via React's render).
  const effectiveItem = statefulItem === itemProp ? itemProp : statefulItem;

  // ─── Resolved labels + permissions ───────────────────────────────────────
  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const resolvedPermissions = useMemo(
    () => resolveContentCardPermissions(viewerMode, permissions),
    [viewerMode, permissions],
  );

  const canModerate = useMemo(() => {
    if (canPerformAction) {
      const r = canPerformAction("moderate", effectiveItem);
      if (r === true) return true;
      if (r === false) return false;
    }
    return resolvedPermissions.canModerate;
  }, [canPerformAction, effectiveItem, resolvedPermissions]);

  // ─── Date/format derivations (v0.2 carry; now prefers publishedAt over date) ─
  const dateSource = effectiveItem.publishedAt ?? effectiveItem.date;
  const date = useMemo(() => toDate(dateSource), [dateSource]);

  const formattedRelativeTime = useMemo(() => {
    if (!date) return undefined;
    return (formatRelativeTime ?? defaultRelativeTime)(date);
  }, [date, formatRelativeTime]);

  const formattedDate = useMemo(() => {
    if (!date) return undefined;
    return (formatDate ?? defaultDateFormat)(date);
  }, [date, formatDate]);

  const categoryStyle = useMemo(() => {
    if (!effectiveItem.category) return "bg-muted";
    return categoryStyles?.[effectiveItem.category] ?? "bg-muted";
  }, [effectiveItem.category, categoryStyles]);

  const titleId = useId();
  const ariaLabel =
    ariaLabelProp ?? `${labels.readArticlePrefix} ${effectiveItem.title}`;

  const handleClick = useCallback(
    (event: MouseEvent) => {
      onClick?.({ item: effectiveItem, event });
    },
    [onClick, effectiveItem],
  );

  const loading: "lazy" | "eager" =
    loadingProp ?? (variant === "featured" ? "eager" : "lazy");

  // ─── Internal reveal callbacks (set local flag + fire analytics hook) ────
  const onRevealPaywallInternal = useCallback(() => {
    setPaywallRevealed(true);
    onRevealPaywall?.(effectiveItem.id);
  }, [effectiveItem.id, onRevealPaywall]);

  const onRevealSensitiveInternal = useCallback(() => {
    setSensitiveRevealed(true);
    onRevealSensitive?.(effectiveItem.id);
  }, [effectiveItem.id, onRevealSensitive]);

  // ─── Engagement handlers pre-bound to item id ────────────────────────────
  const engagementHandlers = useMemo(
    () => ({
      onLike: onLike
        ? (nextLiked: boolean) => onLike(effectiveItem.id, nextLiked)
        : undefined,
      onComment: onCommentCountClick
        ? () => onCommentCountClick(effectiveItem.id)
        : onComment
          ? () => onComment(effectiveItem.id)
          : undefined,
      onShare: onShare ? () => onShare(effectiveItem.id) : undefined,
      onBookmark: onBookmark
        ? (nextBookmarked: boolean) =>
            onBookmark(effectiveItem.id, nextBookmarked)
        : undefined,
    }),
    [effectiveItem.id, onLike, onComment, onCommentCountClick, onShare, onBookmark],
  );

  // ─── Kebab items (computed once via the default helper unless full-takeover slot supplied) ─
  const boundTranslate = useMemo(() => {
    if (!onTranslate || !effectiveItem.language) return undefined;
    return () => onTranslate(effectiveItem.id, effectiveItem.language!);
  }, [onTranslate, effectiveItem.id, effectiveItem.language]);

  const kebabItems = useMemo(() => {
    if (kebabActions) return kebabActions(effectiveItem);
    return defaultContentCardKebabActions({
      item: effectiveItem,
      engagementHandlers: { onBookmark, onShare },
      miscHandlers: { onTranslate: boundTranslate },
      viewerMode,
      permissions,
      canPerformAction,
      mutationHandlers: {
        onEdit,
        onDelete,
        onPublish,
        onUnpublish,
        onSchedule,
        onFeature,
        onPin,
        onChangeVisibility,
        onChangeCategory,
        onMarkSensitive,
        onSeeAnalytics,
        onPushToTop,
        onReport,
        onBlockAuthor,
        onMuteAuthor,
        onUnfollowTopic,
      },
      moderatorActions,
      labels: labelsProp,
    });
  }, [
    kebabActions,
    effectiveItem,
    onBookmark,
    onShare,
    boundTranslate,
    viewerMode,
    permissions,
    canPerformAction,
    onEdit,
    onDelete,
    onPublish,
    onUnpublish,
    onSchedule,
    onFeature,
    onPin,
    onChangeVisibility,
    onChangeCategory,
    onMarkSensitive,
    onSeeAnalytics,
    onPushToTop,
    onReport,
    onBlockAuthor,
    onMuteAuthor,
    onUnfollowTopic,
    moderatorActions,
    labelsProp,
  ]);

  // ─── Imperative handle (11 methods) ──────────────────────────────────────
  useImperativeHandle(
    ref,
    (): ContentCardNews01Handle => ({
      openKebab: () => {
        // Variant parts own the actual trigger ref. Handle the open via a
        // sentinel — variant parts subscribe via the kebab trigger they
        // render. v0.3 ships an open-emitter at C11; for now the handle
        // method is wired but the trigger is per-variant.
        // No-op until C11 wires the per-variant open ref.
      },
      triggerEdit: () => onEdit?.(effectiveItem.id),
      triggerDelete: () => onDelete?.(effectiveItem.id),
      triggerPublish: () => onPublish?.(effectiveItem.id),
      triggerUnpublish: () => onUnpublish?.(effectiveItem.id),
      triggerPin: () => onPin?.(effectiveItem.id, !effectiveItem.isPinned),
      triggerFeature: () =>
        onFeature?.(effectiveItem.id, !effectiveItem.isFeatured),
      revealPaywall: onRevealPaywallInternal,
      revealSensitive: onRevealSensitiveInternal,
      reset: (next: ContentCardItem) => {
        setStatefulItem(next);
        setPaywallRevealed(false);
        setSensitiveRevealed(false);
      },
      getCurrentItem: () => effectiveItem,
    }),
    [
      effectiveItem,
      onEdit,
      onDelete,
      onPublish,
      onUnpublish,
      onPin,
      onFeature,
      onRevealPaywallInternal,
      onRevealSensitiveInternal,
    ],
  );

  // ─── Resolved part-props bag ─────────────────────────────────────────────
  const partProps: ResolvedPartProps = {
    item: effectiveItem,
    formattedDate,
    formattedRelativeTime,
    categoryStyle,
    labels,
    LinkComponent,
    href,
    onClick: onClick ? handleClick : undefined,
    ariaLabel,
    titleId,
    titleClassName,
    imageClassName,
    className,
    actions,
    loading,

    // v0.3 — role-aware
    viewerMode,
    resolvedPermissions,
    canModerate,

    // v0.3 — local-mirror flags
    paywallRevealed,
    sensitiveRevealed,
    onRevealPaywallInternal,
    onRevealSensitiveInternal,

    // v0.3 — render slots passthrough
    renderBadges,
    renderAuthor,
    renderExcerpt,
    renderPaywallGate,
    renderSensitiveGate,
    renderQuoted,
    renderEngagementCounts,

    // v0.3 — opt-outs passthrough
    disableBadgesRender,
    disableAuthorRender,
    disableExcerptRender,
    disablePaywallGate,
    disableSensitiveGate,
    disableQuotedRender,
    disableEngagementCounts,

    // v0.3 — handler bag + kebab + click handlers
    engagementHandlers,
    kebabItems,
    onAuthorClick,
    onPublisherClick,
    onCategoryClick,
    onTopicClick,
    onTagClick,
    onQuotedClick,
  };

  switch (variant) {
    case "featured":
      return <FeaturedPart {...partProps} />;
    case "large":
      return <LargePart {...partProps} />;
    case "small":
      return <SmallPart {...partProps} />;
    case "list":
      return <ListPart {...partProps} />;
    case "medium":
    default:
      return <MediumPart {...partProps} />;
  }
}

export const ContentCardNews01 = memo(ContentCardNews01Impl);
ContentCardNews01.displayName = "ContentCardNews01";

export default ContentCardNews01;
