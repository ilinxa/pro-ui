"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_STORY_VIEWER_LABELS,
  type Story,
  type StoryItem,
  type StoryViewerHandle,
  type StoryViewerLabels,
  type StoryViewerProps,
} from "./types";
import {
  findAdjacentStoryIndex,
  useStoryViewerState,
} from "./hooks/use-story-viewer-state";
import { createProgressStore } from "./lib/progress-store";
import { useStoryMedia } from "./hooks/use-story-media";
import { useStoryKeyboardNav } from "./hooks/use-story-keyboard-nav";
import { useReducedMotion } from "./hooks/use-reduced-motion";
import { isRtlElement } from "./lib/direction";
import { formatRelativeTime } from "./lib/relative-time";
import { useStoryEngagementState } from "./hooks/use-story-engagement-state";
import { useLongPressPause } from "./hooks/use-long-press-pause";
import {
  useCubeTransition,
  type CubeDirection,
} from "./hooks/use-cube-transition";
import { ViewerShell } from "./parts/viewer-shell";
import { wrapTabWithinLayer } from "./lib/focus-wrap";
import {
  LiveProgressBars,
  LiveProgressSlot,
  ProgressDriver,
} from "./parts/progress-bars";
import { ViewerHeader } from "./parts/viewer-header";
import { TapZones } from "./parts/tap-zones";
import { NavArrows } from "./parts/nav-arrows";
import { SrNav } from "./parts/sr-nav";
import { Caption } from "./parts/caption";
import { ItemView } from "./parts/item-view";
import { AmbientBackdrop } from "./parts/ambient-backdrop";
import { UnavailableNotice } from "./parts/unavailable-notice";
// v0.3.7: Heart icon is rendered inline in the DM bar row.
import { Heart } from "lucide-react";
import { EngagementOverlay } from "./parts/engagement-overlay";
import { ReplyComposer } from "./parts/reply-composer";
import { OwnerOverlay } from "./parts/owner-overlay";
import { KebabPanel } from "./parts/kebab-panel";
import { LinkCta } from "./parts/link-cta";
import { CommentsPanel } from "./parts/comments-panel";
import { SharePanel } from "./parts/share-panel";
import { StoryCubeFace } from "./parts/story-cube-face";
import { defaultStoryKebabActions, visibleKebabItems } from "./lib/kebab";
import { buildStoryEngagementActionsWithMatrix } from "./lib/engagement-actions";
import type { CommentComposerHandle } from "@/registry/components/data/comment-thread/parts/comment-composer";

/**
 * SV9 — pointers that start on these never begin a swipe or a long press: form
 * controls, an explicit `data-no-swipe` opt-out, and any open layer.
 */
const GESTURE_EXEMPT =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-no-swipe], [data-story-layer]';
const GESTURE_CONTROL = 'button, a[href], [role="button"], [role="link"], [role="menuitem"]';
function isGestureExempt(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest(GESTURE_EXEMPT)) return true;
  // Other buttons / links swallow the gesture; the tap zones are buttons too but
  // keep long-press and swipe working (they are the gesture surface).
  const control = target.closest(GESTURE_CONTROL);
  return !!control && !control.hasAttribute("data-story-tapzone");
}

type LayerId = "comments" | "share" | "kebab" | "viewers" | "link" | "reactionPicker";

interface StoryViewerInnerProps extends StoryViewerProps {
  ref?: React.Ref<StoryViewerHandle>;
}

