"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type {
  StoryEngagementDelta,
  StoryEngagementLocalAction,
  StoryItemEngagement,
  Subscribe,
} from "../types";

// ─── Per-item engagement state ──────────────────────────────────────────

/** `null` count = withheld (the host gave none, or sent `null`): no number is rendered. */
export interface StoryItemEngagementState {
  likeCount: number | null;
  liked: boolean;
  reactionCount: number | null;
  viewerReaction: string | null;
  replyCount: number | null;
}

const DEFAULT_STATE: StoryItemEngagementState = {
  likeCount: 0,
  liked: false,
  reactionCount: 0,
  viewerReaction: null,
  replyCount: 0,
};

/** Initial state for an item: the host's `StoryItem.engagement` seed over the defaults. */
export function seedToState(seed: StoryItemEngagement | undefined): StoryItemEngagementState {
  if (!seed) return DEFAULT_STATE;
  return {
    likeCount: seed.likeCount === undefined ? 0 : seed.likeCount,
    liked: seed.liked ?? false,
    reactionCount: seed.reactionCount === undefined ? 0 : seed.reactionCount,
    viewerReaction: seed.viewerReaction ?? null,
    replyCount: seed.replyCount === undefined ? 0 : seed.replyCount,
  };
}

/** A withheld (`null`) count stays withheld under a local +1 / -1; a number moves. */
const bump = (n: number | null, by: 1 | -1): number | null =>
  n === null ? null : Math.max(0, n + by);

/**
 * Compound key for the state map. Story-viewer-01's engagement state is
 * per-(storyId, itemId) — each item in each story tracks independently.
 */
function key(storyId: string, itemId: string): string {
  return `${storyId}:${itemId}`;
}

// ─── Reducer (pure) ─────────────────────────────────────────────────────

type EngagementStateMap = Record<string, StoryItemEngagementState>;

export function storyEngagementReducer(
  state: EngagementStateMap,
  action: StoryEngagementLocalAction,
): EngagementStateMap {
  switch (action.kind) {
    case "like-toggle": {
      const k = key(action.storyId, action.itemId);
      const prev = state[k] ?? seedToState(action.seed);
      if (prev.liked === action.nextLiked) return state;
      return {
        ...state,
        [k]: {
          ...prev,
          liked: action.nextLiked,
          likeCount: bump(prev.likeCount, action.nextLiked ? 1 : -1),
        },
      };
    }
    case "reaction-select": {
      const k = key(action.storyId, action.itemId);
      const prev = state[k] ?? seedToState(action.seed);
      if (prev.viewerReaction === action.reactionKind) return state;
      // Clearing a reaction decrements; setting a new one (when none was set)
      // increments. Switching from one kind to another keeps the count stable.
      let nextCount = prev.reactionCount;
      if (action.reactionKind == null && prev.viewerReaction != null) {
        nextCount = bump(prev.reactionCount, -1);
      } else if (action.reactionKind != null && prev.viewerReaction == null) {
        nextCount = bump(prev.reactionCount, 1);
      }
      return {
        ...state,
        [k]: {
          ...prev,
          viewerReaction: action.reactionKind,
          reactionCount: nextCount,
        },
      };
    }
    case "subscribe-delta": {
      const d = action.delta;
      switch (d.kind) {
        case "like-changed": {
          const k = key(d.storyId, d.itemId);
          const prev = state[k] ?? seedToState(action.seed);
          return {
            ...state,
            [k]: {
              ...prev,
              likeCount: d.count,
              liked: d.liked ?? prev.liked,
            },
          };
        }
        case "reaction-changed": {
          const k = key(d.storyId, d.itemId);
          const prev = state[k] ?? seedToState(action.seed);
          return {
            ...state,
            [k]: {
              ...prev,
              reactionCount: d.count,
              viewerReaction:
                d.reactionKind !== undefined ? d.reactionKind : prev.viewerReaction,
            },
          };
        }
        case "reply-added": {
          const k = key(d.storyId, d.itemId);
          const prev = state[k] ?? seedToState(action.seed);
          return {
            ...state,
            [k]: { ...prev, replyCount: prev.replyCount === null ? null : prev.replyCount + 1 },
          };
        }
        // viewer-added and view-count-changed don't affect per-item engagement
        // (they're owner-overlay concerns); ignored here, handled in OwnerOverlay.
        case "viewer-added":
        case "view-count-changed":
          return state;
      }
      return state;
    }
    case "reset": {
      const k = key(action.storyId, action.itemId);
      const rest = { ...state };
      delete rest[k];
      return rest;
    }
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────

export interface UseStoryEngagementStateOptions {
  /** Wired engagementSubscribe stream from story-viewer props. */
  subscribe?: Subscribe<StoryEngagementDelta>;
  /** Forwarding callback — fires for every delta the subscription emits. */
  onSubscribeDelta?: (delta: StoryEngagementDelta) => void;
  /**
   * Looks up the host's `StoryItem.engagement` seed for an item. Used when an action or a
   * realtime delta is the FIRST thing to touch an item, so it applies on top of the seed.
   */
  getSeed?: (storyId: string, itemId: string) => StoryItemEngagement | undefined;
}

export interface UseStoryEngagementStateResult {
  /**
   * Reads per-(storyId, itemId) engagement state. With no entry yet it returns the state built
   * from `seed` (the item's `engagement`), or the zero defaults when there is none.
   */
  getState: (
    storyId: string,
    itemId: string,
    seed?: StoryItemEngagement,
  ) => StoryItemEngagementState;
  /** Dispatcher for local actions (used by overlay onToggle / onSelect). Attaches the item's seed. */
  dispatch: React.Dispatch<StoryEngagementLocalAction>;
}

/**
 * Per-(storyId, itemId) engagement state hook. Subscribes to the optional
 * engagement realtime stream + reduces local actions (like / reaction toggles)
 * into a single state map.
 *
 * Mount-scoped subscribe wiring (matches the rest of the family's contract).
 */
export function useStoryEngagementState(
  opts: UseStoryEngagementStateOptions,
): UseStoryEngagementStateResult {
  const [state, rawDispatch] = useReducer(storyEngagementReducer, {});

  const onSubscribeDeltaRef = useRef(opts.onSubscribeDelta);
  const getSeedRef = useRef(opts.getSeed);
  useEffect(() => {
    onSubscribeDeltaRef.current = opts.onSubscribeDelta;
    getSeedRef.current = opts.getSeed;
  });

  const dispatch = useCallback((action: StoryEngagementLocalAction) => {
    if (action.kind === "reset") {
      rawDispatch(action);
      return;
    }
    if (action.kind === "subscribe-delta") {
      const d = action.delta;
      const seed =
        action.seed ??
        ("itemId" in d ? getSeedRef.current?.(d.storyId, d.itemId) : undefined);
      rawDispatch({ ...action, seed });
      return;
    }
    rawDispatch({
      ...action,
      seed: action.seed ?? getSeedRef.current?.(action.storyId, action.itemId),
    });
  }, []);

  const subscribe = opts.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    const unsub = subscribe((delta) => {
      onSubscribeDeltaRef.current?.(delta);
      dispatch({ kind: "subscribe-delta", delta });
    });
    return unsub;
  }, [subscribe, dispatch]);

  const getState = (
    storyId: string,
    itemId: string,
    seed?: StoryItemEngagement,
  ): StoryItemEngagementState => state[key(storyId, itemId)] ?? seedToState(seed);

  return { getState, dispatch };
}
