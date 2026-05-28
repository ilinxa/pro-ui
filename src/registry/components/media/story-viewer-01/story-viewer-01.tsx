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
import { ViewerShell } from "./parts/viewer-shell";
import { ProgressBars } from "./parts/progress-bars";
import { ViewerHeader } from "./parts/viewer-header";
import { TapZones } from "./parts/tap-zones";
import { NavArrows } from "./parts/nav-arrows";
import { ItemView } from "./parts/item-view";
import { EngagementOverlay } from "./parts/engagement-overlay";
import { ReplyComposer } from "./parts/reply-composer";
import { OwnerOverlay } from "./parts/owner-overlay";
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
      // v0.2.0 additions — stubbed no-ops in C1 (types-only commit). Real
      // implementations wire in C3 (triggerLike/triggerReaction/triggerShare
      // via engagement-overlay ref), C4 (triggerReply via composer ref + focus),
      // C6 (openKebab via kebab open state), and C10 (setMuted via setMuted setter).
      setMuted: (muted: boolean) => setMuted(muted),
      triggerLike: () => {},
      triggerReaction: (_kind?: string) => {},
      triggerReply: (content?: string) => {
        composerRef.current?.focus();
        if (content) {
          // CommentComposerHandle exposes focus; setValue not in v0.2.1.
          // Future enhancement: extend Handle with setValue method.
        }
      },
      triggerShare: () => {},
      openKebab: () => {},
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
  useStoryKeyboardNav({
    isOpen,
    onPrevItem: goToPrevItem,
    onNextItem: goToNextItem,
    onTogglePause: () => setPaused((p) => !p),
  });

  // ─── v0.2.0 engagement state (per-item like / reaction / reply counts) ──
  const { getState: getEngagementState, dispatch: dispatchEngagement } =
    useStoryEngagementState({
      subscribe: engagementSubscribe,
      onSubscribeDelta: onSubscribeEngagementDelta,
    });

  // ─── v0.2.0 reply composer ref (for focus + triggerReply handle method) ──
  const composerRef = useRef<CommentComposerHandle | null>(null);

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
      <NavArrows
        canPrev={cursor.storyIndex > 0}
        onPrev={goToPrevStory}
        onNext={goToNextStory}
        labels={labels}
      />

      <div className={cn("relative h-full w-full bg-black", className)}>
        <ProgressBars
          items={currentStory.items}
          currentItemIndex={cursor.itemIndex}
          progress={progress}
        />
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
        />
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
        <TapZones
          onPrev={goToPrevItem}
          onTogglePause={() => setPaused((p) => !p)}
          onNext={goToNextItem}
        />

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
      </div>
    </ViewerShell>
  );
}

const StoryViewer01 = memo(StoryViewer01Inner);
StoryViewer01.displayName = "StoryViewer01";

export { StoryViewer01 };
