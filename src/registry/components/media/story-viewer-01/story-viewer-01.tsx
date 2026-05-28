"use client";

import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_STORY_VIEWER_LABELS,
  type StoryViewer01Handle,
  type StoryViewer01Labels,
  type StoryViewer01Props,
} from "./types";
import { useStoryViewerState } from "./hooks/use-story-viewer-state";
import { useStoryProgress } from "./hooks/use-story-progress";
import { useStoryKeyboardNav } from "./hooks/use-story-keyboard-nav";
import { useStoryEngagementState } from "./hooks/use-story-engagement-state";
import { useLongPressPause } from "./hooks/use-long-press-pause";
import { ViewerShell } from "./parts/viewer-shell";
import { ProgressBars } from "./parts/progress-bars";
import { ViewerHeader } from "./parts/viewer-header";
import { TapZones } from "./parts/tap-zones";
import { NavArrows } from "./parts/nav-arrows";
import { ItemView } from "./parts/item-view";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EngagementOverlay } from "./parts/engagement-overlay";
import { ReplyComposer } from "./parts/reply-composer";
import { OwnerOverlay } from "./parts/owner-overlay";
import { KebabPanel } from "./parts/kebab-panel";
import { LinkCta } from "./parts/link-cta";
import { defaultStoryKebabActions } from "./lib/kebab";
import { buildStoryEngagementActionsWithMatrix } from "./lib/engagement-actions";
import type { CommentComposerHandle } from "@/registry/components/data/comment-thread-01/parts/comment-composer";

interface StoryViewer01InnerProps extends StoryViewer01Props {
  ref?: React.Ref<StoryViewer01Handle>;
}

