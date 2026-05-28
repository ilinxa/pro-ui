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
  /**
   * Controlled if `action.viewerReaction !== undefined` (host explicitly passes the
   * value, either `string` or `null`). Reaction `kinds[i].count` is NEVER controlled
   * per Q-PP-4 source-of-truth rule — state wins after init.
   */
  viewerReaction: boolean;
}

const INITIAL_EMPTY_STATE: EngagementState = {
  liked: false,
  likeCount: 0,
  commentCount: 0,
  shareCount: null,
  viewCount: null,
  bookmarked: false,
  reactionCounts: null,
  reactionTotalCount: null,
  viewerReaction: null,
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
      case "reaction":
        // Per Q-PP-4 source-of-truth rule — kinds[i].count is the SEED only.
        next.reactionCounts = action.kinds.reduce<Record<string, number>>(
          (acc, k) => {
            acc[k.key] = k.count;
            return acc;
          },
          {},
        );
        next.reactionTotalCount = action.totalCount;
        next.viewerReaction = action.viewerReaction ?? null;
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
    viewerReaction: false,
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
      case "reaction":
        // `viewerReaction` is optional-controlled per the like pattern.
        // `kinds[i].count` is NEVER controlled — state owns counts after init.
        if (action.viewerReaction !== undefined) flags.viewerReaction = true;
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
        case "reaction-changed":
          // Server-authoritative replace. Counts + total + viewer all swap to
          // the delta payload. Viewer is optional in the delta — fall back to
          // current state when absent (so the server can update just counts).
          return {
            ...state,
            reactionCounts: d.counts,
            reactionTotalCount: d.totalCount,
            viewerReaction:
              d.viewerReaction !== undefined
                ? d.viewerReaction
                : state.viewerReaction,
          };
        case "reactor-added":
        case "reactor-removed":
          // Pass-through per Q-PP-4 — the bar does not maintain a reactor list.
          // Hosts that want a live reactors strip consume the delta via
          // onSubscribeDelta and render into the `reactionsPreview` slot.
          return state;
      }
      return state;
    }
    case "reaction-select": {
      // Optimistic per-kind tally update. State holds the live count map; a
      // null reactionKind clears the viewer + decrements the old kind.
      if (state.reactionCounts === null || state.reactionTotalCount === null) {
        // No reaction action present — dispatch is a no-op.
        return state;
      }
      const current = state.viewerReaction;
      const next = action.reactionKind;
      if (current === next) return state; // same kind tap = no-op

      const counts = { ...state.reactionCounts };
      let total = state.reactionTotalCount;

      if (current !== null) {
        // Decrement old kind. Counts can never go below 0 (defensive — host
        // backend should guarantee this, but optimistic ops shouldn't crash on drift).
        counts[current] = Math.max(0, (counts[current] ?? 0) - 1);
        total = Math.max(0, total - 1);
      }
      if (next !== null) {
        counts[next] = (counts[next] ?? 0) + 1;
        total = total + 1;
      }
      return {
        ...state,
        reactionCounts: counts,
        reactionTotalCount: total,
        viewerReaction: next,
      };
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
    case "reaction-changed":
      // Counts + total are NEVER controlled per Q-PP-4 — always patch from server.
      // Viewer field also patches; effective-state useMemo overlays the host's
      // controlled `viewerReaction` if `controlled.viewerReaction === true`.
      return false;
    case "reactor-added":
    case "reactor-removed":
      // Never patch internal state (pass-through to host's reactionsPreview slot).
      // Dispatch is harmless (reducer returns state unchanged) — matches the
      // existing `liker-added` / `liker-removed` convention.
      return false;
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
    const reactionAction = opts.actions.find((a) => a.kind === "reaction");

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
      // Per Q-PP-4 source-of-truth rule: `reactionCounts` and `reactionTotalCount`
      // are NEVER controlled — state owns them. Renderers read
      // `state.reactionCounts[k.key] ?? k.count` per kind (action.kinds is the seed).
      reactionCounts: internalState.reactionCounts,
      reactionTotalCount: internalState.reactionTotalCount,
      // `viewerReaction` follows the like-pattern: optional-controlled. When the
      // host passes `action.viewerReaction !== undefined` (string OR null), host
      // wins. Otherwise internal state.
      viewerReaction:
        controlled.viewerReaction && reactionAction?.kind === "reaction"
          ? (reactionAction.viewerReaction ?? null)
          : internalState.viewerReaction,
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

  // Defense 2 (structural resync guard) per Q-PP-3 — when the host transitions
  // `viewerReaction` from uncontrolled → controlled (or changes the controlled
  // value), the internal mirror can be stale relative to the effective overlay.
  // The next `reaction-select` dispatch would read stale internal state and
  // decrement the wrong kind. This effect syncs the internal `viewerReaction`
  // to the controlled value without touching counts (counts stay server / state
  // owned per Q-PP-4 source-of-truth).
  const reactionAction = opts.actions.find((a) => a.kind === "reaction");
  const controlledViewerReaction =
    controlled.viewerReaction && reactionAction?.kind === "reaction"
      ? (reactionAction.viewerReaction ?? null)
      : undefined;
  const internalStateRef = useRef(internalState);
  useEffect(() => {
    internalStateRef.current = internalState;
  });
  useEffect(() => {
    if (controlledViewerReaction === undefined) return;
    const current = internalStateRef.current;
    if (controlledViewerReaction === current.viewerReaction) return;
    dispatch({
      kind: "reset",
      next: { ...current, viewerReaction: controlledViewerReaction },
    });
  }, [controlledViewerReaction]);

  return { state, dispatch, controlled };
}