function StoryViewerInner(props: StoryViewerInnerProps) {
  const {
    stories: initialStories,
    initialStoryIndex,
    initialItemIndex,
    isOpen,
    onClose,
    returnFocusTo,
    onItemReady,
    extraKebabActions,
    storySwipe,
    ref,
    subscribe,
    onSubscribeDelta,
    onStoryViewed,
    onItemViewed,
    onCursorChange,
    onAutoCloseAtEnd,
    // 0.6.0 — controlled stories, removal notice, pause reasons
    onStoriesChange,
    onItemUnavailable,
    unavailableNoticeMs,
    standalone,
    pauseReasons: pauseReasonsProp,
    onPauseReasonsChange,
    // 0.6.0 — media pipeline
    resolveMedia,
    onMediaError,
    loadTimeoutMs,
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
    renderHeaderBadge,
    locale,
    navArrowsPlacement = "inside",
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
    // v0.3.0 — comments panel
    renderCommentsPanel,
    disableComments = false,
    // v0.3.1 — share panel
    renderSharePanel,
    disableSharePanel = false,
    // v0.4.0 — Instagram-canonical 3D cube transition between stories
    disableStoryTransition = false,
    storyTransitionDurationMs = 400,
    // 0.7.0 — desktop backdrop + next-item preload
    backdrop,
    renderBackdrop,
    preloadNext = true,
    // v0.2.0 — kebab item handlers (mirrors post-card v0.2.0; flattened
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
    Required<Omit<StoryViewerLabels, "engagementLabels" | "commentLabels">> &
      Pick<StoryViewerLabels, "engagementLabels" | "commentLabels">
  >(
    () => ({
      ...DEFAULT_STORY_VIEWER_LABELS,
      ...labelsProp,
      // 0.6.0 (SV12): the default time is relative, in `locale`; `labels.formatTime` wins.
      formatTime:
        labelsProp?.formatTime ?? ((date: Date) => formatRelativeTime(date, locale)),
    }),
    [labelsProp, locale],
  );
  // 0.6.0 (SV13) - prefers-reduced-motion: no cube, no panel scale.
  const reducedMotion = useReducedMotion();
  // 0.7.0 (A5): the swipe defaults to on unless the cube is off; with the cube off (or under
  // reduced motion) a swipe is a hard cut - no preview, no neighbour media mounted.
  const swipeEnabled = storySwipe ?? !disableStoryTransition;
  const swipeHardCut = reducedMotion || disableStoryTransition;

  // An unavailable item is never "viewed": moving on from it (notice timer, `unavailableNoticeMs=0`,
  // or the user skipping it) fires no `onItemViewed`, neither "completed" nor "left".
  const unavailableItemRef = useRef("");
  const onItemViewedProp = onItemViewed;
  const guardedItemViewed = useCallback<NonNullable<typeof onItemViewed>>(
    (storyId, itemId, itemIndex, cause, info) => {
      if (unavailableItemRef.current === `${storyId}:${itemId}`) return;
      onItemViewedProp?.(storyId, itemId, itemIndex, cause, info);
    },
    [onItemViewedProp],
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
    snapCount,
    addPauseReason,
    removePauseReason,
    pauseReasons: activePauseReasons,
    pendingRemoval,
  } = useStoryViewerState({
    initialStories,
    initialStoryIndex,
    initialItemIndex,
    isOpen,
    subscribe,
    onSubscribeDelta,
    onStoryViewed,
    onItemViewed: onItemViewed ? guardedItemViewed : undefined,
    onCursorChange,
    onAutoCloseAtEnd,
    onClose,
    disableAutoClose,
    onStoriesChange,
    onItemUnavailable,
    unavailableNoticeMs,
    standalone,
    pauseReasons: pauseReasonsProp,
    onPauseReasonsChange,
  });

  // While a removal notice is held the removed item is gone from `stories`: the
  // frame shows the last known story / item snapshot, and never plays.
  const currentStory = pendingRemoval
    ? pendingRemoval.story
    : stories[cursor.storyIndex];
  const currentItem = pendingRemoval
    ? pendingRemoval.item
    : currentStory?.items[cursor.itemIndex];

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
  // ─── v0.2.0 reply composer ref (for focus + triggerReply handle method) ──
  // Declared BEFORE the imperative handle: the handle's triggerReply /
  // openKebab closures reference composerRef + setKebabOpen, and declaring
  // them after the handle trips the React Compiler
  // "cannot access variable before it is declared" check.
  const composerRef = useRef<CommentComposerHandle | null>(null);
  // triggerReply(content) → pre-fill request consumed by <ReplyComposer>.
  const [replyPrefill, setReplyPrefill] = useState<{
    nonce: number;
    text: string;
  } | null>(null);
  // ─── v0.2.0 kebab state (C6) — shared between engagement-overlay placement + header fallback ──
  const [kebabOpen, setKebabOpen] = useState(false);
  // 0.7.0 - `handle.invalidateMedia` forwards to the media pipeline (declared further down).
  const invalidateMediaRef = useRef<(itemId?: string, storyId?: string) => void>(() => {});

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
        if (content) {
          setReplyPrefill((prev) => ({ nonce: (prev?.nonce ?? 0) + 1, text: content }));
        }
        composerRef.current?.focus();
      },
      triggerShare: () => triggerShareRef.current(),
      openKebab: () => setKebabOpen(true),
      invalidateMedia: (itemId?: string, storyId?: string) =>
        invalidateMediaRef.current(itemId, storyId),
    }),
    [goToStoryIndex, goToItemIndex, setPaused, setMuted, reset, dispatch],
  );

  // Per-item video metadata duration cache.
  // 0.7.0 - keyed `${storyId}:${itemId}` (stories may reuse item ids) and cleared on close.
  const itemKey = currentStory && currentItem
    ? `${currentStory.id}:${currentItem.id}`
    : "";
  const [videoMetadataMs, setVideoMetadataMs] = useState<Record<string, number>>({});
  const [metaOpen, setMetaOpen] = useState(isOpen);
  if (metaOpen !== isOpen) {
    setMetaOpen(isOpen);
    if (!isOpen) setVideoMetadataMs({});
  }
  const handleVideoMetadata = useCallback(
    (duration: number) => {
      if (!itemKey) return;
      if (!Number.isFinite(duration) || duration <= 0) return;
      setVideoMetadataMs((prev) => {
        if (prev[itemKey] != null) return prev;
        return { ...prev, [itemKey]: duration * 1000 };
      });
    },
    [itemKey],
  );

  // Resolve item duration (R-Plan-4): explicit → video metadata → default.
  const itemDurationMs = useMemo(() => {
    if (!currentItem) return defaultItemDuration * 1000;
    if (currentItem.duration != null) return currentItem.duration * 1000;
    if (currentItem.type === "video") {
      const meta = videoMetadataMs[itemKey];
      if (meta != null) return meta;
    }
    return defaultItemDuration * 1000;
  }, [currentItem, itemKey, videoMetadataMs, defaultItemDuration]);

  // ─── 0.5.4 ready gate + media-time progress + single advance ────────────
  // ─── 0.6.0 media pipeline: lazy URLs, one-shot retry, unavailable path ───
  const media = useStoryMedia({
    isOpen,
    stories,
    cursor,
    currentStory,
    currentItem,
    itemKey,
    held: !!pendingRemoval,
    resolveMedia,
    hasCustomFrame: !!renderItem,
    onMediaError,
    onItemUnavailable,
    unavailableNoticeMs,
    standalone,
    pauseReasons: activePauseReasons,
    addPauseReason,
    removePauseReason,
    goToNextItem,
    preloadNext,
  });
  useEffect(() => {
    invalidateMediaRef.current = media.invalidateMedia;
  }, [media.invalidateMedia]);

  // 0.6.2 - Play / Space / middle tap. While a notice (unavailable media or a removed item) is the
  // only thing holding the viewer, "play" ends the notice early (the same advance as its timer);
  // otherwise it toggles the user pause as before.
  const noticeOnly =
    (!!pendingRemoval || !!media.unavailable) &&
    activePauseReasons.every((r) => r === "unavailable");
  const noticeStays = pendingRemoval ? pendingRemoval.stayUntilClosed : media.stayUntilClosed;
  // 0.7.0 (A9): a notice that stays until the viewer closes has nothing to play - no pause
  // toggle at all (middle tap, Space, header), whatever else holds the viewer.
  const stayNoticeShown =
    pendingRemoval ? pendingRemoval.stayUntilClosed : !!media.unavailable && media.stayUntilClosed;
  const togglePause = useCallback(() => {
    if (stayNoticeShown) return;
    if (noticeOnly) {
      if (!noticeStays) goToNextItem("left");
      return;
    }
    setPaused((p) => !p);
  }, [stayNoticeShown, noticeOnly, noticeStays, goToNextItem, setPaused]);
  const {
    reportFailure: reportMediaFailure,
    markUnavailable: markMediaUnavailable,
    srcFor: mediaSrcFor,
  } = media;

  // Ready: the current item can start counting (image loaded / failed / cached,
  // video started or failed, custom `renderItem` frame). Keyed by itemKey so it
  // resets per item without an effect.
  const [readyKey, setReadyKey] = useState("");
  // Items whose video can't be media-driven (error, live/HLS-style non-finite
  // or zero duration): the default-duration timer drives them instead.
  const [timerFallbackKey, setTimerFallbackKey] = useState("");
  // A custom frame that reported valid `ctx.onProgress` is driven by its own media time.
  const [frameDrivenKey, setFrameDrivenKey] = useState("");
  // 0.6.0 (SV18) — per-tick progress (timer + media time) lives in an external store so a tick
  // re-renders the bars only, never this root.
  const [progressStore] = useState(createProgressStore);
  // Per-entry reset: whenever the item becomes current again (key change) or
  // the viewer opens / closes, drop ready / fallback / media progress so a
  // revisit starts clean. React 19 setState-during-render pattern.
  const [entry, setEntry] = useState({ key: itemKey, open: isOpen });
  if (entry.key !== itemKey || entry.open !== isOpen) {
    setEntry({ key: itemKey, open: isOpen });
    setReadyKey("");
    setTimerFallbackKey("");
    setFrameDrivenKey("");
  }
  useLayoutEffect(() => {
    progressStore.resetMedia();
  }, [progressStore, itemKey, isOpen]);
  const markMediaLoaded = media.markLoaded;
  const handleItemReady = useCallback(() => {
    setReadyKey(itemKey);
    // A retried URL that loaded re-arms the one-shot `onMediaError` retry (0.7.0).
    markMediaLoaded();
  }, [itemKey, markMediaLoaded]);
  // 0.7.0 - the URL the stage image actually loaded (`currentSrc`): the ambient backdrop reuses it.
  const [loadedImage, setLoadedImage] = useState<{ key: string; src: string } | null>(null);
  const handleImageLoaded = useCallback(
    (loadedSrc: string) => setLoadedImage({ key: itemKey, src: loadedSrc }),
    [itemKey],
  );
  // A media failure (image / video / frame): with `onMediaError` the host is asked once for a new
  // `src`; otherwise, or without one, the item is unavailable ("media").
  const handleVideoError = useCallback(() => {
    reportMediaFailure("video");
  }, [reportMediaFailure]);
  const handleImageError = useCallback(() => {
    reportMediaFailure("image");
  }, [reportMediaFailure]);
  const handleFrameError = useCallback(() => {
    reportMediaFailure("frame");
  }, [reportMediaFailure]);
  const handleItemMetadata = useCallback(
    (duration: number) => {
      if (!Number.isFinite(duration) || !(duration > 0)) setTimerFallbackKey(itemKey);
      else handleVideoMetadata(duration);
    },
    [itemKey, handleVideoMetadata],
  );
  const handleVideoTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (!Number.isFinite(duration) || !(duration > 0)) {
        setTimerFallbackKey(itemKey);
        return;
      }
      const pct = Math.min(Math.max((currentTime / duration) * 100, 0), 100);
      if (renderItem) setFrameDrivenKey(itemKey);
      // Never backward within an item (the store enforces it).
      progressStore.setMedia(itemKey, pct);
    },
    [itemKey, progressStore, renderItem],
  );
  // A custom frame is ready as soon as it mounts (0.5.4), but not while its URL resolves.
  const mediaReady = renderItem ? !media.resolving : readyKey === itemKey;
  const isReady = mediaReady && !media.unavailable;
  // Layout effect: it must land before the unavailable-notice effects that move on.
  useLayoutEffect(() => {
    unavailableItemRef.current = media.unavailable ? itemKey : "";
  }, [media.unavailable, itemKey]);
  // 0.7.0 (A3): `onItemReady` - once per visit, when the item is ready AND nothing pauses the viewer
  // (its timer starts). The first effect resets the visit; never for an unavailable item or a
  // removal notice frame.
  const readyFiredRef = useRef("");
  const onItemReadyRef = useRef(onItemReady);
  useEffect(() => {
    onItemReadyRef.current = onItemReady;
  });
  useEffect(() => {
    readyFiredRef.current = "";
  }, [itemKey, isOpen]);
  useEffect(() => {
    if (!isOpen || !isReady || isPaused || pendingRemoval || !currentStory || !currentItem) return;
    if (readyFiredRef.current === itemKey) return;
    readyFiredRef.current = itemKey;
    onItemReadyRef.current?.(currentStory.id, currentItem.id);
  }, [isOpen, isReady, isPaused, pendingRemoval, currentStory, currentItem, itemKey]);
  // `loadTimeoutMs`: media that is still not ready by then is unavailable ("timeout").
  // Pause-aware: a held viewer (host / hidden tab / sheet / hold / reply-focus / user) is not
  // waiting on the network, so the clock runs only while nothing pauses it and restarts in full
  // on resume. (`unavailable` and a removal notice never coexist with an armed timer.)
  const timeoutArmed =
    !!loadTimeoutMs && loadTimeoutMs > 0 && isOpen && !pendingRemoval && !isPaused && !!currentItem;
  useEffect(() => {
    if (!timeoutArmed || mediaReady || media.unavailable) return;
    const t = window.setTimeout(() => markMediaUnavailable("timeout"), loadTimeoutMs);
    return () => window.clearTimeout(t);
  }, [timeoutArmed, mediaReady, media.unavailable, loadTimeoutMs, itemKey, markMediaUnavailable]);
  // A video without an explicit duration is driven by its own media time
  // (unless it failed to load — then the default-duration timer takes over so
  // the story never freezes). A custom frame is media-driven once it reports
  // `ctx.onProgress` (and the item has no explicit duration).
  const mediaDriven =
    currentItem?.duration == null &&
    (renderItem ? frameDrivenKey === itemKey : currentItem?.type === "video") &&
    timerFallbackKey !== itemKey;

  // One advance per item: the timer and the video `ended` event both go through
  // this guard, so an item advances (and fires `onItemViewed`) exactly once.
  const advancedKeyRef = useRef("");
  useEffect(() => {
    advancedKeyRef.current = "";
  }, [itemKey, isOpen]);
  const completeItem = useCallback(() => {
    if (advancedKeyRef.current === itemKey) return;
    advancedKeyRef.current = itemKey;
    goToNextItem("completed");
  }, [itemKey, goToNextItem]);

  // What the bars show, resolved against the store by the subscribers (the timer itself runs
  // in <ProgressDriver>, rendered below, so its per-tick state never re-renders this root).
  const progressSelection = useMemo(
    () => ({ itemKey, isReady, mediaDriven }),
    [itemKey, isReady, mediaDriven],
  );

  // ─── v0.4.0–v0.4.1 cube transition + swipe ──────────────────────────────
  // Detect story-level cursor changes during render and trigger the AUTO
  // cube animation in the SAME commit as the cursor change. The previous
  // values live in React state (`trackedCursor`) — NOT refs — so the
  // mid-render setState pattern handles the sync without tripping the
  // React Compiler "no refs during render" lint.
  //
  // `pendingDragCommit` suppresses the auto trigger when the cursor change
  // was caused by a drag commit (we already played the cube animation
  // during the drag — no need to play it again).
  // Destructure the cube-hook container to locals up front. `setRotatorRef`
  // closes over the hook's internal rotator ref, so once
  // `ref={cube.setRotatorRef}` appears in JSX the React Compiler's aliasing
  // analysis treats the whole `cube` container as a ref and flags every
  // later `cube.state` read as "ref access during render" (known
  // false-positive class — same destructure-to-locals fix as blackboard /
  // reply-composer). Locals keep the analysis precise; identities unchanged.
  const {
    state: cubeState,
    setRotatorRef: cubeSetRotatorRef,
    startAuto: cubeStartAuto,
    beginDrag: cubeBeginDrag,
    setDragAngle: cubeSetDragAngle,
    releaseDrag: cubeReleaseDrag,
    forceIdle: cubeForceIdle,
  } = useCubeTransition(storyTransitionDurationMs);
  // `storyId` is tracked alongside the index so a pure INDEX shift (a group
  // inserted/removed before the current one, same story on screen) snaps
  // instead of animating a cube away from whatever now sits at the old index.
  const trackNow = () => ({
    storyIndex: cursor.storyIndex,
    itemIndex: cursor.itemIndex,
    isOpen,
    storyId: stories[cursor.storyIndex]?.id,
  });
  const [trackedCursor, setTrackedCursor] = useState(trackNow);
  const [trackedSnap, setTrackedSnap] = useState(snapCount);
  const [pendingDragCommit, setPendingDragCommit] = useState(false);
  if (pendingRemoval) {
    // A removal notice is held: the frame stays put; the repair that follows
    // bumps snapCount and snaps (never a cube toward / away from a ghost).
  } else if (trackedSnap !== snapCount) {
    // Cursor was repaired because its story/item was removed (or data first
    // arrived) — snap, never animate a cube toward/away from a ghost.
    setTrackedSnap(snapCount);
    setTrackedCursor(trackNow());
  } else if (trackedCursor.isOpen !== isOpen) {
    setTrackedCursor(trackNow());
  } else if (pendingDragCommit && cursor.storyIndex !== trackedCursor.storyIndex) {
    // Cursor change came from a drag commit — suppress the auto animation.
    setPendingDragCommit(false);
    setTrackedCursor(trackNow());
  } else if (
    cursor.storyIndex !== trackedCursor.storyIndex &&
    stories[cursor.storyIndex]?.id === trackedCursor.storyId
  ) {
    // Same story, shifted index (an earlier group was added/removed) — snap.
    setTrackedCursor(trackNow());
  } else if (
    isOpen &&
    !disableStoryTransition &&
    !reducedMotion &&
    cubeState.phase === "idle" &&
    cursor.storyIndex !== trackedCursor.storyIndex &&
    stories.length > 0
  ) {
    const direction =
      cursor.storyIndex > trackedCursor.storyIndex ? "next" : "prev";
    const leavingStory = stories[trackedCursor.storyIndex];
    const leavingItem = leavingStory?.items[trackedCursor.itemIndex];
    if (leavingStory && leavingItem) {
      cubeStartAuto({
        direction,
        leaving: {
          storyId: leavingStory.id,
          itemId: leavingItem.id,
          itemIndex: trackedCursor.itemIndex,
          progress: 100,
        },
        // Read at the moment the cube starts; document-level direction (the viewer is portalled).
        mirror: typeof document !== "undefined" && isRtlElement(document.body),
      });
    }
    setTrackedCursor(trackNow());
  } else if (
    trackedCursor.storyIndex !== cursor.storyIndex ||
    trackedCursor.itemIndex !== cursor.itemIndex
  ) {
    setTrackedCursor(trackNow());
  }
  // Force idle on viewer close to clear any in-flight cube state.
  // Dep only on the memoized `cubeForceIdle` (stable identity) — depending
  // on the whole hook container triggers an infinite loop because the hook
  // returns a fresh container object on every render.
  useEffect(() => {
    if (!isOpen) cubeForceIdle();
  }, [isOpen, cubeForceIdle]);

  // Derived: cube mount + per-face transforms. The cube structure
  // (perspective + container + rotator) is rendered whenever phase !== idle.
  // The CSS transition on the rotator is enabled in auto/releasing modes
  // (animated angle change) and DISABLED in dragging mode (pointer drives
  // it directly — any transition would lag the finger).
  const cubeMounted = cubeState.phase !== "idle";
  const cubeUsesTransition =
    cubeState.phase === "auto" || cubeState.phase === "releasing";
  // Hoist narrowed snapshots out of the discriminated union for JSX use.
  let autoLeavingStory: Story | null = null;
  let autoLeavingItem: StoryItem | null = null;
  let autoLeavingItemIndex = 0;
  let autoLeavingProgress = 0;
  let autoDirection: CubeDirection | null = null;
  let autoMirror = false;
  let dragPrev: { story: Story; item: StoryItem; itemIndex: number; progress: number } | null = null;
  let dragNext: { story: Story; item: StoryItem; itemIndex: number; progress: number } | null = null;
  let dragMirror = false;
  if (cubeState.phase === "auto") {
    const cs = cubeState;
    autoDirection = cs.direction;
    autoMirror = cs.mirror;
    autoLeavingItemIndex = cs.leaving.itemIndex;
    autoLeavingProgress = cs.leaving.progress;
    autoLeavingStory = stories.find((s) => s.id === cs.leaving.storyId) ?? null;
    autoLeavingItem =
      autoLeavingStory?.items.find((i) => i.id === cs.leaving.itemId) ?? null;
  } else if (
    cubeState.phase === "dragging" ||
    cubeState.phase === "releasing"
  ) {
    const cs = cubeState;
    dragMirror = cs.mirror;
    if (cs.prev) {
      const ps = stories.find((s) => s.id === cs.prev!.storyId);
      const pi = ps?.items.find((i) => i.id === cs.prev!.itemId);
      if (ps && pi) {
        dragPrev = {
          story: ps,
          item: pi,
          itemIndex: cs.prev.itemIndex,
          progress: cs.prev.progress,
        };
      }
    }
    if (cs.next) {
      const ns = stories.find((s) => s.id === cs.next!.storyId);
      const ni = ns?.items.find((i) => i.id === cs.next!.itemId);
      if (ns && ni) {
        dragNext = {
          story: ns,
          item: ni,
          itemIndex: cs.next.itemIndex,
          progress: cs.next.progress,
        };
      }
    }
  }

  // 0.6.0 (SV19) - the walls are physical: left holds the previous story, right the next; under
  // RTL they swap.
  const leftGhost = dragMirror ? dragNext : dragPrev;
  const rightGhost = dragMirror ? dragPrev : dragNext;

  // ─── v0.4.1 swipe gesture ──────────────────────────────────────────────
  // Pointer-driven Instagram-style swipe between stories. Engages when
  // horizontal drag exceeds 10px AND > vertical drag. While engaged,
  // `--story-cube-angle` is driven directly through the cube hook.
  // On release: distance > 30% width OR velocity > 0.5 px/ms → commit.
  // Else: snap back to 0.
  const gestureRootRef = useRef<HTMLDivElement | null>(null);
  const swipeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startTime: number;
    active: boolean;
    width: number;
    suppressClick: boolean;
    /** 0.6.0 (SV19): the gesture started under dir="rtl" - left / right walls swap. */
    mirror: boolean;
  } | null>(null);
  const swipeJustEndedRef = useRef(false);
  // The swallow flag outlives its purpose when no click follows (a long hold on
  // touch often fires none): it also clears itself after a short timeout, so a
  // later keyboard / programmatic click is never eaten.
  const swallowTimerRef = useRef<number | null>(null);
  const clearClickSwallow = useCallback(() => {
    swipeJustEndedRef.current = false;
    if (swallowTimerRef.current != null) {
      window.clearTimeout(swallowTimerRef.current);
      swallowTimerRef.current = null;
    }
  }, []);
  const armClickSwallow = useCallback(() => {
    clearClickSwallow();
    swipeJustEndedRef.current = true;
    swallowTimerRef.current = window.setTimeout(() => {
      swipeJustEndedRef.current = false;
      swallowTimerRef.current = null;
    }, 400);
  }, [clearClickSwallow]);
  useEffect(() => clearClickSwallow, [clearClickSwallow]);
  // Mirror of "a non-modal layer (link drawer / viewers list / reaction picker) is open", for the
  // gesture handlers declared before the layer block.
  const nonModalLayerOpenRef = useRef(false);
  // The gesture handlers themselves are declared LATER in the component,
  // after the longPress hook is initialized (they coexist).

  // Keyboard nav is wired after the layer block below (it stands down while a
  // layer is open).

  // v0.2.0 C9 — long-press pause (Instagram-canonical mobile gesture).
  // Additive to v0.1 middle-tap pause; both coexist (Q-V8 lock).
  const longPress = useLongPressPause({
    isOpen,
    longPressThresholdMs,
    onPause: () => addPauseReason("hold"),
    onResume: () => removePauseReason("hold"),
  });

  // 0.6.0 — the groups a sequential move lands on (muted groups are skipped in
  // both directions); -1 = none. Drives the swipe preview, rubber-banding and
  // the previous arrow.
  const prevStoryIndex = findAdjacentStoryIndex(stories, cursor.storyIndex, -1);
  const nextStoryIndex = findAdjacentStoryIndex(stories, cursor.storyIndex, 1);

  // v0.4.1 — Swipe gesture handlers. Coexist with longPress: pointerdown
  // calls both; if drag intent is detected, longPress is cancelled.
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // A new press ends any stale "swallow the next click" flag — a swipe or
      // long press that ended off the tap zones fires no click to consume it.
      clearClickSwallow();
      // A press OUTSIDE an open non-modal layer dismisses it (the layer's own
      // outside-press listener) and must ONLY dismiss: swallow the click that
      // follows so it can't toggle pause or advance the item behind.
      if (
        nonModalLayerOpenRef.current &&
        e.target instanceof Element &&
        // The reaction picker's popover is portaled (its React events still bubble here) and its
        // trigger toggles it: neither is an outside press.
        !e.target.closest('[data-story-layer], [data-slot="popover-content"], [data-slot="popover-trigger"]')
      ) {
        armClickSwallow();
        return;
      }
      if (isGestureExempt(e.target)) return;
      if (!swipeEnabled) {
        longPress.handlePointerDown();
        return;
      }
      if (e.pointerType === "mouse" && e.button !== 0) {
        longPress.handlePointerDown();
        return;
      }
      const width = e.currentTarget.getBoundingClientRect().width;
      swipeRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startTime: performance.now(),
        active: false,
        width,
        suppressClick: false,
        mirror: false,
      };
      longPress.handlePointerDown();
    },
    [swipeEnabled, longPress, clearClickSwallow, armClickSwallow],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const swipe = swipeRef.current;
      if (!swipe || swipe.pointerId !== e.pointerId) return;
      const dx = e.clientX - swipe.startX;
      const dy = e.clientY - swipe.startY;
      if (!swipe.active) {
        // Drag intent: Δx > 10px AND > Δy.
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
          swipe.active = true;
          swipe.mirror = isRtlElement(gestureRootRef.current);
          longPress.handlePointerCancel();
          // Muted groups are skipped: the preview shows the neighbour a swipe
          // would actually land on.
          const prevStory = stories[prevStoryIndex];
          const nextStory = stories[nextStoryIndex];
          // Under reduced motion there is no preview: no neighbour media mounts, the swipe
          // just navigates on release.
          if (!swipeHardCut) cubeBeginDrag({
            mirror: swipe.mirror,
            prev:
              prevStory && prevStory.items[0]
                ? {
                    storyId: prevStory.id,
                    itemId: prevStory.items[0].id,
                    itemIndex: 0,
                    progress: 100,
                  }
                : null,
            next:
              nextStory && nextStory.items[0]
                ? {
                    storyId: nextStory.id,
                    itemId: nextStory.items[0].id,
                    itemIndex: 0,
                    progress: 0,
                  }
                : null,
          });
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // setPointerCapture can throw if pointer was already released.
          }
        } else {
          return;
        }
      }
      e.preventDefault();
      if (swipeHardCut) return;
      // Walls are physical: the left wall holds the previous story (the next one under RTL).
      const hasLeft = swipe.mirror ? nextStoryIndex >= 0 : prevStoryIndex >= 0;
      const hasRight = swipe.mirror ? prevStoryIndex >= 0 : nextStoryIndex >= 0;
      // Δx → angle. Drag right (Δx > 0) → +angle (reveals the left wall).
      // Drag left (Δx < 0) → -angle (reveals the right wall).
      let angle = (dx / swipe.width) * 90;
      if (angle > 0 && !hasLeft) angle = angle * 0.25;
      if (angle < 0 && !hasRight) angle = angle * 0.25;
      angle = Math.max(-90, Math.min(90, angle));
      cubeSetDragAngle(angle);
    },
    [
      longPress,
      stories,
      prevStoryIndex,
      nextStoryIndex,
      cubeBeginDrag,
      cubeSetDragAngle,
      swipeHardCut,
    ],
  );

  const handlePointerEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const swipe = swipeRef.current;
      // SV8 — releasing a long press must not also tap the zone under the
      // finger: swallow the click the browser fires after this pointerup.
      const endLongPress = () => {
        if (longPress.handlePointerUp() && e.type === "pointerup") {
          armClickSwallow();
        }
      };
      if (!swipe || swipe.pointerId !== e.pointerId) {
        endLongPress();
        return;
      }
      swipeRef.current = null;
      if (!swipe.active) {
        endLongPress();
        return;
      }
      // Active drag release — snap decision.
      const dx = e.clientX - swipe.startX;
      const elapsedMs = Math.max(1, performance.now() - swipe.startTime);
      const velocity = dx / elapsedMs;
      const commitDistance = swipe.width * 0.3;
      const commitVelocity = 0.5;
      // Swiping left reveals the right wall, swiping right the left wall; under RTL the right
      // wall holds the PREVIOUS story.
      const hasLeft = swipe.mirror ? nextStoryIndex >= 0 : prevStoryIndex >= 0;
      const hasRight = swipe.mirror ? prevStoryIndex >= 0 : nextStoryIndex >= 0;

      let side: "left" | "right" | "back" = "back";
      if ((dx <= -commitDistance || velocity <= -commitVelocity) && hasRight) {
        side = "right";
      } else if ((dx >= commitDistance || velocity >= commitVelocity) && hasLeft) {
        side = "left";
      }
      const snap: "next" | "prev" | "back" =
        side === "back" ? "back" : (side === "right") !== swipe.mirror ? "next" : "prev";

      // Suppress the click that would fire on this pointerup (tap zones).
      armClickSwallow();
      try {
        e.currentTarget.releasePointerCapture(swipe.pointerId);
      } catch {
        // Already released — safe to ignore.
      }

      if (swipeHardCut) {
        // No cube was started: commit instantly, or do nothing on a snap-back.
        if (snap === "next") goToNextStory();
        else if (snap === "prev") goToPrevStory();
        return;
      }
      if (snap === "next") {
        cubeReleaseDrag({
          targetDeg: side === "right" ? -90 : 90,
          onComplete: () => {
            setPendingDragCommit(true);
            goToNextStory();
          },
        });
      } else if (snap === "prev") {
        cubeReleaseDrag({
          targetDeg: side === "right" ? -90 : 90,
          onComplete: () => {
            setPendingDragCommit(true);
            goToPrevStory();
          },
        });
      } else {
        cubeReleaseDrag({ targetDeg: 0 });
      }
    },
    [
      armClickSwallow,
      cubeReleaseDrag,
      prevStoryIndex,
      nextStoryIndex,
      goToNextStory,
      goToPrevStory,
      longPress,
      swipeHardCut,
    ],
  );

  const handleClickCapture = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (swipeJustEndedRef.current) {
        clearClickSwallow();
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [clearClickSwallow],
  );


  // ─── v0.2.0 engagement state (per-item like / reaction / reply counts) ──
  const { getState: getEngagementState, dispatch: dispatchEngagement } =
    useStoryEngagementState({
      subscribe: engagementSubscribe,
      onSubscribeDelta: onSubscribeEngagementDelta,
      // The first change to an item applies on top of its `engagement` seed.
      getSeed: (storyId, itemId) =>
        storiesRef.current
          .find((st) => st.id === storyId)
          ?.items.find((it) => it.id === itemId)?.engagement,
    });

  // (v0.2.0 `composerRef` + kebab state are declared earlier — above the
  // imperative handle that closes over them; see the TDZ note there.
  // Close-on-cursor-change for kebab lives in the consolidated render-time
  // reset below, next to the panel resets.)

  // ─── v0.3.5 engagement bar expand/collapse state ─────────────────────
  // Default: collapsed (only the heart toggle visible). Tapping the toggle
  // reveals the engagement icons with a staggered bottom-to-top animation;
  // tapping anywhere else collapses it.
  // v0.3.7: heart toggle moved inline beside the DM bar.
  const [engagementExpanded, setEngagementExpanded] = useState(false);
  const engagementColumnRef = useRef<HTMLDivElement | null>(null);
  const engagementToggleRef = useRef<HTMLButtonElement | null>(null);
  // (Close-on-cursor-change lives in the consolidated render-time reset below.)
  // Outside-click: any pointer event outside BOTH the engagement column
  // AND the inline toggle button collapses the column.
  useEffect(() => {
    if (!engagementExpanded) return;
    const handleDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const insideColumn = engagementColumnRef.current?.contains(target);
      const insideToggle = engagementToggleRef.current?.contains(target);
      // 0.7.0 - a press inside one of the viewer's layers (the comments / share sheet the rail
      // opened, the actions menu, the link drawer) is not outside: collapsing the rail there made
      // the sheet's opener `inert`, so its close button dropped focus to the page.
      const insideLayer = target instanceof Element && !!target.closest("[data-story-layer]");
      if (!insideColumn && !insideToggle && !insideLayer) {
        setEngagementExpanded(false);
      }
    };
    document.addEventListener("pointerdown", handleDown);
    return () => document.removeEventListener("pointerdown", handleDown);
  }, [engagementExpanded]);

  // ─── v0.3.0 comments panel state — opens on comment-icon tap ──────────
  const [commentsOpen, setCommentsOpen] = useState(false);
  // ─── v0.3.1 share panel state — opens on share-icon tap ──────────────
  const [shareOpen, setShareOpen] = useState(false);
  // 0.6.2 — sheet ids for the comment / share actions' disclosure state (engagement-bar 0.7.0).
  const commentsPanelId = useId();
  const sharePanelId = useId();
  // Owner viewers list + link drawer: their open state lives here so the root
  // knows every open layer (pause, Escape, inert).
  const [ownerViewersOpen, setOwnerViewersOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  // The engagement bar's reaction picker (a popover) counts as a layer: the story pauses
  // while it is open. Mirrors the bar's own state via `onReactionPickerOpenChange`.
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const anyPanelOpen = commentsOpen || shareOpen;
  // v0.3.2 introduced a `composerActive` state to fade the engagement
  // overlay when the DM composer was focused. v0.3.3 reverted that —
  // engagement stays always visible per UX feedback, and the Cancel
  // button (which caused the collision) was removed. The state +
  // onActiveChange prop stay available for future polish (e.g., a
  // heart-toggle that only reveals the engagement column on demand).
  // Auto-pause story timer while any v0.3 panel is open; resume on close.
  // Mirrors the long-press-pause additive — opening a panel is an explicit
  // focus change away from the media and the auto-advance should not race
  // the user.
  // (SV5: the pause for open layers lives below, once every layer is known.)
  // Close transient chrome (kebab / engagement column / v0.3 panels) on
  // cursor change (next/prev nav) — so none of it persists across story
  // navigation. Render-time prev-state adjustment (the same guarded
  // mid-render setState pattern as `trackedCursor` above; React docs
  // "adjusting state when a prop changes") instead of setState-in-effect
  // resets: the close lands in the SAME commit as the navigation, with no
  // extra post-commit render showing stale-open chrome.
  // Set on the first story change: under reduced motion the incoming story fades in (never on open).
  const [storyChanged, setStoryChanged] = useState(false);
  const [pickerEpoch, setPickerEpoch] = useState(0);
  const [prevChromeCursor, setPrevChromeCursor] = useState({
    storyIndex: cursor.storyIndex,
    itemIndex: cursor.itemIndex,
  });
  if (
    prevChromeCursor.storyIndex !== cursor.storyIndex ||
    prevChromeCursor.itemIndex !== cursor.itemIndex
  ) {
    if (prevChromeCursor.storyIndex !== cursor.storyIndex) setStoryChanged(true);
    setPrevChromeCursor({
      storyIndex: cursor.storyIndex,
      itemIndex: cursor.itemIndex,
    });
    if (reactionPickerOpen) setPickerEpoch((n) => n + 1);
    setReactionPickerOpen(false);
    setKebabOpen(false);
    setEngagementExpanded(false);
    setCommentsOpen(false);
    setShareOpen(false);
    setOwnerViewersOpen(false);
    setLinkOpen(false);
  }
  // Closing the viewer (the host sets `isOpen=false`, or `onClose` led there)
  // closes every layer too, so a reopen never resurrects a stale sheet.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setKebabOpen(false);
      setCommentsOpen(false);
      setShareOpen(false);
      setOwnerViewersOpen(false);
      setLinkOpen(false);
      setReactionPickerOpen(false);
    }
  }
  // Mutual exclusion — opening one closes the other.
  const openCommentsPanel = useCallback(() => {
    setShareOpen(false);
    setCommentsOpen(true);
  }, [setShareOpen, setCommentsOpen]);
  const openSharePanel = useCallback(() => {
    setCommentsOpen(false);
    setShareOpen(true);
  }, [setCommentsOpen, setShareOpen]);

  // Resolved kebab items — kebabActions full-takeover wins; otherwise
  // defaultStoryKebabActions assembles per permissions matrix + moderator section.
  const kebabItems = useMemo(() => {
    if (!currentStory || !currentItem || pendingRemoval) return [];
    if (kebabActions) return visibleKebabItems(kebabActions(currentStory, currentItem));
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
      extraActions: extraKebabActions,
    });
  }, [
    currentStory,
    currentItem,
    pendingRemoval,
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
    extraKebabActions,
  ]);

  // Resolved engagement actions for the current item (rebuilt per cursor change)
  const engagementOverlayMounted =
    !!viewerMode && viewerMode === "viewer" && !disableEngagement && !!currentStory && !!currentItem && !pendingRemoval;
  // Reply composer mount gate — viewer mode + opt-in + story/item present.
  // currentUser absent is HANDLED INSIDE the render (composerEmptyState fallback).
  const replyComposerMounted =
    !!viewerMode && viewerMode === "viewer" && !disableReplyComposer && !!currentStory && !!currentItem && !pendingRemoval;
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
    const state = getEngagementState(
      currentStory!.id,
      currentItem!.id,
      currentItem!.engagement,
    );
    // False-positive suppression (known class: ref-reading event closures
    // passed to an opaque builder called during render — media-editor
    // v0.1.2 precedent). The builder only STORES onCommentClick (which
    // reads composerRef.current) in the returned actions array; the ref is
    // read at click time, never during render.
    // eslint-disable-next-line react-hooks/refs
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
        // v0.3.0 — open the comments panel (Instagram-canonical). When
        // disableComments is set, fall back to focusing the DM input
        // (v0.2.x behavior).
        if (!disableComments) {
          openCommentsPanel();
        } else {
          composerRef.current?.focus();
        }
      },
      // v0.3.5 — kebab moved out of the engagement column to the header
      // right cluster; not added to the actions array here.
      onShareClick: () => {
        // v0.3.1 — open the share panel (Instagram-canonical bottom-sheet).
        // When disableSharePanel is set, fall back to firing onShareStory
        // directly (v0.2.x system-share behavior).
        if (!disableSharePanel) {
          openSharePanel();
        }
        onShareStory?.(currentStory!.id, currentItem!.id);
      },
      // Only where the action opens a sheet (the sheets mount in viewer mode, unless opted out).
      commentDisclosure:
        viewerMode === "viewer" && !disableComments
          ? { expanded: commentsOpen, controls: commentsPanelId }
          : undefined,
      shareDisclosure:
        viewerMode === "viewer" && !disableSharePanel
          ? { expanded: shareOpen, controls: sharePanelId }
          : undefined,
    });
  }, [
    commentsOpen,
    shareOpen,
    commentsPanelId,
    sharePanelId,
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
    disableComments,
    disableSharePanel,
    openCommentsPanel,
    openSharePanel,
  ]);

  // v0.2.0 — wire trigger* refs to live handlers each render. These bypass
  // the permissions matrix (the matrix gates UI affordances; the handle is
  // the programmatic escape hatch). No-op when no story/item is current.
  useEffect(() => {
    triggerLikeRef.current = () => {
      if (!currentStory || !currentItem) return;
      const state = getEngagementState(currentStory.id, currentItem.id, currentItem.engagement);
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

  // ─── layers (SV5 pause · SV6 Escape + containment) ─────────────────────
  // Every transient surface above the media. Effective open = state AND the
  // surface is actually mounted, so a stale flag can never wedge a pause.
  const isViewerMode = !!viewerMode && viewerMode === "viewer";
  const layerOpen: Record<LayerId, boolean> = {
    comments: isOpen && commentsOpen && isViewerMode && !disableComments && !pendingRemoval,
    share: isOpen && shareOpen && isViewerMode && !disableSharePanel && !pendingRemoval,
    kebab: isOpen && kebabOpen && kebabItems.length > 0,
    viewers: isOpen && ownerViewersOpen && ownerOverlayMounted && !renderOwnerOverlay,
    link: isOpen && linkOpen && !!currentItem?.link && !pendingRemoval,
    reactionPicker: isOpen && reactionPickerOpen && engagementOverlayMounted,
  };
  // Open-order stack (last = most recently opened = the one Escape closes).
  // Render-time adjustment, same guarded pattern as the cursor tracking above.
  const [layerOrder, setLayerOrder] = useState<LayerId[]>([]);
  const order: LayerId[] = layerOrder
    .filter((id) => layerOpen[id])
    .concat(
      (Object.keys(layerOpen) as LayerId[]).filter(
        (id) => layerOpen[id] && !layerOrder.includes(id),
      ),
    );
  if (
    order.length !== layerOrder.length ||
    order.some((id, i) => id !== layerOrder[i])
  ) {
    setLayerOrder(order);
  }
  // Reduced motion: the incoming story fades in instead of the cube (never on open, never between items).
  const storyFade = reducedMotion && !disableStoryTransition && storyChanged;
  const hasLayer = order.length > 0;
  const topLayer = order[order.length - 1];
  const modalLayerOpen = layerOpen.comments || layerOpen.share || layerOpen.kebab;

  // The reply box holds the `reply-focus` pause reason while focused or holding a draft.
  const setReplyFocusPaused = useCallback(
    (paused: boolean) => {
      if (paused) addPauseReason("reply-focus");
      else removePauseReason("reply-focus");
    },
    [addPauseReason, removePauseReason],
  );

  const closeLayer = useCallback((id: LayerId) => {
    if (id === "comments") setCommentsOpen(false);
    else if (id === "share") setShareOpen(false);
    else if (id === "kebab") setKebabOpen(false);
    else if (id === "viewers") setOwnerViewersOpen(false);
    else if (id === "reactionPicker") setReactionPickerOpen(false);
    else setLinkOpen(false);
  }, [setCommentsOpen, setShareOpen, setKebabOpen, setOwnerViewersOpen, setReactionPickerOpen, setLinkOpen]);

  // SV5 — any open layer holds the `sheet` pause reason, and only that reason:
  // closing the last layer never resumes a pause the host (`setPaused(true)`),
  // the user (middle tap) or the reply box set. To make another surface a layer,
  // add its id to `LayerId` + `layerOpen` above.
  useLayoutEffect(() => {
    nonModalLayerOpenRef.current = layerOpen.link || layerOpen.viewers || layerOpen.reactionPicker;
  });
  useEffect(() => {
    if (!hasLayer) return;
    addPauseReason("sheet");
    return () => removePauseReason("sheet");
  }, [hasLayer, addPauseReason, removePauseReason]);

  // SV6 — Escape (and an outside press) reaches the dialog's `onOpenChange(false)`
  // on both Radix and Base UI: with a layer open it closes only the top layer
  // (the reply composer stays mounted, so its draft survives); otherwise the viewer.
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      if (topLayer) {
        closeLayer(topLayer);
        return;
      }
      onClose();
    },
    [topLayer, closeLayer, onClose],
  );

  // Keyboard nav (Escape funnels through the dialog → onOpenChange above).
  // v0.2.0 — `enabled` gates the listener entirely per `disableKeyboardNav`.
  // 0.5.4 — it also stands down while any layer is open: focus sits inside the
  // layer, and Space / arrows there must not toggle or navigate the story behind.
  useStoryKeyboardNav({
    isOpen,
    enabled: !disableKeyboardNav && !hasLayer,
    onPrevItem: goToPrevItem,
    onNextItem: goToNextItem,
    onTogglePause: togglePause,
    isRtl: () => isRtlElement(gestureRootRef.current),
  });

  // SV6 — containment: while a sheet or the kebab is open, everything else in
  // the dialog is `inert` so Tab cycles inside the layer (Radix FocusScope and
  // Base UI both skip inert). Closed sheets carry their own `inert`.
  const layerSignature = order.join(",");
  useEffect(() => {
    if (!modalLayerOpen) return;
    const root = gestureRootRef.current?.parentElement;
    if (!root) return;
    const marked = new Set<Element>();
    const apply = () => {
      const keep = new Set<Element>();
      root
        .querySelectorAll(
          '[data-story-layer="sheet"][data-open="true"], [data-story-layer="kebab"], [data-story-layer="backdrop"]',
        )
        .forEach((layer) => {
          for (let n: Element | null = layer; n && n !== root; n = n.parentElement) {
            keep.add(n);
          }
        });
      keep.forEach((node) => {
        const parent = node.parentElement;
        if (!parent) return;
        for (const sibling of Array.from(parent.children)) {
          if (keep.has(sibling) || sibling.hasAttribute("inert")) continue;
          if (sibling.classList.contains("sr-only")) continue;
          sibling.setAttribute("inert", "");
          marked.add(sibling);
        }
      });
    };
    apply();
    // F-03: a sibling that MOUNTS while the sheet stays open (the unavailable notice, a late
    // engagement overlay...) is made inert too. Only child-list changes are observed, and
    // setting `inert` is an attribute change, so this never feeds itself.
    const observer = new MutationObserver(apply);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      marked.forEach((el) => el.removeAttribute("inert"));
    };
  }, [modalLayerOpen, layerSignature]);

  if (!currentStory || !currentItem) {
    // Render the shell so closing animations still fire when stories empty mid-view.
    return (
      <ViewerShell
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        ariaLabel={labels.viewerLabel}
        className={contentClassName}
        returnFocusTo={returnFocusTo}
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
      returnFocusTo={returnFocusTo}
      overflowVisible={navArrowsPlacement === "outside"}
      // F4: wrap Tab at the dialog level while no layer is open (layers wrap themselves). The
      // dialog's focus scope ignores `inert`, so at the last REAL control it would not wrap.
      onKeyDown={hasLayer ? undefined : wrapTabWithinLayer}
    >
      {/* 0.7.0 (SV-2) - desktop backdrop: portalled, under the dialog overlay, click-through. */}
      {backdrop === "ambient" || renderBackdrop ? (
        <AmbientBackdrop
          open={isOpen}
          mode={backdrop}
          story={currentStory}
          item={currentItem}
          src={
            currentItem.type === "image" && isReady && loadedImage?.key === itemKey
              ? loadedImage.src
              : undefined
          }
          poster={currentItem.type === "video" ? media.poster : undefined}
          isReady={isReady}
          loading={!isReady && !media.unavailable && !pendingRemoval}
          reducedMotion={reducedMotion}
          renderBackdrop={renderBackdrop}
        />
      ) : null}
      {/* v0.2.0 C7 — renderNavArrows slot wins as full takeover.
          v0.2.0 C8 — `disableNavArrows` suppresses the default mount entirely. */}
      {renderNavArrows ? (
        renderNavArrows(slotHelpers)
      ) : !disableNavArrows ? (
        <NavArrows
          canPrev={prevStoryIndex >= 0}
          onPrev={goToPrevStory}
          onNext={goToNextStory}
          labels={labels}
          placement={navArrowsPlacement}
        />
      ) : null}

      <div
        className={cn(
          "relative h-full w-full bg-black touch-pan-y",
          // "outside" arrows need the card to overflow, so the stage clips itself.
          navArrowsPlacement === "outside" && "overflow-hidden md:rounded-2xl",
          // v0.4.0 — `perspective` + `container-type: inline-size` engage only
          // while the cube is mounted (auto / dragging / releasing); idle
          // state is a flat surface (no 3D context, no container-query
          // side-effects on consumer content).
          cubeMounted && "perspective-distant @container",
          className,
        )}
        ref={gestureRootRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClickCapture={handleClickCapture}
      >
        {/* v0.4.0 — Cube rotator. When idle, contents render normally
            (no transform, no preserve-3d). When mounted, the rotator's
            transform reads `--story-cube-angle` (driven by the hook via
            DOM + RAF / pointer events — not React state — so we don't
            re-render per frame).
            v0.4.2 — Prefix `translateZ(-50cqw)`. The faces themselves
            sit at `translateZ(50cqw)` (front wall of the cube). Without
            the rotator's `-50cqw` shift, the front face would land in
            front of the perspective plane and CSS perspective would
            magnify it (~1.2× at rest), causing a visible scale-up jump
            the moment the cube engages on a swipe. With the shift, the
            front face's world z = 0 at idle — natural CSS scale 1.0×,
            no jump — and naturally scales DOWN as it rotates away (the
            proper cube perspective behavior). The incoming face arrives
            at world z=0 at ∓90° and ends at scale 1.0× too. */}
        <div
          ref={cubeSetRotatorRef}
          className={cn(
            "absolute inset-0",
            cubeMounted && "transform-3d",
          )}
          style={
            cubeMounted
              ? {
                  transform:
                    "translateZ(-50cqw) rotateY(var(--story-cube-angle, 0deg))",
                  transition: cubeUsesTransition
                    ? `transform ${storyTransitionDurationMs}ms cubic-bezier(0.32, 0.72, 0, 1)`
                    : "none",
                }
              : undefined
          }
        >
        {/* v0.4.0 auto-mode — Leaving face (ghost). Pre-placed at the
            front wall (`translateZ(50cqw)`). As the rotator swings ∓90deg
            the ghost rotates out of view to the side. */}
        {cubeState.phase === "auto" && autoLeavingStory && autoLeavingItem ? (
          <div
            className="absolute inset-0 backface-hidden pointer-events-none"
            style={{ transform: "translateZ(50cqw)" }}
            aria-hidden="true"
            inert
          >
            <StoryCubeFace
              story={autoLeavingStory}
              item={autoLeavingItem}
              itemIndex={autoLeavingItemIndex}
              progress={autoLeavingProgress}
              isMuted={isMuted}
              src={mediaSrcFor(autoLeavingStory, autoLeavingItem)}
              labels={labels}
              renderBadge={renderHeaderBadge}
            />
          </div>
        ) : null}
        {/* v0.4.1 drag-mode — Prev ghost on the LEFT wall (rotateY -90deg).
            Mounted during dragging + releasing so the user can swipe to
            either neighbor. */}
        {(cubeState.phase === "dragging" || cubeState.phase === "releasing") &&
        leftGhost ? (
          <div
            className="absolute inset-0 backface-hidden pointer-events-none"
            style={{ transform: "rotateY(-90deg) translateZ(50cqw)" }}
            aria-hidden="true"
            inert
          >
            <StoryCubeFace
              story={leftGhost.story}
              item={leftGhost.item}
              itemIndex={leftGhost.itemIndex}
              progress={leftGhost.progress}
              isMuted={isMuted}
              src={mediaSrcFor(leftGhost.story, leftGhost.item)}
              labels={labels}
              renderBadge={renderHeaderBadge}
            />
          </div>
        ) : null}
        {/* v0.4.1 drag-mode — Next ghost on the RIGHT wall (rotateY +90deg). */}
        {(cubeState.phase === "dragging" || cubeState.phase === "releasing") &&
        rightGhost ? (
          <div
            className="absolute inset-0 backface-hidden pointer-events-none"
            style={{ transform: "rotateY(90deg) translateZ(50cqw)" }}
            aria-hidden="true"
            inert
          >
            <StoryCubeFace
              story={rightGhost.story}
              item={rightGhost.item}
              itemIndex={rightGhost.itemIndex}
              progress={rightGhost.progress}
              isMuted={isMuted}
              src={mediaSrcFor(rightGhost.story, rightGhost.item)}
              labels={labels}
              renderBadge={renderHeaderBadge}
            />
          </div>
        ) : null}
        {/* v0.4.0 — Live tree face. Position depends on cube phase:
            – idle: no transform, renders inline (no cube structure)
            – auto: pre-placed on the side wall opposite the leaving ghost
              (right wall for "next", left wall for "prev") — rotator
              swings it into view
            – dragging / releasing: at the FRONT wall (translateZ only);
              the prev/next ghosts swing in as the rotator rotates. */}
        <div
          className={cn(
            "absolute inset-0",
            cubeMounted && "backface-hidden",
          )}
          style={
            cubeState.phase === "auto" && autoDirection
              ? {
                  transform:
                    (autoDirection === "next") !== autoMirror
                      ? "rotateY(90deg) translateZ(50cqw)"
                      : "rotateY(-90deg) translateZ(50cqw)",
                }
              : cubeState.phase === "dragging" ||
                  cubeState.phase === "releasing"
                ? { transform: "translateZ(50cqw)" }
                : undefined
          }
        >
        {/* v0.2.0 C7 — renderProgress slot wins as full takeover.
            v0.2.0 C8 — `disableProgressBars` suppresses the default mount;
            timer still runs (drives auto-advance). */}
        {/* 0.6.0 (SV15) - item buttons + position announcement for assistive tech. */}
        {/* Independent of the tap zones: assistive tech keeps its item buttons and announcement. */}
        <SrNav
          story={currentStory}
          itemIndex={cursor.itemIndex}
          onPrev={goToPrevItem}
          onNext={goToNextItem}
          labels={labels}
        />
        <ProgressDriver
          store={progressStore}
          isOpen={isOpen && !!currentItem}
          isPaused={isPaused || !isReady || mediaDriven}
          itemKey={itemKey}
          itemDurationMs={itemDurationMs}
          onComplete={completeItem}
        />
        {renderProgress ? (
          <LiveProgressSlot store={progressStore} selection={progressSelection}>
            {(progress) =>
              renderProgress(currentStory.items, cursor.itemIndex, progress, slotHelpers)
            }
          </LiveProgressSlot>
        ) : !disableProgressBars ? (
          <LiveProgressBars
            store={progressStore}
            selection={progressSelection}
            items={currentStory.items}
            currentItemIndex={cursor.itemIndex}
            smooth={mediaDriven}
            author={currentStory.username}
            labels={labels}
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
            onTogglePause={togglePause}
            onToggleMute={() => setMuted((m) => !m)}
            onClose={onClose}
            formatTime={labels.formatTime}
            labels={labels}
            onAuthorClick={onAuthorClick}
            authorComponent={authorComponent}
            renderBadge={renderHeaderBadge}
            onKebabClick={
              kebabItems.length > 0 ? () => setKebabOpen(true) : undefined
            }
            kebabOpen={kebabOpen}
            hidePause={stayNoticeShown}
          />
        )}
        {/* v0.3.0 — scaling wrapper: when the comments or share panel is
            open, the entire visual stack (media + tap-zones + link CTA chip
            + engagement column + heart toggle + DM bar) shrinks toward the
            top with pointer-events disabled inside. Mirrors the Instagram
            bottom-sheet UX. */}
        <div
          className={cn(
            "absolute inset-0 origin-top transition-transform duration-300 ease-out motion-reduce:transition-none",
            // SV13: under prefers-reduced-motion the stack does not scale (the sheet just covers it).
            anyPanelOpen &&
              "scale-[0.55] translate-y-[-18%] pointer-events-none motion-reduce:scale-100 motion-reduce:translate-y-0",
          )}
        >
          {/* SV13: under prefers-reduced-motion the incoming story's media fades in (a story change
              only; an item change keeps the key, so it stays a hard cut). `disableStoryTransition` stays a cut. */}
          <div
            key={storyFade ? currentStory.id : undefined}
            data-story-stage=""
            data-story-fade={storyFade ? "" : undefined}
            className={cn("absolute inset-0", storyFade && "animate-in fade-in-0 duration-200")}
          >
          {pendingRemoval || media.unavailable ? (
            // 0.6.0 — the item cannot play (removed from `stories`, unresolvable,
            // failed media, load timeout): no media mounts (nothing can play)
            // while the notice frame is held.
            <UnavailableNotice
              reason={pendingRemoval ? "removed" : media.unavailable!}
              labels={labels}
              showClose={
                pendingRemoval ? pendingRemoval.stayUntilClosed : media.stayUntilClosed
              }
              onClose={onClose}
            />
          ) : (
          <ItemView
            item={currentItem}
            story={currentStory}
            totalItems={currentStory.items.length}
            cursor={cursor}
            isPaused={isPaused}
            isMuted={isMuted}
            src={media.src}
            poster={media.poster}
            srcSet={media.srcSet}
            sizes={media.sizes}
            onImageLoaded={handleImageLoaded}
            onLoadedMetadata={handleItemMetadata}
            onEnded={completeItem}
            onReady={handleItemReady}
            onTimeUpdate={handleVideoTimeUpdate}
            onVideoError={handleVideoError}
            onImageError={handleImageError}
            onFrameError={handleFrameError}
            videoMediaError={media.videoMediaError}
            mediaKey={itemKey}
            renderItem={renderItem}
            labels={labels}
          />
          )}
          </div>
          {/* v0.2.0 C7 — renderTapZones slot wins as full takeover.
              v0.2.0 C8 — `disableTapZones` suppresses the default mount entirely. */}
          {renderTapZones ? (
            renderTapZones(slotHelpers)
          ) : !disableTapZones ? (
            <TapZones
              onPrev={goToPrevItem}
              onTogglePause={togglePause}
              onNext={goToNextItem}
            />
          ) : null}

          {/* 0.6.0 (SV12) — plain-text caption (dir="auto"), never HTML. */}
          {!pendingRemoval ? (
            <Caption item={currentItem} raised={!!viewerMode} />
          ) : null}

          {/* v0.2.0 C9 — StoryItem.link CTA bottom button. Coexists with the
              engagement overlay (sits above it) and the DM input (sits
              below it in viewer mode). Polymorphic root via `linkComponent`. */}
          {currentItem.link && !pendingRemoval ? (
            <LinkCta
              story={currentStory}
              item={currentItem}
              linkComponent={linkComponent}
              onLinkClick={onLinkClick}
              labels={labels}
              open={linkOpen}
              onOpenChange={setLinkOpen}
            />
          ) : null}

          {/* v0.2.0 — engagement overlay (TikTok/Reels-style stacked right edge).
              Renders only when viewerMode="viewer" + !disableEngagement.
              renderEngagementOverlay slot wins as full takeover.
              v0.3.3 — engagement stays ALWAYS visible per UX feedback. The
              DM gradient strip extends full width below the engagement
              column; the column visually overlays the gradient. Cancel
              button removed entirely so there's no collision to worry
              about. */}
          {engagementOverlayMounted ? (
            renderEngagementOverlay ? (
              renderEngagementOverlay(currentStory!, currentItem!, slotHelpers)
            ) : (
              <EngagementOverlay
                // The bar owns the picker's open state: a cursor change while the picker is up bumps
                // this key so the bar remounts closed (a pick must not apply to the new item). The
                // bar reports the close on unmount.
                key={pickerEpoch}
                story={currentStory!}
                item={currentItem!}
                actions={engagementActions}
                labels={labels}
                expanded={engagementExpanded}
                onReactionPickerOpenChange={setReactionPickerOpen}
                containerRef={engagementColumnRef}
              />
            )
          ) : null}

          {/* v0.2.0 — DM composer at bottom (always-visible "Reply to @user…"
              input — Instagram-canonical DM channel, NOT public comments).
              Renders only when viewerMode="viewer" + !disableReplyComposer.
              currentUser absent → null + composerEmptyState rendered instead.
              renderReplyComposer slot wins as full takeover. */}
          {replyComposerMounted ? (
            renderReplyComposer ? (
              renderReplyComposer(currentStory!, currentItem!, slotHelpers)
            ) : currentUser ? (
              <ReplyComposer
                // Keyed per item: a draft (and its pause) never carries over to
                // the next item, so Send can't target an item the user didn't reply to.
                key={`${currentStory!.id}:${currentItem!.id}`}
                story={currentStory!}
                item={currentItem!}
                currentUser={currentUser}
                onAddReply={onAddReply}
                onSetPaused={setReplyFocusPaused}
                labels={labels}
                composerRef={composerRef}
                prefill={replyPrefill}
              />
            ) : (
              composerEmptyState
            )
          ) : null}

          {/* v0.3.7 — heart engagement toggle inline with the DM bar.
              Sits at right-3 bottom-3 — aligned with the DM input row.
              Tapping toggles the EngagementOverlay (which sits above the
              DM row, animating its icons in from bottom-to-top). */}
          {engagementOverlayMounted && !renderEngagementOverlay ? (
            <button
              ref={engagementToggleRef}
              type="button"
              onClick={() => setEngagementExpanded((v) => !v)}
              aria-expanded={engagementExpanded ? "true" : "false"}
              aria-label={
                engagementExpanded
                  ? labels.engagementHideLabel
                  : labels.engagementShowLabel
              }
              className={cn(
                "absolute end-3 bottom-3 z-32 flex h-9 w-9 items-center justify-center rounded-full text-media-overlay-foreground pointer-events-auto",
                "transition-colors hover:bg-media-overlay-foreground/15 focus-visible:bg-media-overlay-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-media-overlay-foreground/40",
              )}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  engagementExpanded && "scale-110 fill-current text-destructive",
                )}
              />
            </button>
          ) : null}
        </div>

        {/* v0.3.0 — backdrop catcher: while any v0.3 panel is open, a
            dimming layer above the (now-shrunk + pointer-events-none)
            visual stack catches clicks and closes the active panel. Sits
            below the panel itself (z-35 vs panel z-40). v0.3.1: added a
            black/40 dim for visual hierarchy + smoother feel. */}
        {anyPanelOpen ? (
          <button
            type="button"
            data-story-layer="backdrop"
            tabIndex={-1}
            className="absolute inset-0 z-35 bg-media-overlay/70 transition-opacity duration-300"
            onClick={() => {
              setCommentsOpen(false);
              setShareOpen(false);
            }}
            aria-label={
              commentsOpen ? labels.commentsCloseLabel : labels.shareCloseLabel
            }
          />
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
              locale={locale}
              open={ownerViewersOpen}
              onOpenChange={setOwnerViewersOpen}
            />
          )
        ) : null}

        {/* v0.3.5 — kebab button now lives INSIDE ViewerHeader's right cluster
            (passed via the `onKebabClick` prop). The standalone absolute
            block that used to sit at right-16 top-4 is gone — caused
            overlap risks with the close button on small viewports. */}

        {/* v0.2.0 — kebab bottom-sheet panel (shared by engagement-overlay
            kebab + header fallback). Rendered only when kebabOpen + items
            non-empty. */}
        <KebabPanel
          open={kebabOpen}
          items={kebabItems}
          onClose={() => setKebabOpen(false)}
          labels={labels}
        />

        {/* v0.3.0 — comments panel. Always mounted so consumer-side state
            inside `renderCommentsPanel` (typically CommentThread's draft
            composer) persists across open/close cycles. Hidden via
            translate-y when closed. Mount-gated by viewerMode + !disableComments
            so non-viewer modes / opt-outs don't ship the panel at all. */}
        {!!viewerMode && viewerMode === "viewer" && !disableComments ? (
          <CommentsPanel
            id={commentsPanelId}
            story={currentStory}
            item={currentItem}
            open={commentsOpen}
            onClose={() => setCommentsOpen(false)}
            labels={labels}
          >
            {renderCommentsPanel?.(currentStory, currentItem, {
              ...slotHelpers,
              isCommentsOpen: commentsOpen,
              closeCommentsPanel: () => setCommentsOpen(false),
            })}
          </CommentsPanel>
        ) : null}

        {/* v0.3.1 — share panel. Same mount gate as comments (viewer mode +
            !disableSharePanel). Always-mounted so consumer-side state
            (typically <ShareMenu />'s search query) persists across
            open/close cycles. */}
        {!!viewerMode && viewerMode === "viewer" && !disableSharePanel ? (
          <SharePanel
            id={sharePanelId}
            story={currentStory}
            item={currentItem}
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            labels={labels}
          >
            {renderSharePanel?.(currentStory, currentItem, {
              ...slotHelpers,
              isShareOpen: shareOpen,
              closeSharePanel: () => setShareOpen(false),
            })}
          </SharePanel>
        ) : null}
        </div>{/* v0.4.0 — close incoming face */}
        </div>{/* v0.4.0 — close cube rotator */}
      </div>
    </ViewerShell>
  );
}

const StoryViewer = memo(StoryViewerInner);
StoryViewer.displayName = "StoryViewer";

export { StoryViewer };
