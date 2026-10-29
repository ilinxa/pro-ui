"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
// F-S1 lock: cross-procomp imports use RELATIVE paths to specific files.
import type {
  Comment,
  CommentThreadHandle,
  CommentThreadProps,
} from "../comment-thread/types";
import type {
  EngagementAction,
  EngagementActionEvent,
  EngagementBarHandle,
  EngagementDelta,
} from "../engagement-bar/types";
import type { LikersStripLabels } from "../engagement-bar/parts/likers-strip";
import type { ShareMenuLabels } from "../engagement-bar/parts/share-menu";
import type { Post, PostCardProps, PostHandlers, PostInlineDisclosure } from "./types";
import {
  defaultPostEngagementActions,
  defaultPostKebabActions,
} from "./lib/defaults";
import { mergeLabels, resolveLabels } from "./lib/labels";
import {
  createRelativeTimeFormatter,
  resolveLocale,
  toDate,
} from "../comment-thread/lib/format-time";
import { useNow } from "./hooks/use-now";
import { usePanelFocus } from "./hooks/use-panel-focus";
import { usePostState } from "./hooks/use-post-state";
import { PostKebab } from "./parts/post-header";
import { FeedVariant } from "./parts/feed-variant";
import { CompactVariant } from "./parts/compact-variant";
import { ListVariant } from "./parts/list-variant";
import { DetailVariant } from "./parts/detail-variant";
import { LikersStrip } from "../engagement-bar/parts/likers-strip";
import { ShareMenu } from "../engagement-bar/parts/share-menu";
import { CommentThread } from "../comment-thread/comment-thread";
import { CommentThreadScrollArea } from "../comment-thread/parts/comment-thread-scroll-area";

/**
 * Stands in for `commentThread` when the host passes none. A module-level array keeps the
 * thread's `comments` identity stable across renders (a fresh `[]` each render would trip its
 * "comments changing identity" warning).
 */
const EMPTY_COMMENTS: Comment[] = [];

