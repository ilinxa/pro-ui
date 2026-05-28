"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {
  Story,
  StoryItem,
  StoryViewerDelta,
  StoryViewerLocalAction,
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

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseStoryViewerStateOptions {
  /** Captured ON MOUNT only — subsequent prop changes are ignored. */
  initialStories: Story[];
  /** Re-seeds cursor whenever (initialStoryIndex, isOpen) pair changes. */
  initialStoryIndex: number;
  /** Re-seeds cursor whenever (initialStoryIndex, isOpen) pair changes. */
  isOpen: boolean;

  subscribe?: Subscribe<StoryViewerDelta>;
  onSubscribeDelta?: (delta: StoryViewerDelta) => void;

  onStoryViewed?: (storyId: string) => void;
  onItemViewed?: (storyId: string, itemId: string, itemIndex: number) => void;
  onCursorChange?: (storyIndex: number, itemIndex: number) => void;
  onAutoCloseAtEnd?: () => void;
  onClose: () => void;
  /**
   * v0.2.0 — when true, the auto-close at end of the last story fires
   * `onAutoCloseAtEnd` but DOES NOT call `onClose()`. The viewer stays
   * open at the last item. Default false. Mirrors the `disableAutoClose`
   * opt-out on StoryViewer01Props.
   */
  disableAutoClose?: boolean;
}

export interface UseStoryViewerStateResult {
  stories: Story[];
  /** Public derived cursor (indices for caller; IDs are internal). */
  cursor: { storyIndex: number; itemIndex: number };
  isPaused: boolean;
  isMuted: boolean;
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setMuted: React.Dispatch<React.SetStateAction<boolean>>;
  goToPrevItem: () => void;
  goToNextItem: () => void;
  goToPrevStory: () => void;
  goToNextStory: () => void;
  goToStoryIndex: (index: number) => void;
  goToItemIndex: (index: number) => void;
  reset: (next: Story[]) => void;
  dispatch: React.Dispatch<StoryViewerLocalAction>;
}

