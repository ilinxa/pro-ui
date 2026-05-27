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
import type {
  CommentThread01Handle,
} from "@/registry/components/data/comment-thread-01";
import { defaultRelativeTime, toDate } from "@/registry/components/data/comment-thread-01";
import type {
  EngagementBar01Handle,
  EngagementDelta,
} from "@/registry/components/data/engagement-bar-01";
import {
  DEFAULT_POST_CARD_LABELS,
  type Post,
  type PostCard01Props,
  type PostCard01Labels,
  type PostHandlers,
  type PostLikeUser,
} from "./types";
import {
  defaultPostEngagementActions,
  defaultPostKebabActions,
} from "./lib/defaults";
import { FeedVariant } from "./parts/feed-variant";
import { CompactVariant } from "./parts/compact-variant";
import { ListVariant } from "./parts/list-variant";
import { DetailVariant } from "./parts/detail-variant";
import {
  LikersStrip,
  ShareMenu,
} from "@/registry/components/data/engagement-bar-01";
import { CommentThread01 } from "@/registry/components/data/comment-thread-01";

function PostCard01Inner(props: PostCard01Props) {
  const {
    variant,
    post: initialPost,
    currentUser,

    commentThread,
    commentPageSize = 10,

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

    // v0.2.0 mutation handlers — destructured here for use by the imperative handle (C3).
    // Others (onChangeVisibility / onMarkSensitive / onSeeAnalytics / onBlockAuthor /
    // onMuteAuthor) flow through PostMutationHandlers props inheritance and reach the
    // kebab via the C11 wiring; the imperative handle exposes only the 5 most-direct
    // triggers (per dynamicity-primacy memory: programmatic escape hatches for the
    // common actions).
    onEdit,
    onDelete,
    onPin,
    onRevealSensitive,
    onVotePoll,

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

    engagementSubscribe,
    commentSubscribe,
    onSubscribeEngagementDelta,
    onSubscribeCommentDelta,

    getHref,
    linkComponent,
    disableHeartBurst = false,

    engagementMode = "inline",
    likers: initialLikers,
    onLoadMoreLikers,
    shareSuggestions,
    onShareSearch,
    onShareTo,
    inlineCommentsMaxHeight = "24rem",
    defaultInlinePanel = "none",
    openLikersOnLike = true,

    renderHeader,
    renderContent,
    renderMedia,
    engagementActions: engagementActionsSlot,
    renderEngagementBar,
    kebabActions,
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

  // ─── Always-uncontrolled `post` — stateful from mount; updated via reset() handle ───
  const [statefulPost, setStatefulPost] = useState<Post>(initialPost);

  // ─── v0.2.0 local-mirror additions (per plan C3 / Q-P32 / Q-P33) ───
  // Optimistic poll vote — host can reject by calling `ref.current.reset(originalPost)`
  // which clears this alongside the rest of the mirror.
  const [pollVote, setPollVote] = useState<{
    optionId: string;
    votedAt: Date;
  } | null>(null);
  // Sensitive-media gate state — flips to `true` when viewer taps "Show".
  // Resets on `ref.current.reset(...)`.
  const [sensitiveRevealed, setSensitiveRevealed] = useState(false);

  // ─── Inline panel state (only meaningful when engagementMode === "inline") ───
  // detail variant ignores inline mode (it always shows the thread).
  const inlineModeActive = engagementMode === "inline" && variant !== "detail";
  const [activePanel, setActivePanel] = useState<
    "none" | "likes" | "comments" | "share"
  >(inlineModeActive ? defaultInlinePanel : "none");
  const [statefulLikers, setStatefulLikers] = useState<PostLikeUser[]>(
    initialLikers ?? [],
  );

  const labels = useMemo<
    Required<
      Omit<PostCard01Labels, "formatRelativeTime" | "engagementLabels" | "commentLabels">
    >
  >(
    () => ({ ...DEFAULT_POST_CARD_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const format = labelsProp?.formatRelativeTime ?? defaultRelativeTime;
  const formattedTime = format(toDate(statefulPost.createdAt), new Date());

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
    !!onLike &&
    (variant === "feed" || variant === "detail");

  const cardLinkable = !!getHref && variant !== "detail";
  const linkHref = getHref ? getHref(statefulPost) : undefined;
  const LinkComponent = linkComponent ?? "a";

  // ─── Local mirror updates via realtime subscribe (R-Plan-1 + R-Plan-4) ───
  const onSubscribeEngagementDeltaRef = useRef(onSubscribeEngagementDelta);
  useEffect(() => {
    onSubscribeEngagementDeltaRef.current = onSubscribeEngagementDelta;
  });

  useEffect(() => {
    if (!engagementSubscribe) return;
    const unsub = engagementSubscribe((delta: EngagementDelta) => {
      onSubscribeEngagementDeltaRef.current?.(delta);
      setStatefulPost((prev) => {
        switch (delta.kind) {
          case "like-changed":
            return {
              ...prev,
              likes: delta.count,
              isLiked: delta.liked ?? prev.isLiked,
            };
          case "bookmark-changed":
            return { ...prev, isBookmarked: delta.bookmarked };
          case "comment-count-changed":
            return { ...prev, comments: delta.count };
          case "share-count-changed":
            return { ...prev, shares: delta.count };
          case "view-count-changed":
            return { ...prev, viewCount: delta.count };
          default:
            return prev;
        }
      });
    });
    return unsub;
  }, [engagementSubscribe]);

  // ─── Wrapped handlers (R-Plan-2) — dispatch local mirror first, then fire host's handler ───
  const handleLike = useCallback(
    (id: string, next: boolean) => {
      setStatefulPost((prev) => ({
        ...prev,
        isLiked: next,
        likes: next ? prev.likes + 1 : Math.max(0, prev.likes - 1),
      }));
      onLike?.(id, next);
      // Inline mode: open likers panel on a fresh like (kasder UX).
      if (inlineModeActive && next && openLikersOnLike) {
        setActivePanel("likes");
      }
    },
    [onLike, inlineModeActive, openLikersOnLike],
  );

  const handleBookmark = useCallback(
    (id: string, next: boolean) => {
      setStatefulPost((prev) => ({ ...prev, isBookmarked: next }));
      onBookmark?.(id, next);
    },
    [onBookmark],
  );

  // Under inline mode, comment-icon click toggles the inline comments panel
  // instead of firing the host's onComment.
  const handleComment = useCallback(
    (id: string) => {
      if (inlineModeActive) {
        setActivePanel((prev) => (prev === "comments" ? "none" : "comments"));
      } else {
        onComment?.(id);
      }
    },
    [inlineModeActive, onComment],
  );

  // Under inline mode + shareSuggestions provided, share toggles the share panel
  // instead of firing the host's onShare.
  const handleShare = useCallback(
    (id: string) => {
      if (inlineModeActive && shareSuggestions) {
        setActivePanel((prev) => (prev === "share" ? "none" : "share"));
      } else {
        onShare?.(id);
      }
    },
    [inlineModeActive, shareSuggestions, onShare],
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
  const handleLikeCountClick = useCallback(() => {
    if (!inlineModeActive) return;
    setActivePanel((prev) => (prev === "likes" ? "none" : "likes"));
  }, [inlineModeActive]);

  // ─── Engagement actions array (mirrored post + wrapped handlers) ───
  const engagementActionsArr = useMemo(
    () =>
      engagementActionsSlot
        ? engagementActionsSlot(statefulPost, wrappedHandlers, variant)
        : defaultPostEngagementActions(
            statefulPost,
            wrappedHandlers,
            variant,
            inlineModeActive ? handleLikeCountClick : undefined,
          ),
    [
      engagementActionsSlot,
      statefulPost,
      wrappedHandlers,
      variant,
      inlineModeActive,
      handleLikeCountClick,
    ],
  );

  // ─── Kebab items ───
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
  ]);

  // ─── State + refs ───
  const [kebabOpen, setKebabOpen] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const barRef = useRef<EngagementBar01Handle | null>(null);
  const threadRef = useRef<CommentThread01Handle | null>(null);
  const statefulPostRef = useRef<Post>(statefulPost);
  useEffect(() => {
    statefulPostRef.current = statefulPost;
  });

  const onMediaDoubleTap = useCallback(() => {
    if (!heartBurstWired) return;
    barRef.current?.triggerLike();
    setBurstKey((k) => k + 1);
  }, [heartBurstWired]);

  // C6 — sensitive-media reveal: single handler combining local-state flip
  // + host's onRevealSensitive callback (analytics hook). Used by the gate
  // button in feed + detail variants AND by the imperative handle's
  // revealSensitive() (which does its own flip via the ref pattern in C3).
  const onSensitiveReveal = useCallback(() => {
    setSensitiveRevealed(true);
    onRevealSensitive?.(statefulPostRef.current.id);
  }, [onRevealSensitive]);

  // ─── Imperative handle (R-Plan-3 + v0.2.0 C3 additions) ───
  // Handler refs — useImperativeHandle deps + closure capture pattern. v0.2.0
  // mutation handlers (onEdit / onDelete / onPin / onRevealSensitive / onVotePoll)
  // are accessed via refs so the handle identity doesn't churn on every handler
  // identity change (host typically re-creates them per render).
  const onEditRef = useRef(onEdit);
  const onDeleteRef = useRef(onDelete);
  const onPinRef = useRef(onPin);
  const onRevealSensitiveRef = useRef(onRevealSensitive);
  const onVotePollRef = useRef(onVotePoll);
  useEffect(() => {
    onEditRef.current = onEdit;
    onDeleteRef.current = onDelete;
    onPinRef.current = onPin;
    onRevealSensitiveRef.current = onRevealSensitive;
    onVotePollRef.current = onVotePoll;
  });

  useImperativeHandle(
    ref,
    () => ({
      openKebab: () => setKebabOpen(true),
      triggerLike: () => {
        barRef.current?.triggerLike();
        if (heartBurstWired) setBurstKey((k) => k + 1);
      },
      getCurrentPost: () => statefulPostRef.current,
      reset: (next: Post) => {
        setStatefulPost(next);
        // Clear v0.2.0 local-mirror state — caller's "reset to known state" intent
        // covers the optimistic poll vote + the sensitive-gate reveal.
        setPollVote(null);
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
      votePoll: (optionId: string) => {
        setPollVote({ optionId, votedAt: new Date() });
        onVotePollRef.current?.(statefulPostRef.current.id, optionId);
      },
    }),
    // heartBurstWired re-derives per render; capture via ref if needed.
    // For v0.1 simplicity, identity churns when heartBurstWired changes — acceptable.
    [heartBurstWired],
  );

  const authorId = useId();

  const handleLoadMoreLikers = useCallback(async (): Promise<PostLikeUser[]> => {
    if (!onLoadMoreLikers) return [];
    const next = await onLoadMoreLikers();
    setStatefulLikers((prev) => [...prev, ...next]);
    return next;
  }, [onLoadMoreLikers]);

  // ─── Inline panel node (only built when inline mode + a panel is open) ───
  const inlinePanelNode = useMemo(() => {
    if (!inlineModeActive || activePanel === "none") return null;
    if (activePanel === "likes") {
      return (
        <LikersStrip
          totalCount={statefulPost.likes}
          likers={statefulLikers}
          heading={labels.likersHeading}
          onLoadMore={onLoadMoreLikers ? handleLoadMoreLikers : undefined}
          moreAriaLabelTemplate={labels.likersMoreLabel}
          onClose={() => setActivePanel("none")}
          closeLabel={labels.hidePanelLabel}
        />
      );
    }
    if (activePanel === "share") {
      return (
        <ShareMenu
          users={shareSuggestions ?? []}
          onSearch={onShareSearch}
          onShareTo={(user) => {
            onShareTo?.(statefulPost.id, user);
            setActivePanel("none");
          }}
          heading={labels.shareHeading}
          searchPlaceholder={labels.shareSearchPlaceholder}
          emptyLabel={labels.shareEmptyLabel}
          onClose={() => setActivePanel("none")}
          closeLabel={labels.hidePanelLabel}
        />
      );
    }
    // comments
    return (
      <div
        style={{ maxHeight: inlineCommentsMaxHeight }}
        className="overflow-y-auto"
      >
        <CommentThread01
          ref={threadRef}
          comments={commentThread ?? []}
          currentUser={currentUser}
          pageSize={commentPageSize}
          subscribe={commentSubscribe}
          onSubscribeDelta={onSubscribeCommentDelta}
          onAddComment={onAddComment}
          onLikeComment={onLikeComment}
          onDeleteComment={onDeleteComment}
          onReportComment={onReportComment}
          onLoadMore={onLoadMoreComments}
          commentActions={commentActions}
          labels={labelsProp?.commentLabels}
        />
      </div>
    );
  }, [
    inlineModeActive,
    activePanel,
    statefulPost.id,
    statefulPost.likes,
    statefulLikers,
    labels,
    onLoadMoreLikers,
    handleLoadMoreLikers,
    shareSuggestions,
    onShareSearch,
    onShareTo,
    inlineCommentsMaxHeight,
    commentThread,
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
    labelsProp?.commentLabels,
  ]);

  // ─── Common props bundle ───
  const baseProps = {
    post: statefulPost,
    currentUser,
    authorId,
    formattedTime,
    kebabOpen,
    onKebabOpenChange: setKebabOpen,
    kebabItems,
    engagementActions: engagementActionsArr,
    engagementBarRef: barRef,
    engagementClassName,
    engagementLabels: labelsProp?.engagementLabels,
    engagementSubscribeNoop: undefined,
    bodyMaxLines: resolvedBodyMaxLines,
    bodyClassName,
    headingAs: resolvedHeadingAs,
    labels,
    burstKey,
    heartBurstWired,
    onMediaDoubleTap: heartBurstWired ? onMediaDoubleTap : undefined,
    cardLinkable,
    linkHref,
    inlinePanelNode,
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
          commentThread={commentThread ?? []}
          commentPageSize={commentPageSize}
          commentSubscribe={commentSubscribe}
          onSubscribeCommentDelta={onSubscribeCommentDelta}
          onAddComment={onAddComment}
          onLikeComment={onLikeComment}
          onDeleteComment={onDeleteComment}
          onReportComment={onReportComment}
          onLoadMoreComments={onLoadMoreComments}
          commentActions={commentActions}
          renderCommentSection={renderCommentSection}
          commentLabels={labelsProp?.commentLabels}
          threadRef={threadRef}
          commentSectionClassName={commentSectionClassName}
          commentsHeading={labels.commentsHeading}
        />
      );
  }
}

const PostCard01 = memo(PostCard01Inner);
PostCard01.displayName = "PostCard01";

export { PostCard01 };