function StoryViewer01Inner(props: StoryViewer01InnerProps) {
  const {
    stories: initialStories,
    initialStoryIndex,
    isOpen,
    onClose,
    ref,
    subscribe,
    onSubscribeDelta,
    onStoryViewed,
    onItemViewed,
    onCursorChange,
    onAutoCloseAtEnd,
    renderItem,
    defaultItemDuration = 5,
    labels: labelsProp,
    className,
    contentClassName,
    // v0.2.0 — engagement layer inputs (all optional; gated on viewerMode + !disableEngagement)
    viewerMode,
    permissions,
    canPerformAction,
    engagementSubscribe,
    onSubscribeEngagementDelta,
    onLikeStory,
    onReactStory,
    onShareStory,
    onBookmarkStory,
    reactionKinds,
    disableEngagement = false,
    renderEngagementOverlay,
    // v0.2.0 — reply composer inputs (C4)
    currentUser,
    onAddReply,
    composerEmptyState,
    disableReplyComposer = false,
    renderReplyComposer,
    // v0.2.0 — owner overlay inputs (C5)
    onLoadViewers,
    disableOwnerOverlay = false,
    renderOwnerOverlay,
    // v0.2.0 — kebab inputs (C6)
    kebabActions,
    moderatorActions,
    // v0.2.0 — render slots for the 4 default parts (C7)
    renderHeader,
    renderProgress,
    renderNavArrows,
    renderTapZones,
    // v0.2.0 — remaining disable opt-outs (C8); 3 already pulled above
    disableTapZones = false,
    disableKeyboardNav = false,
    disableNavArrows = false,
    disableAutoClose = false,
    disableProgressBars = false,
    // v0.2.0 — long-press pause + link CTA (C9)
    longPressThresholdMs,
    linkComponent,
    onLinkClick,
    // v0.2.2 — author tap-target
    onAuthorClick,
    authorComponent,
    // v0.2.0 — kebab item handlers (mirrors post-card-01 v0.2.0; flattened
    // on Props rather than a discrete StoryMutationHandlers interface). All
    // optional; gated by the permissions matrix in defaultStoryKebabActions.
    onSaveToHighlights,
    onDeleteStory,
    onShareToFeed,
    onReport,
    onBlockAuthor,
    onMuteAuthor,
    onCopyLink,
    isSavedToHighlights,
  } = props;

  // v0.2.0 labels shape: required for all keys EXCEPT the nested forwards
  // (engagementLabels + commentLabels) which stay optional — hosts opt-in.
  const labels = useMemo<
    Required<Omit<StoryViewer01Labels, "engagementLabels" | "commentLabels">> &
      Pick<StoryViewer01Labels, "engagementLabels" | "commentLabels">
  >(
    () => ({ ...DEFAULT_STORY_VIEWER_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const {
    stories,
    cursor,
    isPaused,
    isMuted,
    setPaused,
    setMuted,
    goToPrevItem,
    goToNextItem,
    goToPrevStory,
    goToNextStory,
    goToStoryIndex,
    goToItemIndex,
    reset,
    dispatch,
  } = useStoryViewerState({
    initialStories,
    initialStoryIndex,
    isOpen,
    subscribe,
    onSubscribeDelta,
    onStoryViewed,
    onItemViewed,
    onCursorChange,
    onAutoCloseAtEnd,
    onClose,
    disableAutoClose,
  });

  const currentStory = stories[cursor.storyIndex];
  const currentItem = currentStory?.items[cursor.itemIndex];

  // Imperative handle.
  const storiesRef = useRef(stories);
  const cursorRef = useRef(cursor);
  useEffect(() => {
    storiesRef.current = stories;
    cursorRef.current = cursor;
  });
  // Forward-ref-stable handlers for the v0.2.0 trigger* handle methods.
  // The methods need to read the CURRENT story/item/engagement state at call
  // time (not the closure snapshot from when the handle was first created),
  // so we mirror them through refs to keep the handle's identity stable.
  const triggerLikeRef = useRef<() => void>(() => {});
  const triggerReactionRef = useRef<(kind?: string) => void>(() => {});
  const triggerShareRef = useRef<() => void>(() => {});

  useImperativeHandle(
    ref,
    () => ({
      // v0.1 (preserved)
      goToStory: goToStoryIndex,
      goToItem: goToItemIndex,
      setPaused: (paused: boolean) => setPaused(paused),
      getCursor: () => ({
        storyIndex: cursorRef.current.storyIndex,
        itemIndex: cursorRef.current.itemIndex,
      }),
      getCurrentStories: () => storiesRef.current,
      reset,
      dispatch,
      // v0.2.0 additions — wired through refs so the handle stays stable
      // while the underlying handlers re-resolve on every render against
      // the latest cursor + engagement state.
      setMuted: (muted: boolean) => setMuted(muted),
      triggerLike: () => triggerLikeRef.current(),
      triggerReaction: (kind?: string) => triggerReactionRef.current(kind),
      triggerReply: (content?: string) => {
        composerRef.current?.focus();
        if (content) {
          // CommentComposerHandle exposes focus; setValue not in v0.2.1.
          // Future enhancement: extend Handle with setValue method.
        }
      },
      triggerShare: () => triggerShareRef.current(),
      openKebab: () => setKebabOpen(true),
    }),
    [goToStoryIndex, goToItemIndex, setPaused, setMuted, reset, dispatch],
  );

  // Per-item video metadata duration cache.
  const [videoMetadataMs, setVideoMetadataMs] = useState<Record<string, number>>({});
  const handleVideoMetadata = useCallback(
    (duration: number) => {
      if (!currentItem) return;
      if (!Number.isFinite(duration) || duration <= 0) return;
      setVideoMetadataMs((prev) => {
        if (prev[currentItem.id] != null) return prev;
        return { ...prev, [currentItem.id]: duration * 1000 };
      });
    },
    [currentItem],
  );

  // Resolve item duration (R-Plan-4): explicit → video metadata → default.
  const itemDurationMs = useMemo(() => {
    if (!currentItem) return defaultItemDuration * 1000;
    if (currentItem.duration != null) return currentItem.duration * 1000;
    if (currentItem.type === "video") {
      const meta = videoMetadataMs[currentItem.id];
      if (meta != null) return meta;
    }
    return defaultItemDuration * 1000;
  }, [currentItem, videoMetadataMs, defaultItemDuration]);

  const itemKey = currentStory && currentItem
    ? `${currentStory.id}:${currentItem.id}`
    : "";

  const progress = useStoryProgress({
    isOpen: isOpen && !!currentItem,
    isPaused,
    itemKey,
    itemDurationMs,
    onComplete: goToNextItem,
  });

  // Keyboard nav (Escape funnels through Radix → onOpenChange).
  // v0.2.0 — `enabled` gates the listener entirely per `disableKeyboardNav`.
  useStoryKeyboardNav({
    isOpen,
    enabled: !disableKeyboardNav,
    onPrevItem: goToPrevItem,
    onNextItem: goToNextItem,
    onTogglePause: () => setPaused((p) => !p),
  });

  // v0.2.0 C9 — long-press pause (Instagram-canonical mobile gesture).
  // Additive to v0.1 middle-tap pause; both coexist (Q-V8 lock).
  const longPress = useLongPressPause({
    isOpen,
    longPressThresholdMs,
    onPause: () => setPaused(true),
    onResume: () => setPaused(false),
  });

  // ─── v0.2.0 engagement state (per-item like / reaction / reply counts) ──
  const { getState: getEngagementState, dispatch: dispatchEngagement } =
    useStoryEngagementState({
      subscribe: engagementSubscribe,
      onSubscribeDelta: onSubscribeEngagementDelta,
    });

  // ─── v0.2.0 reply composer ref (for focus + triggerReply handle method) ──
  const composerRef = useRef<CommentComposerHandle | null>(null);

  // ─── v0.2.0 kebab state (C6) — shared between engagement-overlay placement + header fallback ──
  const [kebabOpen, setKebabOpen] = useState(false);
  // Close kebab on cursor change (so it doesn't persist across story navigation).
  useEffect(() => {
    setKebabOpen(false);
  }, [cursor.storyIndex, cursor.itemIndex]);

  // Resolved kebab items — kebabActions full-takeover wins; otherwise
  // defaultStoryKebabActions assembles per permissions matrix + moderator section.
  const kebabItems = useMemo(() => {
    if (!currentStory || !currentItem) return [];
    if (kebabActions) return kebabActions(currentStory, currentItem);
    return defaultStoryKebabActions({
      story: currentStory,
      item: currentItem,
      handlers: {
        onSaveToHighlights,
        onDeleteStory,
        onShareToFeed,
        onReport,
        onBlockAuthor,
        onMuteAuthor,
        onCopyLink,
        isSavedToHighlights,
      },
      labels: {
        saveToHighlights: labels.saveToHighlights,
        unsaveFromHighlights: labels.unsaveFromHighlights,
        deleteStory: labels.deleteStory,
        shareToFeed: labels.shareToFeed,
        report: labels.report,
        blockAuthor: labels.blockAuthor,
        muteAuthor: labels.muteAuthor,
        copyLink: labels.copyLink,
      },
      viewerMode,
      permissions,
      canPerformAction,
      moderatorActions,
    });
  }, [
    currentStory,
    currentItem,
    kebabActions,
    onSaveToHighlights,
    onDeleteStory,
    onShareToFeed,
    onReport,
    onBlockAuthor,
    onMuteAuthor,
    onCopyLink,
    isSavedToHighlights,
    labels,
    viewerMode,
    permissions,
    canPerformAction,
    moderatorActions,
  ]);

  // Resolved engagement actions for the current item (rebuilt per cursor change)
  const engagementOverlayMounted =
    !!viewerMode && viewerMode === "viewer" && !disableEngagement && !!currentStory && !!currentItem;
  // Reply composer mount gate — viewer mode + opt-in + story/item present.
  // currentUser absent is HANDLED INSIDE the render (composerEmptyState fallback).
  const replyComposerMounted =
    !!viewerMode && viewerMode === "viewer" && !disableReplyComposer && !!currentStory && !!currentItem;
  // Owner overlay mount gate — owner mode + opt-in + story/item present.
  // Mutually exclusive with replyComposerMounted (owner vs viewer modes).
  const ownerOverlayMounted =
    !!viewerMode && viewerMode === "owner" && !disableOwnerOverlay && !!currentStory && !!currentItem;
  // Slot helpers — passed to every renderXxx slot.
  const slotHelpers = useMemo(
    () => ({
      cursor,
      isPaused,
      isMuted,
      setPaused: (p: boolean) => setPaused(p),
      setMuted: (m: boolean) => setMuted(m),
      goToPrevItem,
      goToNextItem,
      goToPrevStory,
      goToNextStory,
      onClose,
      labels,
    }),
    [
      cursor,
      isPaused,
      isMuted,
      setPaused,
      setMuted,
      goToPrevItem,
      goToNextItem,
      goToPrevStory,
      goToNextStory,
      onClose,
      labels,
    ],
  );
  const engagementActions = useMemo(() => {
    if (!engagementOverlayMounted) return [];
    const state = getEngagementState(currentStory!.id, currentItem!.id);
    return buildStoryEngagementActionsWithMatrix({
      story: currentStory!,
      item: currentItem!,
      state,
      viewerMode,
      permissions,
      canPerformAction,
      reactionKinds,
      onLikeToggle: (next: boolean) => {
        dispatchEngagement({
          kind: "like-toggle",
          storyId: currentStory!.id,
          itemId: currentItem!.id,
          nextLiked: next,
        });
        onLikeStory?.(currentStory!.id, currentItem!.id, next);
      },
      onReactSelect: (kind: string | null) => {
        dispatchEngagement({
          kind: "reaction-select",
          storyId: currentStory!.id,
          itemId: currentItem!.id,
          reactionKind: kind,
        });
        onReactStory?.(currentStory!.id, currentItem!.id, kind);
      },
      onCommentClick: () => {
        composerRef.current?.focus();
      },
      onKebabOpen: () => setKebabOpen(true),
      kebabIcon: <MoreVertical className="h-5 w-5" />,
      kebabLabel: labels.kebabAriaLabel,
      onShareClick: () => {
        onShareStory?.(currentStory!.id, currentItem!.id);
      },
      onBookmarkToggle: (next: boolean) => {
        onBookmarkStory?.(currentStory!.id, currentItem!.id, next);
      },
      // Kebab wired in C6
    });
  }, [
    engagementOverlayMounted,
    currentStory,
    currentItem,
    getEngagementState,
    viewerMode,
    permissions,
    canPerformAction,
    reactionKinds,
    dispatchEngagement,
    onLikeStory,
    onReactStory,
    onShareStory,
    onBookmarkStory,
  ]);

  // v0.2.0 — wire trigger* refs to live handlers each render. These bypass
  // the permissions matrix (the matrix gates UI affordances; the handle is
  // the programmatic escape hatch). No-op when no story/item is current.
  useEffect(() => {
    triggerLikeRef.current = () => {
      if (!currentStory || !currentItem) return;
      const state = getEngagementState(currentStory.id, currentItem.id);
      const nextLiked = !state.liked;
      dispatchEngagement({
        kind: "like-toggle",
        storyId: currentStory.id,
        itemId: currentItem.id,
        nextLiked,
      });
      onLikeStory?.(currentStory.id, currentItem.id, nextLiked);
    };
    triggerReactionRef.current = (kind?: string) => {
      if (!currentStory || !currentItem) return;
      const nextKind = kind ?? null;
      dispatchEngagement({
        kind: "reaction-select",
        storyId: currentStory.id,
        itemId: currentItem.id,
        reactionKind: nextKind,
      });
      onReactStory?.(currentStory.id, currentItem.id, nextKind);
    };
    triggerShareRef.current = () => {
      if (!currentStory || !currentItem) return;
      onShareStory?.(currentStory.id, currentItem.id);
    };
  });

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  if (!currentStory || !currentItem) {
    // Render the shell so closing animations still fire when stories empty mid-view.
    return (
      <ViewerShell
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        ariaLabel={labels.viewerLabel}
        className={contentClassName}
      >
        <span />
      </ViewerShell>
    );
  }

  return (
    <ViewerShell
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      ariaLabel={labels.viewerLabel}
      className={contentClassName}
    >
      {/* v0.2.0 C7 — renderNavArrows slot wins as full takeover.
          v0.2.0 C8 — `disableNavArrows` suppresses the default mount entirely. */}
      {renderNavArrows ? (
        renderNavArrows(slotHelpers)
      ) : !disableNavArrows ? (
        <NavArrows
          canPrev={cursor.storyIndex > 0}
          onPrev={goToPrevStory}
          onNext={goToNextStory}
          labels={labels}
        />
      ) : null}

      <div
        className={cn("relative h-full w-full bg-black", className)}
        onPointerDown={longPress.handlePointerDown}
        onPointerUp={longPress.handlePointerUp}
        onPointerCancel={longPress.handlePointerCancel}
      >
        {/* v0.2.0 C7 — renderProgress slot wins as full takeover.
            v0.2.0 C8 — `disableProgressBars` suppresses the default mount;
            timer still runs (drives auto-advance). */}
        {renderProgress ? (
          renderProgress(currentStory.items, cursor.itemIndex, progress, slotHelpers)
        ) : !disableProgressBars ? (
          <ProgressBars
            items={currentStory.items}
            currentItemIndex={cursor.itemIndex}
            progress={progress}
          />
        ) : null}
        {/* v0.2.0 C7 — renderHeader slot wins as full takeover. */}
        {renderHeader ? (
          renderHeader(currentStory, currentItem, slotHelpers)
        ) : (
          <ViewerHeader
            story={currentStory}
            item={currentItem}
            isPaused={isPaused}
            isMuted={isMuted}
            onTogglePause={() => setPaused((p) => !p)}
            onToggleMute={() => setMuted((m) => !m)}
            onClose={onClose}
            formatTime={labels.formatTime}
            labels={labels}
            onAuthorClick={onAuthorClick}
            authorComponent={authorComponent}
          />
        )}
        <ItemView
          item={currentItem}
          story={currentStory}
          totalItems={currentStory.items.length}
          cursor={cursor}
          isPaused={isPaused}
          isMuted={isMuted}
          onLoadedMetadata={handleVideoMetadata}
          onEnded={goToNextItem}
          renderItem={renderItem}
          labels={labels}
        />
        {/* v0.2.0 C7 — renderTapZones slot wins as full takeover.
            v0.2.0 C8 — `disableTapZones` suppresses the default mount entirely. */}
        {renderTapZones ? (
          renderTapZones(slotHelpers)
        ) : !disableTapZones ? (
          <TapZones
            onPrev={goToPrevItem}
            onTogglePause={() => setPaused((p) => !p)}
            onNext={goToNextItem}
          />
        ) : null}

        {/* v0.2.0 C9 — StoryItem.link CTA bottom button. Coexists with the
            engagement overlay (sits above it) and the reply composer (sits
            below it in viewer mode). Polymorphic root via `linkComponent`. */}
        {currentItem.link ? (
          <LinkCta
            story={currentStory}
            item={currentItem}
            linkComponent={linkComponent}
            onLinkClick={onLinkClick}
            labels={labels}
          />
        ) : null}

        {/* v0.2.0 — engagement overlay (TikTok/Reels-style stacked right edge).
            Renders only when viewerMode="viewer" + !disableEngagement.
            renderEngagementOverlay slot wins as full takeover. */}
        {engagementOverlayMounted ? (
          renderEngagementOverlay ? (
            renderEngagementOverlay(currentStory!, currentItem!, slotHelpers)
          ) : (
            <EngagementOverlay
              story={currentStory!}
              item={currentItem!}
              actions={engagementActions}
              labels={labels}
            />
          )
        ) : null}

        {/* v0.2.0 — reply composer at bottom (Q-V1 lock — always-visible).
            Renders only when viewerMode="viewer" + !disableReplyComposer.
            currentUser absent → null + composerEmptyState rendered instead.
            renderReplyComposer slot wins as full takeover. */}
        {replyComposerMounted ? (
          renderReplyComposer ? (
            renderReplyComposer(currentStory!, currentItem!, slotHelpers)
          ) : currentUser ? (
            <ReplyComposer
              story={currentStory!}
              item={currentItem!}
              currentUser={currentUser}
              onAddReply={onAddReply}
              onSetPaused={(p) => setPaused(p)}
              labels={labels}
              composerRef={composerRef}
            />
          ) : (
            composerEmptyState
          )
        ) : null}

        {/* v0.2.0 — owner overlay (view-count + lazy viewers list).
            Renders only when viewerMode="owner" + !disableOwnerOverlay.
            Mutually exclusive with reply composer (owner vs viewer modes).
            renderOwnerOverlay slot wins as full takeover. */}
        {ownerOverlayMounted ? (
          renderOwnerOverlay ? (
            renderOwnerOverlay(currentStory!, currentItem!, slotHelpers)
          ) : (
            <OwnerOverlay
              story={currentStory!}
              item={currentItem!}
              onLoadViewers={onLoadViewers}
              labels={labels}
            />
          )
        ) : null}

        {/* v0.2.0 — header fallback kebab button (when disableEngagement OR
            no viewerMode set with kebab items present). Rendered as plain
            button to avoid F-cross-13 DropdownMenuTrigger trap. */}
        {viewerMode && disableEngagement && kebabItems.length > 0 ? (
          <div className="absolute right-16 top-4 z-25 md:right-20">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 md:h-9 md:w-9 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setKebabOpen(true)}
              aria-label={labels.kebabAriaLabel}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        ) : null}

        {/* v0.2.0 — kebab bottom-sheet panel (shared by engagement-overlay
            kebab + header fallback). Rendered only when kebabOpen + items
            non-empty. */}
        <KebabPanel
          open={kebabOpen}
          items={kebabItems}
          onClose={() => setKebabOpen(false)}
          labels={labels}
        />
      </div>
    </ViewerShell>
  );
}

const StoryViewer01 = memo(StoryViewer01Inner);
StoryViewer01.displayName = "StoryViewer01";

export { StoryViewer01 };
