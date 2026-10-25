"use client";

import {
  memo,
  useCallback,
  useEffect,
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
import { useStoryViewerState } from "./hooks/use-story-viewer-state";
import { useStoryProgress } from "./hooks/use-story-progress";
import { useStoryKeyboardNav } from "./hooks/use-story-keyboard-nav";
import { useStoryEngagementState } from "./hooks/use-story-engagement-state";
import { useLongPressPause } from "./hooks/use-long-press-pause";
import {
  useCubeTransition,
  type CubeDirection,
} from "./hooks/use-cube-transition";
import { ViewerShell } from "./parts/viewer-shell";
import { ProgressBars } from "./parts/progress-bars";
import { ViewerHeader } from "./parts/viewer-header";
import { TapZones } from "./parts/tap-zones";
import { NavArrows } from "./parts/nav-arrows";
import { ItemView } from "./parts/item-view";
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
import { defaultStoryKebabActions } from "./lib/kebab";
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

type LayerId = "comments" | "share" | "kebab" | "viewers" | "link";

interface StoryViewerInnerProps extends StoryViewerProps {
  ref?: React.Ref<StoryViewerHandle>;
}

function StoryViewerInner(props: StoryViewerInnerProps) {
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
    reactionKinds,
    reactors,
    onLoadReactors,
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
    // v0.3.0 — comments panel
    renderCommentsPanel,
    disableComments = false,
    // v0.3.1 — share panel
    renderSharePanel,
    disableSharePanel = false,
    // v0.4.0 — Instagram-canonical 3D cube transition between stories
    disableStoryTransition = false,
    storyTransitionDurationMs = 400,
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
    snapCount,
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
  /*
   * `reactors` + `onLoadReactors` describe a reactions-preview surface in the
   * engagement overlay that was never built: no part reads either prop, so a
   * consumer supplying profiles (or a fetcher) sees nothing and gets no signal.
   * Building the reactor list is a feature, not a wiring fix — so until it
   * exists, the props announce themselves rather than swallowing the data.
   */
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (reactors === undefined && onLoadReactors === undefined) return;
    console.warn(
      "story-viewer: `reactors` / `onLoadReactors` are not implemented — the engagement overlay has no reactions-preview surface yet, so neither prop has any effect. Render reactors yourself via `renderEngagementOverlay`.",
    );
  }, [reactors, onLoadReactors]);

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

  // ─── 0.5.4 ready gate + media-time progress + single advance ────────────
  // Ready: the current item can start counting (image loaded / failed / cached,
  // video started or failed, custom `renderItem` frame). Keyed by itemKey so it
  // resets per item without an effect.
  const [readyKey, setReadyKey] = useState("");
  // Items whose video can't be media-driven (error, live/HLS-style non-finite
  // or zero duration): the default-duration timer drives them instead.
  const [timerFallbackKey, setTimerFallbackKey] = useState("");
  const [mediaState, setMediaState] = useState({ key: "", pct: 0 });
  // Per-entry reset: whenever the item becomes current again (key change) or
  // the viewer opens / closes, drop ready / fallback / media progress so a
  // revisit starts clean. React 19 setState-during-render pattern.
  const [entry, setEntry] = useState({ key: itemKey, open: isOpen });
  if (entry.key !== itemKey || entry.open !== isOpen) {
    setEntry({ key: itemKey, open: isOpen });
    setReadyKey("");
    setTimerFallbackKey("");
    setMediaState({ key: "", pct: 0 });
  }
  const handleItemReady = useCallback(() => setReadyKey(itemKey), [itemKey]);
  const handleVideoError = useCallback(() => setTimerFallbackKey(itemKey), [itemKey]);
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
      // Never backward within an item.
      setMediaState((prev) =>
        prev.key === itemKey && prev.pct >= pct ? prev : { key: itemKey, pct },
      );
    },
    [itemKey],
  );
  const isReady = !!renderItem || readyKey === itemKey;
  // A video without an explicit duration is driven by its own media time
  // (unless it failed to load — then the default-duration timer takes over so
  // the story never freezes).
  const mediaDriven =
    currentItem?.type === "video" &&
    currentItem.duration == null &&
    !renderItem &&
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
    goToNextItem();
  }, [itemKey, goToNextItem]);

  const timerProgress = useStoryProgress({
    isOpen: isOpen && !!currentItem,
    isPaused: isPaused || !isReady || mediaDriven,
    itemKey,
    itemDurationMs,
    onComplete: completeItem,
  });
  // Not ready -> 0 (the hook's state may still hold the previous entry's value).
  const progress = !isReady
    ? 0
    : mediaDriven
    ? mediaState.key === itemKey
      ? mediaState.pct
      : 0
    : timerProgress;

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
  if (trackedSnap !== snapCount) {
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
  let dragPrev: { story: Story; item: StoryItem; itemIndex: number; progress: number } | null = null;
  let dragNext: { story: Story; item: StoryItem; itemIndex: number; progress: number } | null = null;
  if (cubeState.phase === "auto") {
    const cs = cubeState;
    autoDirection = cs.direction;
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

  // ─── v0.4.1 swipe gesture ──────────────────────────────────────────────
  // Pointer-driven Instagram-style swipe between stories. Engages when
  // horizontal drag exceeds 10px AND > vertical drag. While engaged,
  // `--story-cube-angle` is driven directly through the cube hook.
  // On release: distance > 30% width OR velocity > 0.5 px/ms → commit.
  // Else: snap back to 0.
  const swipeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startTime: number;
    active: boolean;
    width: number;
    suppressClick: boolean;
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
  // Mirror of "a non-modal layer (link drawer / viewers list) is open", for the
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
    onPause: () => setPaused(true),
    onResume: () => setPaused(false),
  });

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
        !e.target.closest("[data-story-layer]")
      ) {
        armClickSwallow();
        return;
      }
      if (isGestureExempt(e.target)) return;
      if (disableStoryTransition) {
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
      };
      longPress.handlePointerDown();
    },
    [disableStoryTransition, longPress, clearClickSwallow, armClickSwallow],
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
          longPress.handlePointerCancel();
          const prevStory = stories[cursor.storyIndex - 1];
          const nextStory = stories[cursor.storyIndex + 1];
          cubeBeginDrag({
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
      const hasPrev = cursor.storyIndex > 0;
      const hasNext = cursor.storyIndex < stories.length - 1;
      // Δx → angle. Drag right (Δx > 0) → +angle (reveals prev, left wall).
      // Drag left (Δx < 0) → -angle (reveals next, right wall).
      let angle = (dx / swipe.width) * 90;
      if (angle > 0 && !hasPrev) angle = angle * 0.25;
      if (angle < 0 && !hasNext) angle = angle * 0.25;
      angle = Math.max(-90, Math.min(90, angle));
      cubeSetDragAngle(angle);
    },
    [longPress, stories, cursor.storyIndex, cubeBeginDrag, cubeSetDragAngle],
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
      const hasPrev = cursor.storyIndex > 0;
      const hasNext = cursor.storyIndex < stories.length - 1;

      let snap: "next" | "prev" | "back" = "back";
      if ((dx <= -commitDistance || velocity <= -commitVelocity) && hasNext) {
        snap = "next";
      } else if ((dx >= commitDistance || velocity >= commitVelocity) && hasPrev) {
        snap = "prev";
      }

      // Suppress the click that would fire on this pointerup (tap zones).
      armClickSwallow();
      try {
        e.currentTarget.releasePointerCapture(swipe.pointerId);
      } catch {
        // Already released — safe to ignore.
      }

      if (snap === "next") {
        cubeReleaseDrag({
          targetDeg: -90,
          onComplete: () => {
            setPendingDragCommit(true);
            goToNextStory();
          },
        });
      } else if (snap === "prev") {
        cubeReleaseDrag({
          targetDeg: 90,
          onComplete: () => {
            setPendingDragCommit(true);
            goToPrevStory();
          },
        });
      } else {
        cubeReleaseDrag({ targetDeg: 0 });
      }
    },
    [armClickSwallow, cubeReleaseDrag, cursor.storyIndex, goToNextStory, goToPrevStory, longPress, stories.length],
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
      if (!insideColumn && !insideToggle) {
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
  // Owner viewers list + link drawer: their open state lives here so the root
  // knows every open layer (pause, Escape, inert).
  const [ownerViewersOpen, setOwnerViewersOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
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
  const [prevChromeCursor, setPrevChromeCursor] = useState({
    storyIndex: cursor.storyIndex,
    itemIndex: cursor.itemIndex,
  });
  if (
    prevChromeCursor.storyIndex !== cursor.storyIndex ||
    prevChromeCursor.itemIndex !== cursor.itemIndex
  ) {
    setPrevChromeCursor({
      storyIndex: cursor.storyIndex,
      itemIndex: cursor.itemIndex,
    });
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
    }
  }
  // Mutual exclusion — opening one closes the other.
  const openCommentsPanel = useCallback(() => {
    setShareOpen(false);
    setCommentsOpen(true);
  }, []);
  const openSharePanel = useCallback(() => {
    setCommentsOpen(false);
    setShareOpen(true);
  }, []);

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

  // ─── layers (SV5 pause · SV6 Escape + containment) ─────────────────────
  // Every transient surface above the media. Effective open = state AND the
  // surface is actually mounted, so a stale flag can never wedge a pause.
  const isViewerMode = !!viewerMode && viewerMode === "viewer";
  const layerOpen: Record<LayerId, boolean> = {
    comments: isOpen && commentsOpen && isViewerMode && !disableComments,
    share: isOpen && shareOpen && isViewerMode && !disableSharePanel,
    kebab: isOpen && kebabOpen && kebabItems.length > 0,
    viewers: isOpen && ownerViewersOpen && ownerOverlayMounted && !renderOwnerOverlay,
    link: isOpen && linkOpen && !!currentItem?.link,
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
  const hasLayer = order.length > 0;
  const topLayer = order[order.length - 1];
  const modalLayerOpen = layerOpen.comments || layerOpen.share || layerOpen.kebab;

  const closeLayer = useCallback((id: LayerId) => {
    if (id === "comments") setCommentsOpen(false);
    else if (id === "share") setShareOpen(false);
    else if (id === "kebab") setKebabOpen(false);
    else if (id === "viewers") setOwnerViewersOpen(false);
    else setLinkOpen(false);
  }, []);

  // SV5 — remember whether the viewer was already paused when the FIRST layer
  // opened, pause, and restore exactly that when the LAST layer closes: closing
  // a layer never resumes a pause the host (`setPaused(true)`) or the user
  // (middle tap) set. A different item on close means the item-change reset
  // already ran — resume then, as that reset intends.
  const isPausedRef = useRef(isPaused);
  const itemKeyRef = useRef(itemKey);
  useLayoutEffect(() => {
    isPausedRef.current = isPaused;
    itemKeyRef.current = itemKey;
    nonModalLayerOpenRef.current = layerOpen.link || layerOpen.viewers;
  });
  useEffect(() => {
    if (!hasLayer) return;
    const restore = isPausedRef.current;
    const keyAtOpen = itemKeyRef.current;
    setPaused(true);
    return () => setPaused(itemKeyRef.current === keyAtOpen ? restore : false);
  }, [hasLayer, setPaused]);

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
    onTogglePause: () => setPaused((p) => !p),
  });

  // SV6 — containment: while a sheet or the kebab is open, everything else in
  // the dialog is `inert` so Tab cycles inside the layer (Radix FocusScope and
  // Base UI both skip inert). Closed sheets carry their own `inert`.
  const gestureRootRef = useRef<HTMLDivElement | null>(null);
  const layerSignature = order.join(",");
  useEffect(() => {
    if (!modalLayerOpen) return;
    const root = gestureRootRef.current?.parentElement;
    if (!root) return;
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
    const marked: Element[] = [];
    keep.forEach((node) => {
      const parent = node.parentElement;
      if (!parent) return;
      for (const sibling of Array.from(parent.children)) {
        if (keep.has(sibling) || sibling.hasAttribute("inert")) continue;
        if (sibling.classList.contains("sr-only")) continue;
        sibling.setAttribute("inert", "");
        marked.push(sibling);
      }
    });
    return () => marked.forEach((el) => el.removeAttribute("inert"));
  }, [modalLayerOpen, layerSignature]);

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
        className={cn(
          "relative h-full w-full bg-black touch-pan-y",
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
          >
            <StoryCubeFace
              story={autoLeavingStory}
              item={autoLeavingItem}
              itemIndex={autoLeavingItemIndex}
              progress={autoLeavingProgress}
              isMuted={isMuted}
              labels={labels}
            />
          </div>
        ) : null}
        {/* v0.4.1 drag-mode — Prev ghost on the LEFT wall (rotateY -90deg).
            Mounted during dragging + releasing so the user can swipe to
            either neighbor. */}
        {(cubeState.phase === "dragging" || cubeState.phase === "releasing") &&
        dragPrev ? (
          <div
            className="absolute inset-0 backface-hidden pointer-events-none"
            style={{ transform: "rotateY(-90deg) translateZ(50cqw)" }}
            aria-hidden="true"
          >
            <StoryCubeFace
              story={dragPrev.story}
              item={dragPrev.item}
              itemIndex={dragPrev.itemIndex}
              progress={dragPrev.progress}
              isMuted={isMuted}
              labels={labels}
            />
          </div>
        ) : null}
        {/* v0.4.1 drag-mode — Next ghost on the RIGHT wall (rotateY +90deg). */}
        {(cubeState.phase === "dragging" || cubeState.phase === "releasing") &&
        dragNext ? (
          <div
            className="absolute inset-0 backface-hidden pointer-events-none"
            style={{ transform: "rotateY(90deg) translateZ(50cqw)" }}
            aria-hidden="true"
          >
            <StoryCubeFace
              story={dragNext.story}
              item={dragNext.item}
              itemIndex={dragNext.itemIndex}
              progress={dragNext.progress}
              isMuted={isMuted}
              labels={labels}
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
                    autoDirection === "next"
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
        {renderProgress ? (
          renderProgress(currentStory.items, cursor.itemIndex, progress, slotHelpers)
        ) : !disableProgressBars ? (
          <ProgressBars
            items={currentStory.items}
            currentItemIndex={cursor.itemIndex}
            progress={progress}
            smooth={mediaDriven}
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
            onKebabClick={
              viewerMode && kebabItems.length > 0
                ? () => setKebabOpen(true)
                : undefined
            }
          />
        )}
        {/* v0.3.0 — scaling wrapper: when the comments or share panel is
            open, the entire visual stack (media + tap-zones + link CTA chip
            + engagement column + heart toggle + DM bar) shrinks toward the
            top with pointer-events disabled inside. Mirrors the Instagram
            bottom-sheet UX. */}
        <div
          className={cn(
            "absolute inset-0 origin-top transition-transform duration-300 ease-out",
            anyPanelOpen && "scale-[0.55] translate-y-[-18%] pointer-events-none",
          )}
        >
          <ItemView
            item={currentItem}
            story={currentStory}
            totalItems={currentStory.items.length}
            cursor={cursor}
            isPaused={isPaused}
            isMuted={isMuted}
            onLoadedMetadata={handleItemMetadata}
            onEnded={completeItem}
            onReady={handleItemReady}
            onTimeUpdate={handleVideoTimeUpdate}
            onVideoError={handleVideoError}
            mediaKey={itemKey}
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
              engagement overlay (sits above it) and the DM input (sits
              below it in viewer mode). Polymorphic root via `linkComponent`. */}
          {currentItem.link ? (
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
                story={currentStory!}
                item={currentItem!}
                actions={engagementActions}
                labels={labels}
                expanded={engagementExpanded}
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
                onSetPaused={(p) => setPaused(p)}
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
                "absolute end-3 bottom-3 z-32 flex h-9 w-9 items-center justify-center rounded-full text-white pointer-events-auto",
                "transition-colors hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
              )}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  engagementExpanded && "scale-110 fill-current text-rose-400",
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
            className="absolute inset-0 z-35 bg-black/40 transition-opacity duration-300"
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
