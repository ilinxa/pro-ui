"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {
  Story,
  StoryItem,
  StoryItemUnavailableReason,
  StoryItemViewedCause,
  StoryItemViewedInfo,
  StoryViewerDelta,
  StoryViewerLocalAction,
  StoryViewerPendingRemoval,
  Subscribe,
} from "../types";

// ─── Pure helpers ────────────────────────────────────────────────────────────

function insertStoryAtPosition(
  state: Story[],
  story: Story,
  position: "start" | "end" | undefined,
): Story[] {
  if (position === "start") return [story, ...state];
  return [...state, story]; // default "end" — cursor-stable for ID-anchored cursor
}

function removeStoryById(state: Story[], id: string): Story[] {
  const next = state.filter((s) => s.id !== id);
  return next.length === state.length ? state : next;
}

function patchStoryById(
  state: Story[],
  id: string,
  patch: Partial<Story>,
): Story[] {
  let mutated = false;
  const next = state.map((s) => {
    if (s.id !== id) return s;
    mutated = true;
    return { ...s, ...patch };
  });
  return mutated ? next : state;
}

function addItemToStory(
  state: Story[],
  storyId: string,
  item: StoryItem,
  position: "start" | "end" | undefined,
): Story[] {
  let mutated = false;
  const next = state.map((s) => {
    if (s.id !== storyId) return s;
    mutated = true;
    const items = position === "start" ? [item, ...s.items] : [...s.items, item];
    return { ...s, items };
  });
  return mutated ? next : state;
}