export function useStoryViewerState(
  opts: UseStoryViewerStateOptions,
): UseStoryViewerStateResult {
  const {
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
    disableAutoClose = false,
  } = opts;
  const disableAutoCloseRef = useRef(disableAutoClose);
  useEffect(() => {
    disableAutoCloseRef.current = disableAutoClose;
  });

  const [stories, dispatch] = useReducer(storyViewerReducer, initialStories);

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
  useEffect(() => {
    onSubscribeDeltaRef.current = onSubscribeDelta;
    onStoryViewedRef.current = onStoryViewed;
    onItemViewedRef.current = onItemViewed;
    onCursorChangeRef.current = onCursorChange;
    onAutoCloseAtEndRef.current = onAutoCloseAtEnd;
    onCloseRef.current = onClose;
  });

  // Subscribe wiring (mount-scoped; identity-stable per host convention).
  useEffect(() => {
    if (!subscribe) return;
    const unsub = subscribe((delta) => {
      onSubscribeDeltaRef.current?.(delta);
      dispatch({ kind: "subscribe-delta", delta });
    });
    return unsub;
  }, [subscribe]);

  // ─── Cursor state (ID-anchored) ───────────────────────────────────────────
  // Lazy initializer — runs once at mount, derived from props.
  const [cursorIds, setCursorIds] = useState<CursorIds>(() => {
    const idx = Math.max(0, Math.min(initialStoryIndex, initialStories.length - 1));
    const story = initialStories[idx];
    return {
      storyId: story?.id ?? "",
      itemId: story?.items[0]?.id ?? "",
    };
  });

  // Reset cursor when (initialStoryIndex, isOpen) pair changes.
  // Read stories from ref to keep deps narrow.
  useEffect(() => {
    if (!isOpen) return;
    const snap = initialStoriesRef.current;
    const idx = Math.max(0, Math.min(initialStoryIndex, snap.length - 1));
    const story = snap[idx];
    if (!story) return;
    setCursorIds({
      storyId: story.id,
      itemId: story.items[0]?.id ?? "",
    });
  }, [initialStoryIndex, isOpen]);

  // Derive indices from IDs.
  const cursor = useMemo(() => {
    const storyIndex = Math.max(0, stories.findIndex((s) => s.id === cursorIds.storyId));
    const story = stories[storyIndex];
    const itemIndex = story
      ? Math.max(0, story.items.findIndex((i) => i.id === cursorIds.itemId))
      : 0;
    return { storyIndex, itemIndex };
  }, [stories, cursorIds]);

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
  const [isPaused, setPaused] = useState(false);
  const [isMuted, setMuted] = useState(true);

  // Reset pause on item key change — React 19 pattern: setState during render
  // when a derived prop changes. Keeps resume from sticking after auto-advance.
  const itemKey = `${cursorIds.storyId}:${cursorIds.itemId}`;
  const [renderedItemKey, setRenderedItemKey] = useState(itemKey);
  if (renderedItemKey !== itemKey) {
    setRenderedItemKey(itemKey);
    setPaused(false);
  }

  // ─── Navigation helpers ──────────────────────────────────────────────────
  const goToPrevItem = useCallback(() => {
    const snap = initialStoriesRef.current;
    const sIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    if (sIdx < 0) return;
    const story = snap[sIdx];
    const iIdx = story.items.findIndex((i) => i.id === cursorIds.itemId);
    if (iIdx > 0) {
      setCursorIds({ storyId: story.id, itemId: story.items[iIdx - 1].id });
      return;
    }
    if (sIdx > 0) {
      const prevStory = snap[sIdx - 1];
      const lastItem = prevStory.items[prevStory.items.length - 1];
      if (lastItem) {
        setCursorIds({ storyId: prevStory.id, itemId: lastItem.id });
      }
    }
    // else: at the very start; no-op.
  }, [cursorIds]);

  const goToNextItem = useCallback(() => {
    const snap = initialStoriesRef.current;
    const sIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    if (sIdx < 0) return;
    const story = snap[sIdx];
    const iIdx = story.items.findIndex((i) => i.id === cursorIds.itemId);
    const item = story.items[iIdx];
    if (item) {
      onItemViewedRef.current?.(story.id, item.id, iIdx);
    }
    if (iIdx < story.items.length - 1) {
      setCursorIds({ storyId: story.id, itemId: story.items[iIdx + 1].id });
      return;
    }
    // At last item — advance to next story (forward).
    onStoryViewedRef.current?.(story.id);
    if (sIdx < snap.length - 1) {
      const nextStory = snap[sIdx + 1];
      const firstItem = nextStory.items[0];
      if (firstItem) {
        setCursorIds({ storyId: nextStory.id, itemId: firstItem.id });
        return;
      }
    }
    // No next story — auto-close (gated by disableAutoClose per v0.2.0).
    onAutoCloseAtEndRef.current?.();
    if (!disableAutoCloseRef.current) onCloseRef.current();
  }, [cursorIds]);

  const goToPrevStory = useCallback(() => {
    const snap = initialStoriesRef.current;
    const sIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    if (sIdx <= 0) return;
    const prevStory = snap[sIdx - 1];
    const firstItem = prevStory.items[0];
    if (firstItem) {
      // Backward — does NOT fire onStoryViewed.
      setCursorIds({ storyId: prevStory.id, itemId: firstItem.id });
    }
  }, [cursorIds]);

  const goToNextStory = useCallback(() => {
    const snap = initialStoriesRef.current;
    const sIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    if (sIdx < 0) return;
    const story = snap[sIdx];
    onStoryViewedRef.current?.(story.id);
    if (sIdx < snap.length - 1) {
      const nextStory = snap[sIdx + 1];
      const firstItem = nextStory.items[0];
      if (firstItem) {
        setCursorIds({ storyId: nextStory.id, itemId: firstItem.id });
        return;
      }
    }
    onAutoCloseAtEndRef.current?.();
    if (!disableAutoCloseRef.current) onCloseRef.current();
  }, [cursorIds]);

  const goToStoryIndex = useCallback((index: number) => {
    const snap = initialStoriesRef.current;
    const sIdx = Math.max(0, Math.min(index, snap.length - 1));
    const target = snap[sIdx];
    if (!target) return;
    const currentSIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    // Forward jump — fire onStoryViewed for the leaving story.
    if (sIdx > currentSIdx && currentSIdx >= 0) {
      onStoryViewedRef.current?.(snap[currentSIdx].id);
    }
    setCursorIds({
      storyId: target.id,
      itemId: target.items[0]?.id ?? "",
    });
  }, [cursorIds]);

  const goToItemIndex = useCallback((index: number) => {
    const snap = initialStoriesRef.current;
    const sIdx = snap.findIndex((s) => s.id === cursorIds.storyId);
    if (sIdx < 0) return;
    const story = snap[sIdx];
    const iIdx = Math.max(0, Math.min(index, story.items.length - 1));
    const item = story.items[iIdx];
    if (!item) return;
    setCursorIds({ storyId: story.id, itemId: item.id });
  }, [cursorIds]);

  const reset = useCallback((next: Story[]) => {
    dispatch({ kind: "reset", next });
  }, []);

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
  };
}
