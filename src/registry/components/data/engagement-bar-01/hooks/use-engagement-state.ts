"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import type {
  EngagementAction,
  EngagementDelta,
  EngagementLocalAction,
  EngagementState,
  Subscribe,
} from "../types";

interface ControlledFlags {
  liked: boolean;
  likeCount: boolean;
  bookmarked: boolean;
  commentCount: boolean;
  shareCount: boolean;
  viewCount: boolean;
}

const INITIAL_EMPTY_STATE: EngagementState = {
  liked: false,
  likeCount: 0,
  commentCount: 0,
  shareCount: null,
  viewCount: null,
  bookmarked: false,
};

/**
 * Pure derivation of the initial state shape from the actions array.
 * Each action contributes its initial values to the corresponding field;
 * absent actions use the default (0 / null / false).
 */
export function deriveStateFromActions(
  actions: EngagementAction[],
): EngagementState {
  const next: EngagementState = { ...INITIAL_EMPTY_STATE };
  for (const action of actions) {
    switch (action.kind) {
      case "like":
        next.liked = action.liked ?? false;
        next.likeCount = action.count;
        break;
      case "comment":
        next.commentCount = action.count;
        break;
      case "share":
        next.shareCount = action.count ?? null;
        break;
      case "bookmark":
        next.bookmarked = action.bookmarked ?? false;
        break;
      case "view-count":
        next.viewCount = action.count;
        break;
      // "custom" doesn't contribute to internal state — host owns active/count
    }
  }
  return next;
}

function deriveControlledFlags(actions: EngagementAction[]): ControlledFlags {
  const flags: ControlledFlags = {
    liked: false,
    likeCount: false,
    bookmarked: false,
    commentCount: false,
    shareCount: false,
    viewCount: false,
  };
  for (const action of actions) {
    switch (action.kind) {
      case "like":
        if (action.liked !== undefined) flags.liked = true;
        // count is always present for like — hybrid: count is "controlled"
        // only if the host updates it on each render. We treat count as
        // controlled iff liked is controlled (paired contract).
        flags.likeCount = flags.liked;
        break;
      case "bookmark":
        if (action.bookmarked !== undefined) flags.bookmarked = true;
        break;
      // other action kinds don't have separate controlled flags here —
      // their counts always come from props directly via the resolved state.
    }
  }
  return flags;
}

/** Pure reducer — exported for hosts driving their own state. */
export function engagementReducer(
  state: EngagementState,
  action: EngagementLocalAction,
): EngagementState {
  switch (action.kind) {
    case "like-toggle": {
      const nextLiked = !state.liked;
      return {
        ...state,
        liked: nextLiked,
        likeCount: Math.max(0, state.likeCount + (nextLiked ? 1 : -1)),
      };
    }
    case "bookmark-toggle":
      return { ...state, bookmarked: !state.bookmarked };
    case "subscribe-delta": {
      const d = action.delta;
      switch (d.kind) {
        case "like-changed":
          return {
            ...state,
            likeCount: d.count,
            liked: d.liked ?? state.liked,
          };
        case "comment-count-changed":
          return { ...state, commentCount: d.count };
        case "share-count-changed":
          return { ...state, shareCount: d.count };
        case "view-count-changed":
          return { ...state, viewCount: d.count };
        case "bookmark-changed":
          return { ...state, bookmarked: d.bookmarked };
        case "liker-added":
        case "liker-removed":
          // These deltas inform the likersPreview slot host, not the bar's
          // internal state. Bar state unchanged.
          return state;
      }
      return state;
    }
    case "reset":
      return action.next;
  }
}

function isControlledForDelta(
  delta: EngagementDelta,
  controlled: ControlledFlags,
): boolean {
  switch (delta.kind) {
    case "like-changed":
      return controlled.liked || controlled.likeCount;
    case "bookmark-changed":
      return controlled.bookmarked;
    case "comment-count-changed":
      return controlled.commentCount;
    case "share-count-changed":
      return controlled.shareCount;
    case "view-count-changed":
      return controlled.viewCount;
    case "liker-added":
    case "liker-removed":
      return false; // these never patch internal state anyway
  }
}

export interface UseEngagementStateOptions {
  actions: EngagementAction[];
  subscribe?: Subscribe<EngagementDelta>;
  onSubscribeDelta?: (delta: EngagementDelta) => void;
}

export interface UseEngagementStateResult {
  state: EngagementState;
  dispatch: React.Dispatch<EngagementLocalAction>;
  controlled: ControlledFlags;
}

/**
 * Internal-leaning hook (not re-exported) that wires:
 *  - useReducer over engagementReducer
 *  - per-render controlled-vs-uncontrolled flag computation
 *  - effective-state merge (controlled props win per-field)
 *  - subscription effect that fires onSubscribeDelta and patches uncontrolled fields
 */
export function useEngagementState(
  opts: UseEngagementStateOptions,
): UseEngagementStateResult {
  const initial = useMemo(
    () => deriveStateFromActions(opts.actions),
    // intentionally only on mount — useReducer ignores initial changes after mount,
    // but we still memoize so the closure is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [internalState, dispatch] = useReducer(engagementReducer, initial);

  const controlled = useMemo(
    () => deriveControlledFlags(opts.actions),
    [opts.actions],
  );

  // Effective state: controlled props win per-field.
  const state = useMemo<EngagementState>(() => {
    const likeAction = opts.actions.find((a) => a.kind === "like");
    const bookmarkAction = opts.actions.find((a) => a.kind === "bookmark");
    const commentAction = opts.actions.find((a) => a.kind === "comment");
    const shareAction = opts.actions.find((a) => a.kind === "share");
    const viewCountAction = opts.actions.find((a) => a.kind === "view-count");

    return {
      liked:
        controlled.liked && likeAction?.kind === "like"
          ? (likeAction.liked ?? false)
          : internalState.liked,
      likeCount:
        controlled.likeCount && likeAction?.kind === "like"
          ? likeAction.count
          : internalState.likeCount,
      commentCount:
        commentAction?.kind === "comment"
          ? commentAction.count
          : internalState.commentCount,
      shareCount:
        shareAction?.kind === "share"
          ? (shareAction.count ?? null)
          : internalState.shareCount,
      viewCount:
        viewCountAction?.kind === "view-count"
          ? viewCountAction.count
          : internalState.viewCount,
      bookmarked:
        controlled.bookmarked && bookmarkAction?.kind === "bookmark"
          ? (bookmarkAction.bookmarked ?? false)
          : internalState.bookmarked,
    };
  }, [internalState, opts.actions, controlled]);

  // Refs keep the subscription effect stable on `subscribe` identity only.
  // Re-running it on `controlled` or `onSubscribeDelta` change would drop deltas
  // in flight between cleanup + re-call.
  const controlledRef = useRef(controlled);
  useEffect(() => {
    controlledRef.current = controlled;
  });
  const onSubscribeDeltaRef = useRef(opts.onSubscribeDelta);
  useEffect(() => {
    onSubscribeDeltaRef.current = opts.onSubscribeDelta;
  });

  const subscribe = opts.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    const unsub = subscribe((delta) => {
      onSubscribeDeltaRef.current?.(delta);
      if (!isControlledForDelta(delta, controlledRef.current)) {
        dispatch({ kind: "subscribe-delta", delta });
      }
    });
    return unsub;
  }, [subscribe]);

  return { state, dispatch, controlled };
}