function removeItemFromStory(
  state: Story[],
  storyId: string,
  itemId: string,
): Story[] {
  let mutated = false;
  const next = state.map((s) => {
    if (s.id !== storyId) return s;
    const items = s.items.filter((i) => i.id !== itemId);
    if (items.length === s.items.length) return s;
    mutated = true;
    return { ...s, items };
  });
  return mutated ? next : state;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

/** Pure reducer — exported for hosts driving their own state. */
export function storyViewerReducer(
  state: Story[],
  action: StoryViewerLocalAction,
): Story[] {
  switch (action.kind) {
    case "add-story":
      return insertStoryAtPosition(state, action.story, action.position);
    case "remove-story":
      return removeStoryById(state, action.storyId);
    case "add-item":
      return addItemToStory(state, action.storyId, action.item, action.position);
    case "remove-item":
      return removeItemFromStory(state, action.storyId, action.itemId);
    case "patch-story":
      return patchStoryById(state, action.storyId, action.partial);
    case "subscribe-delta": {
      const d = action.delta;
      switch (d.kind) {
        case "story-added":
          return insertStoryAtPosition(state, d.story, d.position);
        case "story-removed":
          return removeStoryById(state, d.storyId);
        case "item-added":
          return addItemToStory(state, d.storyId, d.item, d.position);
        case "item-removed":
          return removeItemFromStory(state, d.storyId, d.itemId);
        case "story-viewed":
          return patchStoryById(state, d.storyId, { hasUnread: false });
      }
      return state;
    }
    case "reset":
      return action.next;
  }
}

// ─── Internal cursor (ID-anchored) ──────────────────────────────────────────

interface CursorIds {
  storyId: string;
  itemId: string;
}

/** Last known valid cursor position — lets removal resolve "the next one". */
interface LastPosition {
  storyId: string;
  storyIndex: number;
  itemIndex: number;
}

/** Last on-screen story/item snapshot — the frame a removal notice keeps. */
interface LastValid {
  storyId: string;
  itemId: string;
  story: Story;
  item: StoryItem;
}

/**
 * Resolve a cursor that may name a removed (or never-seen) story/item.
 *
 * Returns the cursor unchanged when it is valid. Otherwise picks, in order:
 * the next item of the same group, the first item of the next group, then
 * (nothing after) the nearest earlier item. Returns `null` when no item exists
 * anywhere (empty list / every group empty).
 */
function resolveCursor(
  stories: Story[],
  ids: CursorIds,
  last: LastPosition,
): CursorIds | null {
  const sIdx = stories.findIndex((s) => s.id === ids.storyId);
  // A repair is a sequential move, so it skips groups the host muted (the same
  // rule as `findAdjacentStoryIndex`). Not before the first real cursor (`""`):
  // that is the first data arrival, which may legitimately land on a muted group.
  const skipMuted = ids.storyId !== "";
  const firstOf = (from: number): CursorIds | null => {
    for (let k = Math.max(0, from); k < stories.length; k++) {
      if (skipMuted && stories[k].muted) continue;
      const first = stories[k].items[0];
      if (first) return { storyId: stories[k].id, itemId: first.id };
    }
    return null;
  };
  const lastBefore = (from: number): CursorIds | null => {
    for (let k = Math.min(from, stories.length - 1); k >= 0; k--) {
      if (skipMuted && stories[k].muted) continue;
      const items = stories[k].items;
      const tail = items[items.length - 1];
      if (tail) return { storyId: stories[k].id, itemId: tail.id };
    }
    return null;
  };
  if (sIdx >= 0) {
    const story = stories[sIdx];
    if (story.items.some((i) => i.id === ids.itemId)) return ids;
    // Item gone (removed, or group opened empty and just received items).
    const at = last.storyId === ids.storyId ? last.itemIndex : 0;
    const next = story.items[at];
    if (next) return { storyId: story.id, itemId: next.id };
    return firstOf(sIdx + 1) ?? lastBefore(sIdx);
  }
  // Group gone (removed, reset away, or never existed): the group that now sits
  // at its old index is "the next group".
  return firstOf(last.storyIndex) ?? lastBefore(last.storyIndex - 1);
}

/**
 * Index of the nearest group from `from` in `dir` (1 forward, -1 backward) that
 * the host has not muted, or -1. Every sequential move uses this; direct opens
 * (`initialStoryIndex`, `goToStoryIndex`) do not.
 */
export function findAdjacentStoryIndex(
  stories: Story[],
  from: number,
  dir: 1 | -1,
): number {
  for (let k = from + dir; k >= 0 && k < stories.length; k += dir) {
    if (!stories[k].muted) return k;
  }
  return -1;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseStoryViewerStateOptions {
  /**
   * Uncontrolled: captured ON MOUNT only — subsequent changes are ignored.
   * Controlled (`onStoriesChange` passed): the live list, read on every render.
   */
  initialStories: Story[];
  /** Re-seeds cursor whenever (initialStoryIndex, isOpen) pair changes. */
  initialStoryIndex: number;
  /** 0.7.0 - item of the opening story to start on (clamped; default 0). Read with `initialStoryIndex`. */
  initialItemIndex?: number;
  /** Re-seeds cursor whenever (initialStoryIndex, isOpen) pair changes. */
  isOpen: boolean;

  subscribe?: Subscribe<StoryViewerDelta>;
  onSubscribeDelta?: (delta: StoryViewerDelta) => void;

  onStoryViewed?: (storyId: string) => void;
  onItemViewed?: (
    storyId: string,
    itemId: string,
    itemIndex: number,
    cause: StoryItemViewedCause,
    info: StoryItemViewedInfo,
  ) => void;
  onCursorChange?: (storyIndex: number, itemIndex: number) => void;
  onAutoCloseAtEnd?: (storyId: string, itemId: string) => void;
  onClose: () => void;
  /**
   * v0.2.0 — when true, the auto-close at end of the last story fires
   * `onAutoCloseAtEnd` but DOES NOT call `onClose()`. The viewer stays
   * open at the last item. Default false. Mirrors the `disableAutoClose`
   * opt-out on StoryViewerProps.
   */
  disableAutoClose?: boolean;
  /**
   * 0.6.0 — controlled `stories`: when passed, `initialStories` wins on every
   * render and local mutations are reported here instead of being applied.
   */
  onStoriesChange?: (next: Story[], change: StoryViewerLocalAction) => void;
  /** 0.6.0 — fires once (`"removed"`) when the on-screen item leaves `stories`. */
  onItemUnavailable?: (
    storyId: string,
    itemId: string,
    reason: StoryItemUnavailableReason,
  ) => void;
  /** 0.6.0 — removal notice duration in ms (default 1500; 0 = repair at once). */
  unavailableNoticeMs?: number;
  /** 0.6.0 — opened from a link: a single-item story's notice stays until close. */
  standalone?: boolean;
  /** 0.6.0 — controlled pause reasons (wins every render when defined). */
  pauseReasons?: string[];
  /** 0.6.0 — reports every reason change. */
  onPauseReasonsChange?: (next: string[]) => void;
}

export interface UseStoryViewerStateResult {
  stories: Story[];
  /** Public derived cursor (indices for caller; IDs are internal). */
  cursor: { storyIndex: number; itemIndex: number };
  /** True while any pause reason is active (or a removal notice is held). */
  isPaused: boolean;
  isMuted: boolean;
  /**
   * `true` adds the `host` reason, `false` removes `host` + `user`. The
   * functional form (`p => !p`) is the user toggle: it adds / removes `user`.
   */
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setMuted: React.Dispatch<React.SetStateAction<boolean>>;
  goToPrevItem: () => void;
  /**
   * Advance one item. `cause` is what `onItemViewed` reports for the item left:
   * `"completed"` only when it played to the end (progress completion / video
   * ended); anything else (taps, keys, screen-reader next, handle) is `"left"`,
   * which is the default. Any non-`"completed"` argument (e.g. a click event
   * passed straight through as a handler) is treated as `"left"`.
   */
  goToNextItem: (cause?: StoryItemViewedCause) => void;
  goToPrevStory: () => void;
  goToNextStory: () => void;
  goToStoryIndex: (index: number) => void;
  goToItemIndex: (index: number) => void;
  reset: (next: Story[]) => void;
  dispatch: React.Dispatch<StoryViewerLocalAction>;
  /**
   * Bumps each time the cursor was repaired because its story/item vanished
   * (removal / reset / first data arrival). Lets the shell skip the cube
   * animation for that snap.
   */
  snapCount: number;
  /** 0.6.0 — the active pause reasons (controlled list, or the internal one). */
  pauseReasons: string[];
  /** 0.6.0 — add a pause reason (no-op when present). Identity-stable. */
  addPauseReason: (reason: string) => void;
  /** 0.6.0 — remove pause reasons (no-op when absent). Identity-stable. */
  removePauseReason: (...reasons: string[]) => void;
  /** 0.6.0 — set while the removed on-screen item's notice frame is held. */
  pendingRemoval: StoryViewerPendingRemoval | null;
}

export function useStoryViewerState(
  opts: UseStoryViewerStateOptions,
): UseStoryViewerStateResult {
  const {
    initialStories,
    initialStoryIndex,
    initialItemIndex = 0,
    isOpen,
    subscribe,
    onSubscribeDelta,
    onStoryViewed,
    onItemViewed,
    onCursorChange,
    onAutoCloseAtEnd,
    onClose,
    disableAutoClose = false,
    onStoriesChange,
    onItemUnavailable,
    unavailableNoticeMs = 1500,
    standalone = false,
    pauseReasons: pauseReasonsProp,
    onPauseReasonsChange,
  } = opts;
  const disableAutoCloseRef = useRef(disableAutoClose);
  useEffect(() => {
    disableAutoCloseRef.current = disableAutoClose;
  });

  // ─── Stories: uncontrolled reducer, or the controlled prop ──────────────
  const storiesControlled = onStoriesChange !== undefined;
  const [localStories, localDispatch] = useReducer(
    storyViewerReducer,
    initialStories,
  );
  const stories = storiesControlled ? initialStories : localStories;

  const initialStoriesRef = useRef(stories);
  useEffect(() => {
    initialStoriesRef.current = stories;
  });

  // Refs-mirror for callbacks so effect deps stay narrow.
  const onSubscribeDeltaRef = useRef(onSubscribeDelta);
  const onStoryViewedRef = useRef(onStoryViewed);
  const onItemViewedRef = useRef(onItemViewed);
  const onCursorChangeRef = useRef(onCursorChange);
  const onAutoCloseAtEndRef = useRef(onAutoCloseAtEnd);
  const onCloseRef = useRef(onClose);
  const onStoriesChangeRef = useRef(onStoriesChange);
  const onItemUnavailableRef = useRef(onItemUnavailable);
  const onPauseReasonsChangeRef = useRef(onPauseReasonsChange);
  useEffect(() => {
    onSubscribeDeltaRef.current = onSubscribeDelta;
    onStoryViewedRef.current = onStoryViewed;
    onItemViewedRef.current = onItemViewed;
    onCursorChangeRef.current = onCursorChange;
    onAutoCloseAtEndRef.current = onAutoCloseAtEnd;
    onCloseRef.current = onClose;
    onStoriesChangeRef.current = onStoriesChange;
    onItemUnavailableRef.current = onItemUnavailable;
    onPauseReasonsChangeRef.current = onPauseReasonsChange;
  });

  // Latest list the controlled prop holds. A mutation computes from it, reports
  // `next`, and keeps `next` as the base for further mutations in the same task
  // (several dispatches before the host re-renders); a microtask drops back to
  // the prop so a change the host rejects can't leak into later ones.
  const propStoriesRef = useRef(stories);
  const storiesBaseRef = useRef(stories);
  useLayoutEffect(() => {
    propStoriesRef.current = stories;
    storiesBaseRef.current = stories;
  });
  const dispatch = useCallback((action: StoryViewerLocalAction) => {
    const report = onStoriesChangeRef.current;
    if (!report) {
      localDispatch(action);
      return;
    }
    const base = storiesBaseRef.current;
    const next = storyViewerReducer(base, action);
    if (next === base) return;
    storiesBaseRef.current = next;
    queueMicrotask(() => {
      storiesBaseRef.current = propStoriesRef.current;
    });
    report(next, action);
  }, []);

  // Subscribe wiring (mount-scoped; identity-stable per host convention).
  useEffect(() => {
    if (!subscribe) return;
    const unsub = subscribe((delta) => {
      onSubscribeDeltaRef.current?.(delta);
      dispatch({ kind: "subscribe-delta", delta });
    });
    return unsub;
  }, [subscribe, dispatch]);

  // ─── Pause reasons ────────────────────────────────────────────────────────
  const reasonsControlled = pauseReasonsProp !== undefined;
  const reasonsControlledRef = useRef(reasonsControlled);
  const [localReasons, setLocalReasons] = useState<string[]>([]);
  const reasons = reasonsControlled ? pauseReasonsProp : localReasons;
  const propReasonsRef = useRef(reasons);
  const reasonsBaseRef = useRef(reasons);
  useLayoutEffect(() => {
    reasonsControlledRef.current = reasonsControlled;
    propReasonsRef.current = reasons;
    reasonsBaseRef.current = reasons;
  });
  const commitReasons = useCallback((next: string[]) => {
    reasonsBaseRef.current = next;
    if (reasonsControlledRef.current) {
      queueMicrotask(() => {
        reasonsBaseRef.current = propReasonsRef.current;
      });
    } else {
      setLocalReasons(next);
    }
    onPauseReasonsChangeRef.current?.(next);
  }, []);
  const addPauseReason = useCallback(
    (reason: string) => {
      const cur = reasonsBaseRef.current;
      if (cur.includes(reason)) return;
      commitReasons([...cur, reason]);
    },
    [commitReasons],
  );
  const removePauseReason = useCallback(
    (...drop: string[]) => {
      const cur = reasonsBaseRef.current;
      const next = cur.filter((r) => !drop.includes(r));
      if (next.length === cur.length) return;
      commitReasons(next);
    },
    [commitReasons],
  );

  // ─── Cursor state (ID-anchored) ───────────────────────────────────────────
  // Lazy initializer — runs once at mount, derived from props.
  const seedCursor = (list: Story[]): CursorIds | null => {
    const idx = Math.max(0, Math.min(initialStoryIndex, list.length - 1));
    const story = list[idx];
    if (!story) return null;
    const iIdx = Math.max(0, Math.min(Math.trunc(initialItemIndex) || 0, story.items.length - 1));
    return { storyId: story.id, itemId: story.items[iIdx]?.id ?? "" };
  };
  const [cursorIdsState, setCursorIds] = useState<CursorIds>(
    () => seedCursor(initialStories) ?? { storyId: "", itemId: "" },
  );
  // 0.7.0 (A1) - re-seed the cursor when the viewer opens or `initialStoryIndex` changes, DURING
  // render: the render with the stale cursor is discarded (it never commits), so no other item is
  // rendered or handed to `resolveMedia` first - also on a reopen. A seed needs a story: opened on an
  // empty list, the seed waits (the key stays unmatched) and lands with the first data.
  const seedKey = isOpen ? `${initialStoryIndex}` : "";
  const [prevSeedKey, setPrevSeedKey] = useState(() =>
    seedCursor(initialStories) ? seedKey : "",
  );
  let cursorIds = cursorIdsState;
  if (prevSeedKey !== seedKey) {
    const seeded = isOpen ? seedCursor(stories) : null;
    if (seeded || !isOpen) setPrevSeedKey(seedKey);
    if (seeded) {
      setCursorIds(seeded);
      cursorIds = seeded;
    }
  }

  // Repair a cursor that names a removed id (render-time setState — the
  // discarded pass never commits, so there is no flash of the stale cursor).
  const [lastPos, setLastPos] = useState<LastPosition>({
    storyId: cursorIds.storyId,
    storyIndex: 0,
    itemIndex: 0,
  });
  const [lastValid, setLastValid] = useState<LastValid | null>(() => {
    const story = initialStories.find((s) => s.id === cursorIds.storyId);
    const item = story?.items.find((i) => i.id === cursorIds.itemId);
    return story && item
      ? { storyId: story.id, itemId: item.id, story, item }
      : null;
  });
  const [snapCount, setSnapCount] = useState(0);
  const resolved = resolveCursor(stories, cursorIds, lastPos);
  const cursorInvalid =
    resolved === null
      ? cursorIds.storyId !== ""
      : resolved.storyId !== cursorIds.storyId ||
        resolved.itemId !== cursorIds.itemId;

  // ─── Removal notice ───────────────────────────────────────────────────────
  // The on-screen item vanished (controlled prop, dispatch, reset, subscribe):
  // hold a notice frame for `unavailableNoticeMs`, then repair. `0` repairs now.
  const removalCandidate =
    cursorInvalid &&
    isOpen &&
    !!lastValid &&
    lastValid.storyId === cursorIds.storyId &&
    lastValid.itemId === cursorIds.itemId;
  const removalKey = `${cursorIds.storyId}:${cursorIds.itemId}`;
  const stayUntilClosed = standalone && lastValid?.story.items.length === 1;
  const [releasedKey, setReleasedKey] = useState("");
  const holding =
    removalCandidate && unavailableNoticeMs > 0 && releasedKey !== removalKey;
  // One event per removal, recorded at first sight and fired from an effect
  // (render may be discarded). `episode` guards against recording twice.
  const [removalEvent, setRemovalEvent] = useState<CursorIds | null>(null);
  const [episode, setEpisode] = useState(false);
  // The host reacted to `onItemUnavailable(…, "resolve" | "media" | "timeout")` by removing
  // that very item: its notice is already on screen (the media pipeline holds the
  // `unavailable` reason). The removal is then the same notice, not a second one.
  const [alreadyNoticed, setAlreadyNoticed] = useState(false);
  if (removalCandidate && !episode) {
    setEpisode(true);
    if (reasons.includes("unavailable")) setAlreadyNoticed(true);
    else setRemovalEvent({ storyId: cursorIds.storyId, itemId: cursorIds.itemId });
  } else if (!cursorInvalid && episode) {
    setEpisode(false);
    setAlreadyNoticed(false);
  }
  if (!cursorInvalid && releasedKey !== "") setReleasedKey("");
  useEffect(() => {
    if (!removalEvent) return;
    onItemUnavailableRef.current?.(
      removalEvent.storyId,
      removalEvent.itemId,
      "removed",
    );
  }, [removalEvent]);
  // When the media notice was already showing, only what is left of it is held. 0.7.0 (A8): the
  // time it already ran counts only while no OTHER pause reason held (`elapsed` + the running
  // segment `since`), so a pause before the hand-over never shortens the removal notice.
  const noticeClockRef = useRef<{ since: number | null; elapsed: number }>({ since: null, elapsed: 0 });
  // 0.6.2 - the notice counts down only while no OTHER pause reason holds (the notice's own
  // reason is `unavailable`); the remaining time carries across the pause.
  const otherHolds = reasons.some((r) => r !== "unavailable");
  const removalLeftRef = useRef<{ key: string; ms: number } | null>(null);
  useEffect(() => {
    if (!holding || stayUntilClosed) {
      removalLeftRef.current = null;
      return;
    }
    if (removalLeftRef.current?.key !== removalKey) {
      let ms = unavailableNoticeMs;
      if (alreadyNoticed) {
        const clock = noticeClockRef.current;
        const used = clock.elapsed + (clock.since === null ? 0 : Date.now() - clock.since);
        ms = Math.max(0, ms - used);
      }
      removalLeftRef.current = { key: removalKey, ms };
    }
    if (otherHolds) return;
    const left = removalLeftRef.current;
    const startedAt = Date.now();
    const t = window.setTimeout(() => setReleasedKey(removalKey), left.ms);
    return () => {
      window.clearTimeout(t);
      left.ms = Math.max(0, left.ms - (Date.now() - startedAt));
    };
  }, [holding, stayUntilClosed, removalKey, unavailableNoticeMs, alreadyNoticed, otherHolds]);

  if (!holding && cursorInvalid && resolved) {
    setCursorIds(resolved);
    setSnapCount((c) => c + 1);
  }
  const ids = holding ? cursorIds : (resolved ?? cursorIds);

  // Remember the last valid on-screen story/item (identity-compared so it
  // converges): the notice frame is built from it once the item is gone.
  if (!cursorInvalid && resolved) {
    const story = stories.find((s) => s.id === resolved.storyId);
    const item = story?.items.find((i) => i.id === resolved.itemId);
    if (
      story &&
      item &&
      (lastValid?.story !== story || lastValid?.item !== item)
    ) {
      setLastValid({ storyId: story.id, itemId: item.id, story, item });
    }
  }

  // Derive indices from IDs.
  const cursor = useMemo(() => {
    if (holding) {
      return { storyIndex: lastPos.storyIndex, itemIndex: lastPos.itemIndex };
    }
    const storyIndex = Math.max(0, stories.findIndex((s) => s.id === ids.storyId));
    const story = stories[storyIndex];
    const itemIndex = story
      ? Math.max(0, story.items.findIndex((i) => i.id === ids.itemId))
      : 0;
    return { storyIndex, itemIndex };
  }, [stories, ids.storyId, ids.itemId, holding, lastPos.storyIndex, lastPos.itemIndex]);

  if (
    !holding &&
    resolved &&
    (lastPos.storyId !== resolved.storyId ||
      lastPos.storyIndex !== cursor.storyIndex ||
      lastPos.itemIndex !== cursor.itemIndex)
  ) {
    setLastPos({
      storyId: resolved.storyId,
      storyIndex: cursor.storyIndex,
      itemIndex: cursor.itemIndex,
    });
  }

  const pendingRemoval = useMemo<StoryViewerPendingRemoval | null>(
    () =>
      holding && lastValid
        ? {
            storyId: cursorIds.storyId,
            itemId: cursorIds.itemId,
            reason: "removed",
            story: lastValid.story,
            item: lastValid.item,
            stayUntilClosed,
          }
        : null,
    [holding, lastValid, cursorIds.storyId, cursorIds.itemId, stayUntilClosed],
  );
  const hasPendingRemoval = pendingRemoval !== null;
  useLayoutEffect(() => {
    if (hasPendingRemoval) return;
    const clock = noticeClockRef.current;
    if (!reasons.includes("unavailable")) {
      clock.since = null;
      clock.elapsed = 0;
      return;
    }
    if (otherHolds) {
      if (clock.since !== null) {
        clock.elapsed += Date.now() - clock.since;
        clock.since = null;
      }
    } else if (clock.since === null) {
      clock.since = Date.now();
    }
  });
  useLayoutEffect(() => {
    if (hasPendingRemoval) addPauseReason("unavailable");
    else removePauseReason("unavailable");
  }, [hasPendingRemoval, addPauseReason, removePauseReason]);

  // Every group/item was removed while the viewer is open — nothing left to
  // show, so close (once per transition into the empty state), after the notice.
  const removedAll = resolved === null && cursorIds.storyId !== "" && !holding;
  useEffect(() => {
    if (removedAll && isOpen) onCloseRef.current();
  }, [removedAll, isOpen]);

  // Fire onCursorChange whenever derived indices change.
  const lastCursorRef = useRef(cursor);
  useEffect(() => {
    const last = lastCursorRef.current;
    if (last.storyIndex !== cursor.storyIndex || last.itemIndex !== cursor.itemIndex) {
      lastCursorRef.current = cursor;
      onCursorChangeRef.current?.(cursor.storyIndex, cursor.itemIndex);
    }
  }, [cursor]);

  // ─── Pause / mute ────────────────────────────────────────────────────────
  const [isMuted, setMuted] = useState(true);
  const isPaused = reasons.length > 0 || hasPendingRemoval;
  const isPausedRef = useRef(isPaused);
  useLayoutEffect(() => {
    isPausedRef.current = isPaused;
  });
  const setPaused = useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    (value) => {
      const functional = typeof value === "function";
      const next = functional ? value(isPausedRef.current) : value;
      if (next) addPauseReason(functional ? "user" : "host");
      else removePauseReason("host", "user");
    },
    [addPauseReason, removePauseReason],
  );

  // `user` (middle tap / Space) is per item: it clears on item change and when
  // the viewer closes. `host` survives item changes but not a close (a reopen must not
  // start silently paused); a `setPaused(true)` made while closed still holds,
  // because it clears on the close TRANSITION, not on open. `hold` can't outlive a closed viewer.
  const itemKey = `${ids.storyId}:${ids.itemId}`;
  const prevItemKeyRef = useRef(itemKey);
  useLayoutEffect(() => {
    if (prevItemKeyRef.current === itemKey) return;
    prevItemKeyRef.current = itemKey;
    removePauseReason("user");
  }, [itemKey, removePauseReason]);
  useLayoutEffect(() => {
    if (!isOpen) removePauseReason("user", "hold", "host");
  }, [isOpen, removePauseReason]);

  // A backgrounded tab pauses; coming back resumes (unless something else holds).
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    const sync = () => {
      if (document.visibilityState === "hidden") addPauseReason("hidden-tab");
      else removePauseReason("hidden-tab");
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      removePauseReason("hidden-tab");
    };
  }, [isOpen, addPauseReason, removePauseReason]);

  // ─── onItemViewed: once per item visit, with a direction (0.7.0, A2) ─────────
  // A visit starts when the item becomes current (or the viewer opens) and ends when the cursor
  // leaves it. `viewedKeyRef` holds the item already reported in this visit, so the several paths
  // that can end it (a play-through, then the auto-close, then `isOpen` -> false) report it once.
  const viewedKeyRef = useRef("");
  const visitKey = `${cursorIds.storyId}:${cursorIds.itemId}`;
  useLayoutEffect(() => {
    if (isOpen) viewedKeyRef.current = "";
  }, [isOpen, visitKey]);
  const fireViewed = useCallback(
    (
      story: Story,
      iIdx: number,
      cause: StoryItemViewedCause,
      direction: StoryItemViewedInfo["direction"],
    ) => {
      const item = story.items[iIdx];
      if (!item) return;
      const key = `${story.id}:${item.id}`;
      if (viewedKeyRef.current === key) return;
      viewedKeyRef.current = key;
      onItemViewedRef.current?.(story.id, item.id, iIdx, cause, { direction });
    },
    [],
  );
  // Closing the viewer on an item (close button, Escape, backdrop, `isOpen` false) leaves it.
  const prevOpenRef = useRef(isOpen);
  useLayoutEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = isOpen;
    if (!wasOpen || isOpen) return;
    const story = initialStoriesRef.current.find((s) => s.id === cursorIds.storyId);
    if (!story) return;
    fireViewed(
      story,
      story.items.findIndex((i) => i.id === cursorIds.itemId),
      "left",
      "close",
    );
  }, [isOpen, cursorIds, fireViewed]);

  // ─── Navigation helpers ──────────────────────────────────────────────────
  // While a removal notice is held, any navigation just ends the notice early
  // (it repairs to the next item) — unless it must stay until the viewer closes.
  const releaseNotice = useCallback(() => {
    if (stayUntilClosed) return;
    setReleasedKey(removalKey);
  }, [stayUntilClosed, removalKey]);

  const goToPrevItem = useCallback(() => {
    if (holding) {
      releaseNotice();
      return;
    }
    const snap = initialStoriesRef.current;
    const sIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    if (sIdx < 0) return;
    const story = snap[sIdx];
    const iIdx = story.items.findIndex((i) => i.id === cursorIds.itemId);
    if (iIdx > 0) {
      fireViewed(story, iIdx, "left", "backward");
      setCursorIds({ storyId: story.id, itemId: story.items[iIdx - 1].id });
      return;
    }
    const pIdx = findAdjacentStoryIndex(snap, sIdx, -1);
    if (pIdx >= 0) {
      const prevStory = snap[pIdx];
      const lastItem = prevStory.items[prevStory.items.length - 1];
      if (lastItem) {
        fireViewed(story, iIdx, "left", "backward");
        setCursorIds({ storyId: prevStory.id, itemId: lastItem.id });
      }
    }
    // else: at the very start; no-op.
  }, [cursorIds, holding, releaseNotice, fireViewed]);

  const goToNextItem = useCallback((cause?: StoryItemViewedCause) => {
    const viewedCause: StoryItemViewedCause = cause === "completed" ? "completed" : "left";
    if (holding) {
      releaseNotice();
      return;
    }
    const snap = initialStoriesRef.current;
    const sIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    if (sIdx < 0) return;
    const story = snap[sIdx];
    const iIdx = story.items.findIndex((i) => i.id === cursorIds.itemId);
    fireViewed(story, iIdx, viewedCause, "forward");
    if (iIdx < story.items.length - 1) {
      setCursorIds({ storyId: story.id, itemId: story.items[iIdx + 1].id });
      return;
    }
    // At last item — advance to the next un-muted story (forward).
    onStoryViewedRef.current?.(story.id);
    const nIdx = findAdjacentStoryIndex(snap, sIdx, 1);
    if (nIdx >= 0) {
      const nextStory = snap[nIdx];
      const firstItem = nextStory.items[0];
      if (firstItem) {
        setCursorIds({ storyId: nextStory.id, itemId: firstItem.id });
        return;
      }
    }
    // No next story — auto-close (gated by disableAutoClose per v0.2.0).
    onAutoCloseAtEndRef.current?.(story.id, cursorIds.itemId);
    if (!disableAutoCloseRef.current) onCloseRef.current();
  }, [cursorIds, holding, releaseNotice, fireViewed]);

  const goToPrevStory = useCallback(() => {
    if (holding) {
      releaseNotice();
      return;
    }
    const snap = initialStoriesRef.current;
    const sIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    if (sIdx <= 0) return;
    const pIdx = findAdjacentStoryIndex(snap, sIdx, -1);
    if (pIdx < 0) return;
    const prevStory = snap[pIdx];
    const firstItem = prevStory.items[0];
    if (firstItem) {
      const story = snap[sIdx];
      fireViewed(story, story.items.findIndex((i) => i.id === cursorIds.itemId), "left", "backward");
      // Backward — does NOT fire onStoryViewed.
      setCursorIds({ storyId: prevStory.id, itemId: firstItem.id });
    }
  }, [cursorIds, holding, releaseNotice, fireViewed]);

  const goToNextStory = useCallback(() => {
    if (holding) {
      releaseNotice();
      return;
    }
    const snap = initialStoriesRef.current;
    const sIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    if (sIdx < 0) return;
    const story = snap[sIdx];
    const nIdx = findAdjacentStoryIndex(snap, sIdx, 1);
    const nextStory = nIdx >= 0 ? snap[nIdx] : undefined;
    const firstItem = nextStory?.items[0];
    const iIdx = story.items.findIndex((i) => i.id === cursorIds.itemId);
    if (nextStory && firstItem) {
      fireViewed(story, iIdx, "left", "forward");
      onStoryViewedRef.current?.(story.id);
      setCursorIds({ storyId: nextStory.id, itemId: firstItem.id });
      return;
    }
    fireViewed(story, iIdx, "left", "forward");
    onStoryViewedRef.current?.(story.id);
    onAutoCloseAtEndRef.current?.(story.id, cursorIds.itemId);
    if (!disableAutoCloseRef.current) onCloseRef.current();
  }, [cursorIds, holding, releaseNotice, fireViewed]);

  const goToStoryIndex = useCallback((index: number) => {
    const snap = initialStoriesRef.current;
    const sIdx = Math.max(0, Math.min(index, snap.length - 1));
    const target = snap[sIdx];
    if (!target) return;
    const currentSIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    if (currentSIdx >= 0) {
      const current = snap[currentSIdx];
      const cIdx = current.items.findIndex((i) => i.id === cursorIds.itemId);
      // Direction by where the cursor goes (the target story opens on its first item); no event
      // when it lands where it already is.
      if (sIdx !== currentSIdx || cIdx > 0) {
        fireViewed(current, cIdx, "left", sIdx > currentSIdx ? "forward" : "backward");
      }
    }
    // Forward jump — fire onStoryViewed for the leaving story.
    if (sIdx > currentSIdx && currentSIdx >= 0) {
      onStoryViewedRef.current?.(snap[currentSIdx].id);
    }
    setCursorIds({
      storyId: target.id,
      itemId: target.items[0]?.id ?? "",
    });
  }, [cursorIds, fireViewed]);

  const goToItemIndex = useCallback((index: number) => {
    const snap = initialStoriesRef.current;
    const sIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    if (sIdx < 0) return;
    const story = snap[sIdx];
    const iIdx = Math.max(0, Math.min(index, story.items.length - 1));
    const item = story.items[iIdx];
    if (!item) return;
    const cIdx = story.items.findIndex((i) => i.id === cursorIds.itemId);
    if (cIdx >= 0 && cIdx !== iIdx) {
      fireViewed(story, cIdx, "left", iIdx > cIdx ? "forward" : "backward");
    }
    setCursorIds({ storyId: story.id, itemId: item.id });
  }, [cursorIds, fireViewed]);

  const reset = useCallback(
    (next: Story[]) => {
      dispatch({ kind: "reset", next });
    },
    [dispatch],
  );

  return {
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
    pauseReasons: reasons,
    addPauseReason,
    removePauseReason,
    pendingRemoval,
  };
}