function PostCardInner(props: PostCardProps) {
  const {
    variant,
    post: postProp,
    onPostChange,
    optimistic,
    currentUser,

    reactions,
    getAuthorHref,
    subtitle,
    noticeSlot,
    extraKebabActions,
    locale: localeProp,
    timeZone,
    now: nowProp,
    formatRelativeTime: formatRelativeTimeProp,
    formatCount: formatCountProp,
    mediaProps,
    engagementBarProps,
    commentThreadProps,

    commentThread,
    commentPageSize,

    onLike,
    onComment,
    onShare,
    onBookmark,

    onAddComment,
    onLikeComment,
    onDeleteComment,
    onReportComment,
    onLoadMoreComments,
    onCopyLink,
    onReport,

    // v0.2.0 mutation handlers — destructured here for use by the imperative handle
    // (C3) AND the role-aware kebab wiring (C11). The imperative handle exposes only
    // the 5 most-direct triggers (per dynamicity-primacy memory: programmatic escape
    // hatches for the common actions). The kebab pulls from all 8 via `mutationHandlers`.
    onEdit,
    onDelete,
    onPin,
    onRevealSensitive,
    onVotePoll,
    onChangeVisibility,
    onMarkSensitive,
    onSeeAnalytics,
    onBlockAuthor,
    onMuteAuthor,
    onTranslate,

    // v0.2.0 role-aware kebab inputs (C11) — pass-through to defaultPostKebabActions.
    // Triple-optional: when ALL three are undefined, the helper takes the legacy
    // handler-driven path (zero v0.1 drift). When ANY is set, the resolver assembles
    // role-aware items.
    permissions,
    canPerformAction,

    // v0.2.0 header-level callbacks (threaded to PostHeader via variants).
    onLocationClick,
    onMentionClick,
    // v0.2.0 content-body sibling — tag chips below content (C5).
    onTagClick,

    // v0.2.0 sensitive-media gate (C6 — feed + detail only per description §1.3).
    disableSensitiveGate,
    renderSensitiveGate,

    // v0.2.0 link-preview card (C7 — feed + detail only per description §1.3).
    onLinkPreviewClick,
    disableLinkPreviewRender,
    renderLinkPreview,

    // v0.2.0 repost mini-card (C8 — feed + detail only per description §1.3).
    onRepostOfClick,
    disableRepostOfRender,
    renderRepostOf,

    // v0.2.0 poll widget (C9 — feed + detail only per description §1.3).
    // `viewerMode` is also read by C11's kebab wiring (extended
    // `defaultPostKebabActions`); destructured once here.
    viewerMode,
    disablePollRender,
    renderPoll,

    engagementSubscribe,
    commentSubscribe,
    onSubscribeEngagementDelta,
    onSubscribeCommentDelta,

    getHref,
    linkComponent,
    disableHeartBurst = false,

    engagementMode = "inline",
    likers,
    onLoadMoreLikers,
    shareSuggestions,
    onShareSearch,
    onShareTo,
    likersStripProps,
    shareMenuProps,
    inlineCommentsMaxHeight = "24rem",
    defaultInlinePanel = "none",
    openLikersOnLike = true,

    renderHeader,
    renderContent,
    renderMedia,
    engagementActions: engagementActionsSlot,
    renderEngagementBar,
    kebabActions,
    moderatorActions,
    commentActions,
    renderCommentSection,

    headingAs,
    bodyMaxLines: bodyMaxLinesProp,

    labels: labelsProp,
    className,
    headerClassName,
    bodyClassName,
    mediaClassName,
    engagementClassName,
    commentSectionClassName,

    ref,
  } = props;

  // ─── Post state: the prop (controlled, with `onPostChange`) or a mount-only mirror ───
  const postState = usePostState({ post: postProp, onPostChange, optimistic });
  const {
    shown: statefulPost,
    like: stateLike,
    bookmark: stateBookmark,
    vote: stateVote,
    delta: stateDelta,
    reset: stateReset,
    voting: pollVoting,
  } = postState;

  // Sensitive-media gate state — flips to `true` when viewer taps "Show".
  // Resets on `ref.current.reset(...)`.
  const [sensitiveRevealed, setSensitiveRevealed] = useState(false);

  // ─── Inline panel state (only meaningful when engagementMode === "inline") ───
  // detail variant ignores inline mode (it always shows the thread).
  const inlineModeActive = engagementMode === "inline" && variant !== "detail";
  const [activePanel, setActivePanel] = useState<
    "none" | "likes" | "comments" | "share"
  >(inlineModeActive ? defaultInlinePanel : "none");

  const panelBase = useId();
  const panelIds = useMemo(
    () => ({ likes: `${panelBase}-likes`, comments: `${panelBase}-comments`, share: `${panelBase}-share` }),
    [panelBase],
  );

  // Focus follows the panels (see the hook).
  const {
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    panelRef,
  } = usePanelFocus(activePanel, setActivePanel);

  // A label that must be a function but is not (an untyped upgrade from a template string) is
  // ignored; development builds say so once per key per card.
  const [warnedKeys] = useState(() => new Set<string>());
  const labels = useMemo(
    () =>
      resolveLabels(labelsProp, (key) => {
        if (process.env.NODE_ENV === "production" || warnedKeys.has(key)) return;
        warnedKeys.add(key);
        console.warn(
          `PostCard: labels.${key} must be a function since 0.6.0 (it was a template string); the default is used. See the usage notes on label functions.`,
        );
      }),
    [labelsProp, warnedKeys],
  );

  // ─── Locale, count and time formatting ───
  const locale = resolveLocale(localeProp);
  const formatCount = useMemo(() => {
    if (formatCountProp) return formatCountProp;
    const nf = new Intl.NumberFormat(locale, { notation: "compact" });
    return (n: number) => nf.format(n);
  }, [formatCountProp, locale]);
  const defaultFormatRelativeTime = useMemo(
    () => createRelativeTimeFormatter(locale, timeZone),
    [locale, timeZone],
  );
  const formatRelativeTime =
    formatRelativeTimeProp ?? labelsProp?.formatRelativeTime ?? defaultFormatRelativeTime;
  // "Now" is `null` on the server and the first client render, so no relative text renders there.
  const now = useNow(nowProp);
  const formattedTime = now
    ? formatRelativeTime(toDate(statefulPost.createdAt), now)
    : null;

  // ─── Heart-burst + variant defaults ───
  const resolvedHeadingAs: "h2" | "h3" | "h4" =
    headingAs ?? (variant === "detail" ? "h2" : "h3");
  const resolvedBodyMaxLines =
    bodyMaxLinesProp ??
    (variant === "feed"
      ? 3
      : variant === "compact" || variant === "list"
        ? 2
        : 0);

  const heartBurstWired =
    !disableHeartBurst &&
    (statefulPost.media?.length ?? 0) > 0 &&
    // With `reactions` the like is replaced by a reaction action, so only `onReact` is told.
    (reactions ? !!reactions.onReact : !!onLike) &&
    (variant === "feed" || variant === "detail");

  const cardLinkable = !!getHref && variant !== "detail";
  const linkHref = getHref ? getHref(statefulPost) : undefined;
  const LinkComponent = linkComponent ?? "a";

  // ─── Realtime engagement deltas: applied to the mirror, or reported when controlled ───
  const onSubscribeEngagementDeltaRef = useRef(onSubscribeEngagementDelta);
  useEffect(() => {
    onSubscribeEngagementDeltaRef.current = onSubscribeEngagementDelta;
  });

  useEffect(() => {
    if (!engagementSubscribe) return;
    const unsub = engagementSubscribe((delta: EngagementDelta) => {
      onSubscribeEngagementDeltaRef.current?.(delta);
      stateDelta(delta);
    });
    return unsub;
  }, [engagementSubscribe, stateDelta]);

  // ─── Wrapped handlers (R-Plan-2) — the post state first, then the host's handler ───
  const handleLike = useCallback(
    (id: string, next: boolean, event?: EngagementActionEvent) => {
      // The event only when there is one (a double-tap or the handle has none): no trailing undefined.
      stateLike(next, () => (event ? onLike?.(id, next, event) : onLike?.(id, next)));
      // Inline mode: open likers panel on a fresh like (kasder UX). The heart is the opener
      // (`event.currentTarget`): Safari never focuses a clicked button (0.7.0).
      if (inlineModeActive && next && openLikersOnLike) {
        openPanel("likes", event);
      }
    },
    [stateLike, onLike, inlineModeActive, openLikersOnLike, openPanel],
  );

  const handleBookmark = useCallback(
    (id: string, next: boolean) => {
      stateBookmark(next, () => onBookmark?.(id, next));
    },
    [stateBookmark, onBookmark],
  );

  // Under inline mode, comment-icon click toggles the inline comments panel
  // instead of firing the host's onComment.
  const handleComment = useCallback(
    (id: string, event?: EngagementActionEvent) => {
      if (inlineModeActive) {
        togglePanel("comments", event);
      } else {
        onComment?.(id);
      }
    },
    [inlineModeActive, onComment, togglePanel],
  );

  // Under inline mode + shareSuggestions provided, share toggles the share panel
  // instead of firing the host's onShare.
  const handleShare = useCallback(
    (id: string, event?: EngagementActionEvent) => {
      if (inlineModeActive && shareSuggestions) {
        togglePanel("share", event);
      } else {
        onShare?.(id);
      }
    },
    [inlineModeActive, shareSuggestions, onShare, togglePanel],
  );

  const wrappedHandlers: PostHandlers = useMemo(
    () => ({
      onLike: handleLike,
      onComment: handleComment,
      onShare: handleShare,
      onBookmark: handleBookmark,
    }),
    [handleLike, handleComment, handleShare, handleBookmark],
  );

  // ─── Default kebab handlers ───
  const handleCopyLink = useCallback(
    (id: string) => {
      if (onCopyLink) {
        onCopyLink(id);
      } else if (getHref && typeof navigator !== "undefined" && navigator.clipboard) {
        // Default: write the href to clipboard
        const href = getHref(statefulPost);
        if (href) {
          void navigator.clipboard.writeText(
            href.startsWith("http")
              ? href
              : typeof window !== "undefined"
                ? new URL(href, window.location.origin).toString()
                : href,
          );
        }
      }
    },
    [onCopyLink, getHref, statefulPost],
  );

  const handleReport = useCallback(
    (id: string) => {
      onReport?.(id);
    },
    [onReport],
  );

  // Inline-mode: count tap on the like action toggles the likers panel
  // (heart icon stays bound to onToggle).
  const handleLikeCountClick = useCallback((event: EngagementActionEvent) => {
    if (!inlineModeActive) return;
    togglePanel("likes", event);
  }, [inlineModeActive, togglePanel]);

  // Inline mode: which panel is open and the event-aware openers — for the default actions and,
  // since 0.7.0, the `engagementActions` slot (FU-2).
  const postId = statefulPost.id;
  const inlineDisclosure = useMemo<PostInlineDisclosure | undefined>(
    () =>
      inlineModeActive
        ? {
            open: activePanel,
            ids: panelIds,
            shareOpens: !!shareSuggestions,
            likes: handleLikeCountClick,
            comment: (e) => handleComment(postId, e),
            share: (e) => handleShare(postId, e),
          }
        : undefined,
    [inlineModeActive, activePanel, panelIds, shareSuggestions, handleLikeCountClick, handleComment, handleShare, postId],
  );

  // ─── Engagement actions array (mirrored post + wrapped handlers) ───
  const engagementActionsArr = useMemo(
    () =>
      engagementActionsSlot
        ? engagementActionsSlot(statefulPost, wrappedHandlers, variant, inlineDisclosure)
        : defaultPostEngagementActions(
            statefulPost,
            wrappedHandlers,
            variant,
            inlineModeActive ? handleLikeCountClick : undefined,
            reactions,
            inlineDisclosure,
          ),
    [
      engagementActionsSlot,
      statefulPost,
      wrappedHandlers,
      variant,
      inlineModeActive,
      handleLikeCountClick,
      reactions,
      inlineDisclosure,
    ],
  );

  // ─── Kebab items (C11 — role-aware via extended defaultPostKebabActions) ───
  // The helper is dual-mode: when viewerMode + permissions + canPerformAction are
  // ALL undefined, it takes the v0.1 legacy code path (zero drift). When ANY is set,
  // it resolves the matrix + assembles role-aware items per plan §3 resolution order.
  // `kebabActions` is a full takeover: `extraKebabActions` is then ignored.
  const kebabItems = useMemo(() => {
    if (kebabActions) return kebabActions(statefulPost);
    return defaultPostKebabActions(
      statefulPost,
      {
        onBookmark: handleBookmark,
        onShare,
        onReport: onReport ? handleReport : undefined,
        onCopyLink:
          onCopyLink || getHref ? handleCopyLink : undefined,
      },
      labels,
      viewerMode,
      permissions,
      canPerformAction,
      {
        onEdit,
        onDelete,
        onPin,
        onChangeVisibility,
        onMarkSensitive,
        onSeeAnalytics,
        onBlockAuthor,
        onMuteAuthor,
      },
      onTranslate,
      moderatorActions,
      extraKebabActions?.(statefulPost),
    );
  }, [
    kebabActions,
    statefulPost,
    handleBookmark,
    onShare,
    onReport,
    handleReport,
    onCopyLink,
    getHref,
    handleCopyLink,
    labels,
    viewerMode,
    permissions,
    canPerformAction,
    onEdit,
    onDelete,
    onPin,
    onChangeVisibility,
    onMarkSensitive,
    onSeeAnalytics,
    onBlockAuthor,
    onMuteAuthor,
    onTranslate,
    moderatorActions,
    extraKebabActions,
  ]);

  // ─── State + refs ───
  const [kebabOpen, setKebabOpen] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  // A different post (controlled): the reveal, the open panel and the open menu belonged to the
  // old one. The in-flight changes are dropped by the post state.
  const [seenPostId, setSeenPostId] = useState(postProp.id);
  if (onPostChange !== undefined && seenPostId !== postProp.id) {
    setSeenPostId(postProp.id);
    setSensitiveRevealed(false);
    setActivePanel(inlineModeActive ? defaultInlinePanel : "none");
    setKebabOpen(false);
  }
  const barRef = useRef<EngagementBarHandle | null>(null);
  const threadRef = useRef<CommentThreadHandle | null>(null);
  const statefulPostRef = useRef<Post>(statefulPost);
  const reactionsRef = useRef(reactions);
  const heartBurstWiredRef = useRef(heartBurstWired);
  useEffect(() => {
    statefulPostRef.current = statefulPost;
    reactionsRef.current = reactions;
    heartBurstWiredRef.current = heartBurstWired;
  });

  // The actions menu is built once; the default header places it, and `renderHeader` receives it.
  const hasKebab = kebabItems.some((item) => !item.hidden);
  const hasKebabRef = useRef(hasKebab);
  useEffect(() => {
    hasKebabRef.current = hasKebab;
  });
  const kebab = hasKebab ? (
    <PostKebab
      open={kebabOpen}
      onOpenChange={setKebabOpen}
      items={kebabItems}
      ariaLabel={labels.kebabAriaLabel}
    />
  ) : null;

  const engagementActionsRef = useRef(engagementActionsArr);
  useEffect(() => {
    engagementActionsRef.current = engagementActionsArr;
  });

  // The built-in bar's handle, only when a like can actually be applied through
  // it: bar mounted (null under a `renderEngagementBar` takeover) AND a `like`
  // action exists and is not disabled / hidden (a custom `engagementActions` slot may omit or gate it). The bar's
  // `triggerLike()` silently no-ops otherwise, so no burst may play.
  const getLikeCapableBar = useCallback((): EngagementBarHandle | null => {
    const bar = barRef.current;
    if (!bar) return null;
    return engagementActionsRef.current.some(
      (a) => a.kind === "like" && !a.disabled && !a.hidden,
    )
      ? bar
      : null;
  }, []);

  // The same for a `reaction` action (the `reactions` prop, or one from a custom actions slot).
  const getReactionTarget = useCallback((): {
    bar: EngagementBarHandle;
    kind: string;
  } | null => {
    const bar = barRef.current;
    if (!bar) return null;
    const action = engagementActionsRef.current.find(
      (a): a is Extract<EngagementAction, { kind: "reaction" }> =>
        a.kind === "reaction" && !a.disabled && !a.hidden,
    );
    if (!action) return null;
    const wanted = reactionsRef.current?.defaultKind;
    const kind = action.kinds.some((k) => k.key === wanted)
      ? (wanted as string)
      : action.kinds[0]?.key;
    return kind === undefined ? null : { bar, kind };
  }, []);

  // Double-tap never REMOVES a like or a reaction: unliked -> like + burst; already liked ->
  // burst only; no reaction yet -> the default reaction + burst; a reaction set -> burst only;
  // nothing applicable -> nothing. "Liked" / "reacted" are read from the bar's own state (it is
  // the source `triggerLike` / `triggerReaction` act on).
  const onMediaDoubleTap = useCallback(() => {
    if (!heartBurstWired) return;
    const reaction = getReactionTarget();
    if (reaction) {
      if (reaction.bar.getCurrentReaction() === null) {
        reaction.bar.triggerReaction(reaction.kind);
      }
      setBurstKey((k) => k + 1);
      return;
    }
    const bar = getLikeCapableBar();
    if (!bar) return;
    if (!bar.getCurrentState().liked) bar.triggerLike();
    setBurstKey((k) => k + 1);
  }, [heartBurstWired, getReactionTarget, getLikeCapableBar]);

  // C6 — sensitive-media reveal: single handler combining local-state flip
  // + host's onRevealSensitive callback (analytics hook). Used by the gate
  // button in feed + detail variants AND by the imperative handle's
  // revealSensitive() (which does its own flip via the ref pattern in C3).
  const onSensitiveReveal = useCallback(() => {
    setSensitiveRevealed(true);
    onRevealSensitive?.(statefulPostRef.current.id);
  }, [onRevealSensitive]);

  // C9 — poll vote dispatcher, used by the PollWidget in feed + detail variants and by the
  // imperative handle's votePoll(). The vote shows over the post while the host's promise is in
  // flight; a rejection drops it.
  const onPollVote = useCallback(
    (optionId: string) => {
      stateVote(optionId, () => onVotePoll?.(statefulPostRef.current.id, optionId));
    },
    [stateVote, onVotePoll],
  );
  // The handle goes through a ref so its identity does not follow an inline `onVotePoll`.
  const onPollVoteRef = useRef(onPollVote);
  useEffect(() => {
    onPollVoteRef.current = onPollVote;
  });
  const isOwnerView = viewerMode === "owner";

  // ─── Imperative handle (R-Plan-3 + v0.2.0 C3 additions) ───
  // Handler refs — useImperativeHandle deps + closure capture pattern. v0.2.0
  // mutation handlers (onEdit / onDelete / onPin / onRevealSensitive)
  // are accessed via refs so the handle identity doesn't churn on every handler
  // identity change (host typically re-creates them per render).
  const onEditRef = useRef(onEdit);
  const onDeleteRef = useRef(onDelete);
  const onPinRef = useRef(onPin);
  const onRevealSensitiveRef = useRef(onRevealSensitive);
  useEffect(() => {
    onEditRef.current = onEdit;
    onDeleteRef.current = onDelete;
    onPinRef.current = onPin;
    onRevealSensitiveRef.current = onRevealSensitive;
  });

  useImperativeHandle(
    ref,
    () => ({
      // No menu (every item hidden): nothing to open, and it must not pop open later.
      openKebab: () => {
        if (hasKebabRef.current) setKebabOpen(true);
      },
      triggerLike: () => {
        // Toggle semantics are kept; the burst plays only when the result is liked / reacted.
        const reaction = getReactionTarget();
        if (reaction) {
          if (reaction.bar.getCurrentReaction() === null) {
            reaction.bar.triggerReaction(reaction.kind);
            if (heartBurstWiredRef.current) setBurstKey((k) => k + 1);
          } else {
            reaction.bar.triggerReaction(null);
          }
          return;
        }
        const bar = getLikeCapableBar();
        if (!bar) return;
        const wasLiked = bar.getCurrentState().liked;
        bar.triggerLike();
        if (!wasLiked && heartBurstWiredRef.current) setBurstKey((k) => k + 1);
      },
      getCurrentPost: () => statefulPostRef.current,
      reset: (next: Post) => {
        // Drops the in-flight changes and (uncontrolled) replaces the mirror; the controlled
        // `post` prop still wins. Also clears the sensitive-gate reveal.
        stateReset(next);
        setSensitiveRevealed(false);
      },
      getEngagementHandle: () => barRef.current,
      getThreadHandle: () => threadRef.current,

      // v0.2.0 triggers — fire the handler without consulting the permissions
      // matrix. Matrix gates the UI; handle is the escape hatch. If the handler
      // isn't wired, the method is a no-op.
      triggerEdit: () => {
        onEditRef.current?.(statefulPostRef.current.id);
      },
      triggerDelete: () => {
        onDeleteRef.current?.(statefulPostRef.current.id);
      },
      triggerPin: () => {
        const p = statefulPostRef.current;
        onPinRef.current?.(p.id, !(p.isPinned ?? false));
      },
      revealSensitive: () => {
        setSensitiveRevealed(true);
        onRevealSensitiveRef.current?.(statefulPostRef.current.id);
      },
      votePoll: (optionId: string) => onPollVoteRef.current(optionId),
    }),
    // Everything the handle reads changes through refs, so its identity is stable.
    [getLikeCapableBar, getReactionTarget, stateReset],
  );

  const authorId = useId();

  // ─── Comment thread props, built once for the inline panel and the detail variant ───
  // The card's own comment props win over `commentThreadProps` when defined. `locale`,
  // `timeZone` and `now` are the card's unless `commentThreadProps` sets them; the card's
  // `commentLabels` are laid over `commentThreadProps.labels`.
  const threadProps = useMemo<Omit<CommentThreadProps, "comments">>(() => {
    const own: Partial<Omit<CommentThreadProps, "comments">> = {
      currentUser,
      pageSize: commentPageSize,
      subscribe: commentSubscribe,
      onSubscribeDelta: onSubscribeCommentDelta,
      onAddComment,
      onLikeComment,
      onDeleteComment,
      onReportComment,
      onLoadMore: onLoadMoreComments,
      commentActions,
    };
    const merged: Record<string, unknown> = { ...commentThreadProps };
    for (const [key, value] of Object.entries(own)) {
      if (value !== undefined) merged[key] = value;
    }
    merged.locale = commentThreadProps?.locale ?? locale;
    merged.timeZone = commentThreadProps?.timeZone ?? timeZone;
    merged.now = commentThreadProps?.now ?? nowProp;
    merged.formatRelativeTime = commentThreadProps?.formatRelativeTime ?? formatRelativeTimeProp;
    merged.formatCount = commentThreadProps?.formatCount ?? formatCountProp;
    merged.labels = mergeLabels(
      commentThreadProps?.labels ?? {},
      labelsProp?.commentLabels,
    );
    return merged as Omit<CommentThreadProps, "comments">;
  }, [
    commentThreadProps,
    currentUser,
    commentPageSize,
    commentSubscribe,
    onSubscribeCommentDelta,
    onAddComment,
    onLikeComment,
    onDeleteComment,
    onReportComment,
    onLoadMoreComments,
    commentActions,
    locale,
    timeZone,
    nowProp,
    formatRelativeTimeProp,
    formatCountProp,
    labelsProp?.commentLabels,
  ]);

  const comments = commentThread ?? EMPTY_COMMENTS;
  // A host that reports send state keeps the share panel open after a pick.
  const keepShareOpen = shareMenuProps?.pendingIds !== undefined || shareMenuProps?.sentIds !== undefined;

  // ─── Inline panel node (only built when inline mode + a panel is open) ───
  const inlinePanelNode = useMemo(() => {
    if (!inlineModeActive || activePanel === "none") return null;
    if (activePanel === "likes") {
      const likersLabels = mergeLabels<Partial<LikersStripLabels>>(
        {
          heading: labels.likersHeading,
          close: labels.hidePanelLabel,
          moreAriaLabel: labels.likersMoreLabel,
        },
        labelsProp?.likersLabels,
      );
      return (
        <LikersStrip
          // With `reactions` the shown count is the reactions' total; `null` stays withheld.
          totalCount={reactions ? (reactions.totalCount === undefined ? statefulPost.likes : reactions.totalCount) : statefulPost.likes}
          likers={likers}
          onLoadMore={onLoadMoreLikers}
          labels={likersLabels}
          locale={locale}
          formatCount={formatCount}
          onClose={closePanel}
          {...likersStripProps}
        />
      );
    }
    if (activePanel === "share") {
      const shareLabels = mergeLabels<Partial<ShareMenuLabels>>(
        {
          heading: labels.shareHeading,
          searchPlaceholder: labels.shareSearchPlaceholder,
          empty: labels.shareEmptyLabel,
          close: labels.hidePanelLabel,
        },
        labelsProp?.shareLabels,
      );
      return (
        <ShareMenu
          users={shareSuggestions ?? []}
          onSearch={onShareSearch}
          onShareTo={(user) => {
            onShareTo?.(statefulPost.id, user);
            // With send state the row shows "Sending…" / "Sent": the panel stays open (0.7.0).
            if (!keepShareOpen) closePanel();
          }}
          labels={shareLabels}
          locale={locale}
          onClose={closePanel}
          {...shareMenuProps}
        />
      );
    }
    // comments
    // A focusable, named region (0.7.0): keyboard users can scroll it (axe scrollable-region-focusable).
    return (
      <CommentThreadScrollArea
        aria-label={labelsProp?.commentLabels?.commentsRegion ?? labels.commentsHeading}
        style={{ maxHeight: inlineCommentsMaxHeight }}
      >
        <CommentThread ref={threadRef} comments={comments} {...threadProps} />
      </CommentThreadScrollArea>
    );
  }, [
    inlineModeActive,
    activePanel,
    closePanel,
    reactions,
    statefulPost.id,
    statefulPost.likes,
    likers,
    labels,
    labelsProp?.likersLabels,
    labelsProp?.shareLabels,
    locale,
    formatCount,
    onLoadMoreLikers,
    shareSuggestions,
    onShareSearch,
    onShareTo,
    likersStripProps,
    shareMenuProps,
    keepShareOpen,
    labelsProp?.commentLabels?.commentsRegion,
    inlineCommentsMaxHeight,
    comments,
    threadProps,
  ]);

  // ─── Common props bundle ───
  const baseProps = {
    post: statefulPost,
    currentUser,
    authorId,
    formattedTime,
    kebab,
    engagementActions: engagementActionsArr,
    engagementBarRef: barRef,
    engagementClassName,
    engagementLabels: labelsProp?.engagementLabels,
    engagementBarProps,
    optimistic,
    engagementSubscribeNoop: undefined,
    bodyMaxLines: resolvedBodyMaxLines,
    bodyClassName,
    textLabels: labelsProp?.textLabels,
    headingAs: resolvedHeadingAs,
    labels,
    locale,
    timeZone,
    now: now ?? undefined,
    formatCount,
    formatRelativeTime,
    repostForwarding: {
      formatRelativeTime: formatRelativeTimeProp,
      formatCount: formatCountProp,
    },
    getAuthorHref,
    subtitle,
    noticeSlot,
    mediaProps,
    burstKey,
    heartBurstWired,
    onMediaDoubleTap: heartBurstWired ? onMediaDoubleTap : undefined,
    cardLinkable,
    linkHref,
    inlinePanelNode: inlinePanelNode
      ? <div ref={panelRef} id={activePanel === "none" ? undefined : panelIds[activePanel]}>{inlinePanelNode}</div>
      : null,
    LinkComponent,
    renderHeader,
    renderContent,
    renderMedia,
    renderEngagementBar,
    onLocationClick,
    onMentionClick,
    onTagClick,
    sensitiveRevealed,
    onSensitiveReveal,
    disableSensitiveGate,
    renderSensitiveGate,
    onLinkPreviewClick,
    disableLinkPreviewRender,
    renderLinkPreview,
    onRepostOfClick,
    disableRepostOfRender,
    renderRepostOf,
    getHref,
    linkComponent,
    cardLabels: labelsProp,
    onPollVote,
    pollBusy: pollVoting,
    isOwnerView,
    disablePollRender,
    renderPoll,
    className,
    headerClassName,
    mediaClassName,
  };

  switch (variant) {
    case "feed":
      return <FeedVariant {...baseProps} />;
    case "compact":
      return <CompactVariant {...baseProps} />;
    case "list":
      return <ListVariant {...baseProps} />;
    case "detail":
      return (
        <DetailVariant
          {...baseProps}
          commentThread={comments}
          threadProps={threadProps}
          commentHandlers={{
            onAddComment: threadProps.onAddComment,
            onLikeComment: threadProps.onLikeComment,
            onDeleteComment: threadProps.onDeleteComment,
            onReportComment: threadProps.onReportComment,
            onLoadMoreComments: threadProps.onLoadMore,
          }}
          renderCommentSection={renderCommentSection}
          threadRef={threadRef}
          commentSectionClassName={commentSectionClassName}
          commentsHeading={labels.commentsHeading}
        />
      );
  }
}

const PostCard = memo(PostCardInner);
PostCard.displayName = "PostCard";

export { PostCard };
