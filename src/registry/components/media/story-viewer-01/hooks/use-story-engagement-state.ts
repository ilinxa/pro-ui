"use client";

import { useEffect, useReducer, useRef } from "react";
import type {
  StoryEngagementDelta,
  StoryEngagementLocalAction,
  Subscribe,
} from "../types";

// ─── Per-item engagement state ──────────────────────────────────────────

export interface StoryItemEngagementState {
  likeCount: number;
  liked: boolean;
  reactionCount: number;
  viewerReaction: string | null;
  replyCount: number;
}

const DEFAULT_STATE: StoryItemEngagementState = {
  likeCount: 0,
  liked: false,
  reactionCount: 0,
  viewerReaction: null,
  replyCount: 0,
};

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
      const prev = state[k] ?? DEFAULT_STATE;
      if (prev.liked === action.nextLiked) return state;
      return {
        ...state,
        [k]: {
          ...prev,
          liked: action.nextLiked,
          likeCount: action.nextLiked
            ? prev.likeCount + 1
            : Math.max(0, prev.likeCount - 1),
        },
      };
    }
    case "reaction-select": {
      const k = key(action.storyId, action.itemId);
      const prev = state[k] ?? DEFAULT_STATE;
      if (prev.viewerReaction === action.reactionKind) return state;
      // Clearing a reaction decrements; setting a new one (when none was set)
      // increments. Switching from one kind to another keeps the count stable.
      let nextCount = prev.reactionCount;
      if (action.reactionKind == null && prev.viewerReaction != null) {
        nextCount = Math.max(0, prev.reactionCount - 1);
      } else if (action.reactionKind != null && prev.viewerReaction == null) {
        nextCount = prev.reactionCount + 1;
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
          const prev = state[k] ?? DEFAULT_STATE;
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
          const prev = state[k] ?? DEFAULT_STATE;
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
          const prev = state[k] ?? DEFAULT_STATE;
          return { ...state, [k]: { ...prev, replyCount: prev.replyCount + 1 } };
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
      const { [k]: _drop, ...rest } = state;
      return rest;
    }
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────

export interface UseStoryEngagementStateOptions {
  /** Wired engagementSubscribe stream from story-viewer-01 props. */
  subscribe?: Subscribe<StoryEngagementDelta>;
  /** Forwarding callback — fires for every delta the subscription emits. */
  onSubscribeDelta?: (delta: StoryEngagementDelta) => void;
}

export interface UseStoryEngagementStateResult {
  /** Reads per-(storyId, itemId) engagement state. Returns DEFAULT_STATE when no entry exists yet. */
  getState: (storyId: string, itemId: string) => StoryItemEngagementState;
  /** Dispatcher for local actions (used by overlay onToggle / onSelect). */
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
  const [state, dispatch] = useReducer(storyEngagementReducer, {});

  const onSubscribeDeltaRef = useRef(opts.onSubscribeDelta);
  useEffect(() => {
    onSubscribeDeltaRef.current = opts.onSubscribeDelta;
  });

  const subscribe = opts.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    const unsub = subscribe((delta) => {
      onSubscribeDeltaRef.current?.(delta);
      dispatch({ kind: "subscribe-delta", delta });
    });
    return unsub;
  }, [subscribe]);

  const getState = (storyId: string, itemId: string): StoryItemEngagementState =>
    state[key(storyId, itemId)] ?? DEFAULT_STATE;

  return { getState, dispatch };
}
