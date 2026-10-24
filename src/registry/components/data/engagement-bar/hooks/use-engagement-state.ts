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
  EngagementAction,
  EngagementCount,
  EngagementDelta,
  EngagementLocalAction,
  EngagementState,
  Subscribe,
} from "../types";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface ControlledFlags {
  liked: boolean;
  likeCount: boolean;
  bookmarked: boolean;
  /** comment / share / view-count follow their prop whenever the action is present. */
  commentCount: boolean;
  shareCount: boolean;
  viewCount: boolean;
  /** Controlled if `action.viewerReaction !== undefined` (string OR null). */
  viewerReaction: boolean;
  /** Paired with `viewerReaction`: a controlled reaction's `kinds[i].count` + `totalCount` win every render. */
  reactionCounts: boolean;
}

type Group = "like" | "bookmark" | "reaction";
type CountField = "commentCount" | "shareCount" | "viewCount";

interface PendingEntry {
  seq: number;
  patch: Partial<EngagementState>;
  /** The group's props when the request was made — a controlled entry is void once they change. */
  basis: string;
}
type PendingMap = Partial<Record<Group, PendingEntry>>;

interface DeltaOverride {
  value: number;
  /** The prop count when the delta arrived — the override shows until the prop changes. */
  basis: EngagementCount;
}
type OverrideMap = Partial<Record<CountField, DeltaOverride>>;

const GROUPS: Group[] = ["like", "bookmark", "reaction"];
const COUNT_FIELDS: CountField[] = ["commentCount", "shareCount", "viewCount"];
const COUNT_FIELD_KIND = {
  commentCount: "comment",
  shareCount: "share",
  viewCount: "view-count",
} as const;

const INITIAL_EMPTY_STATE: EngagementState = {
  liked: false,
  likeCount: null,
  commentCount: null,
  shareCount: null,
  viewCount: null,
  bookmarked: false,
  reactionCounts: null,
  reactionTotalCount: null,
  viewerReaction: null,
};

/** A count the host gave as a finite number, else withheld (`null`). Absent / NaN → withheld. */
function known(count: EngagementCount | undefined): EngagementCount {
  return typeof count === "number" && Number.isFinite(count) ? count : null;
}

/** A delta count must be a finite number; anything else keeps the current value. */
function sane(count: number, current: EngagementCount): EngagementCount {
  return Number.isFinite(count) ? Math.max(0, count) : current;
}

function step(count: EngagementCount | undefined, delta: 1 | -1): EngagementCount {
  if (count === null) return null;
  return Math.max(0, (count ?? 0) + delta);
}

function findAction<K extends EngagementAction["kind"]>(
  actions: EngagementAction[],
  kind: K,
): Extract<EngagementAction, { kind: K }> | undefined {
  return actions.find(
    (a): a is Extract<EngagementAction, { kind: K }> => a.kind === kind,
  );
}

/**
 * Pure derivation of the initial state shape from the actions array.
 * Each action contributes its initial values to the corresponding field;
 * absent actions use the default (null / false). Absent counts are withheld (`null`).
 */
export function deriveStateFromActions(
  actions: EngagementAction[],
): EngagementState {
  const next: EngagementState = { ...INITIAL_EMPTY_STATE };
  for (const action of actions) {
    switch (action.kind) {
      case "like":
        next.liked = action.liked ?? false;
        next.likeCount = known(action.count);
        break;
      case "comment":
        next.commentCount = known(action.count);
        break;
      case "share":
        next.shareCount = known(action.count);
        break;
      case "bookmark":
        next.bookmarked = action.bookmarked ?? false;
        break;
      case "view-count":
        next.viewCount = known(action.count);
        break;
      case "reaction":
        next.reactionCounts = action.kinds.reduce<Record<string, EngagementCount>>(
          (acc, k) => {
            acc[k.key] = known(k.count);
            return acc;
          },
          {},
        );
        next.reactionTotalCount = known(action.totalCount);
        next.viewerReaction = action.viewerReaction ?? null;
        break;
      // "custom" doesn't contribute to internal state — host owns active/count
    }
  }
  return next;
}

function deriveControlledFlags(actions: EngagementAction[]): ControlledFlags {
  const like = findAction(actions, "like");
  const bookmark = findAction(actions, "bookmark");
  const reaction = findAction(actions, "reaction");
  const likeControlled = like?.liked !== undefined;
  const reactionControlled = reaction !== undefined && reaction.viewerReaction !== undefined;
  return {
    liked: likeControlled,
    // Paired contract: the like count is controlled iff `liked` is.
    likeCount: likeControlled,
    bookmarked: bookmark?.bookmarked !== undefined,
    commentCount: findAction(actions, "comment") !== undefined,
    shareCount: findAction(actions, "share") !== undefined,
    viewCount: findAction(actions, "view-count") !== undefined,
    viewerReaction: reactionControlled,
    reactionCounts: reactionControlled,
  };
}

function isGroupControlled(group: Group, controlled: ControlledFlags): boolean {
  if (group === "like") return controlled.liked;
  if (group === "bookmark") return controlled.bookmarked;
  return controlled.viewerReaction;
}

/** A stable key of a group's props — a controlled optimistic value is void once it changes. */
function basisOf(group: Group, actions: EngagementAction[]): string {
  if (group === "like") {
    const a = findAction(actions, "like");
    return a ? `${String(a.liked)}|${String(known(a.count))}` : "";
  }
  if (group === "bookmark") {
    return String(findAction(actions, "bookmark")?.bookmarked);
  }
  const a = findAction(actions, "reaction");
  if (!a) return "";
  const kinds = a.kinds.map((k) => `${k.key}:${String(known(k.count))}`).join(",");
  return `${String(a.viewerReaction)}|${String(known(a.totalCount))}|${kinds}`;
}

function propCount(actions: EngagementAction[], field: CountField): EngagementCount {
  const action = actions.find((a) => a.kind === COUNT_FIELD_KIND[field]);
  if (!action || !("count" in action)) return null;
  return known(action.count);
}

/** Pure reducer — exported for hosts driving their own state. A `null` count stays `null`. */
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
        likeCount: step(state.likeCount, nextLiked ? 1 : -1),
      };
    }
    case "like-set": {
      if (state.liked === action.liked) return state;
      // A count the internal state never knew (seeded withheld) starts from the shown base.
      const from = state.likeCount ?? action.baseCount ?? null;
      return {
        ...state,
        liked: action.liked,
        likeCount: step(from, action.liked ? 1 : -1),
      };
    }
    case "bookmark-toggle":
      return { ...state, bookmarked: !state.bookmarked };
    case "bookmark-set":
      if (state.bookmarked === action.bookmarked) return state;
      return { ...state, bookmarked: action.bookmarked };
    case "subscribe-delta": {
      const d = action.delta;
      switch (d.kind) {
        case "like-changed":
          return {
            ...state,
            likeCount: sane(d.count, state.likeCount),
            liked: d.liked ?? state.liked,
          };
        case "comment-count-changed":
          return { ...state, commentCount: sane(d.count, state.commentCount) };
        case "share-count-changed":
          return { ...state, shareCount: sane(d.count, state.shareCount) };
        case "view-count-changed":
          return { ...state, viewCount: sane(d.count, state.viewCount) };
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
      // Optimistic per-kind tally update. A null reactionKind clears the viewer
      // + decrements the old kind. Withheld (null) tallies stay withheld.
      const base = action.base;
      if (state.reactionCounts === null && !base) {
        // No reaction action present (and no shown base) — dispatch is a no-op.
        return state;
      }
      const current = state.viewerReaction;
      const next = action.reactionKind;
      if (current === next) return state; // same kind tap = no-op

      // Live internal tallies win; kinds the internal state never knew (added after mount,
      // or seeded withheld) start from the shown base.
      const counts: Record<string, EngagementCount> = { ...(base?.counts ?? {}) };
      for (const [key, value] of Object.entries(state.reactionCounts ?? {})) {
        if (value !== null && value !== undefined) counts[key] = value;
        else if (counts[key] === undefined || counts[key] === null) counts[key] = null;
      }
      let total = state.reactionTotalCount ?? base?.total ?? null;

      if (current !== null) {
        // Counts can never go below 0 (defensive — host backend should guarantee
        // this, but optimistic ops shouldn't crash on drift).
        counts[current] = step(counts[current], -1);
        total = step(total, -1);
      }
      if (next !== null) {
        counts[next] = step(counts[next], 1);
        total = step(total, 1);
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
    case "reaction-changed":
      // Pair rule: a controlled reaction owns viewer + counts — the host applies the delta.
      return controlled.viewerReaction;
    case "comment-count-changed":
    case "share-count-changed":
    case "view-count-changed":
    case "liker-added":
    case "liker-removed":
    case "reactor-added":
    case "reactor-removed":
      // Count deltas also patch internal state (read when the action is absent); the shown
      // count comes from the delta overlay. The rest never patch internal state.
      return false;
  }
}

export interface UseEngagementStateOptions {
  actions: EngagementAction[];
  subscribe?: Subscribe<EngagementDelta>;
  onSubscribeDelta?: (delta: EngagementDelta) => void;
  /** See `EngagementBarProps.optimistic`. Default `true`. */
  optimistic?: boolean;
}

export interface UseEngagementStateResult {
  /** The shown state: props, optimistic and delta overlays applied. */
  state: EngagementState;
  dispatch: React.Dispatch<EngagementLocalAction>;
  controlled: ControlledFlags;
  /** Toggle like through the full path (gating, handler, optimistic, rollback). */
  toggleLike: () => void;
  /** Toggle bookmark through the full path. */
  toggleBookmark: () => void;
  /** Select (string) or clear (`null`) the viewer's reaction through the full path. Same kind = no-op. */
  selectReaction: (kind: string | null) => void;
  /** Re-seed internal state from the actions and drop optimistic / delta overlays. */
  reset: () => void;
}

/**
 * State for the bar:
 *  - useReducer over engagementReducer (uncontrolled fields)
 *  - per-render controlled-vs-uncontrolled flags; controlled props win per field, every render
 *  - optimistic overlay for promise-returning handlers (latest request decides, rejection rolls back)
 *  - delta overlay for comment / share / view counts (shows until the prop changes)
 *  - subscription effect that fires onSubscribeDelta and patches uncontrolled fields
 */
export function useEngagementState(
  opts: UseEngagementStateOptions,
): UseEngagementStateResult {
  const { actions } = opts;
  const initial = useMemo(
    () => deriveStateFromActions(actions),
    // intentionally only on mount — useReducer ignores initial changes after mount,
    // but we still memoize so the closure is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [internalState, dispatch] = useReducer(engagementReducer, initial);
  const [pending, setPending] = useState<PendingMap>({});
  const [overrides, setOverrides] = useState<OverrideMap>({});

  const controlled = useMemo(() => deriveControlledFlags(actions), [actions]);

  // Shown state: controlled props win per field, then valid overlays, then withheld counts.
  const state = useMemo<EngagementState>(() => {
    const like = findAction(actions, "like");
    const bookmark = findAction(actions, "bookmark");
    const reaction = findAction(actions, "reaction");

    const overlaid = (field: CountField, prop: EngagementCount): EngagementCount => {
      if (prop === null) return null;
      const o = overrides[field];
      return o && o.basis === prop ? o.value : prop;
    };
    const countFor = (field: CountField, kind: (typeof COUNT_FIELD_KIND)[CountField]) =>
      actions.some((a) => a.kind === kind)
        ? overlaid(field, propCount(actions, field))
        : internalState[field];

    const likeProp = like ? known(like.count) : null;
    const totalProp = reaction ? known(reaction.totalCount) : null;

    const shown: EngagementState = {
      liked: controlled.liked && like ? (like.liked ?? false) : internalState.liked,
      likeCount: like
        ? likeProp === null
          ? null
          : controlled.likeCount
            ? likeProp
            : (internalState.likeCount ?? likeProp)
        : internalState.likeCount,
      commentCount: countFor("commentCount", "comment"),
      shareCount: countFor("shareCount", "share"),
      viewCount: countFor("viewCount", "view-count"),
      bookmarked:
        controlled.bookmarked && bookmark
          ? (bookmark.bookmarked ?? false)
          : internalState.bookmarked,
      reactionCounts: reaction
        ? reaction.kinds.reduce<Record<string, EngagementCount>>((acc, k) => {
            const p = known(k.count);
            acc[k.key] =
              p === null
                ? null
                : controlled.reactionCounts
                  ? p
                  : (internalState.reactionCounts?.[k.key] ?? p);
            return acc;
          }, {})
        : internalState.reactionCounts,
      reactionTotalCount: reaction
        ? totalProp === null
          ? null
          : controlled.reactionCounts
            ? totalProp
            : (internalState.reactionTotalCount ?? totalProp)
        : internalState.reactionTotalCount,
      viewerReaction:
        controlled.viewerReaction && reaction
          ? (reaction.viewerReaction ?? null)
          : internalState.viewerReaction,
    };

    for (const group of GROUPS) {
      const entry = pending[group];
      if (!entry) continue;
      if (isGroupControlled(group, controlled) && entry.basis !== basisOf(group, actions)) continue;
      Object.assign(shown, entry.patch);
    }

    // A withheld count stays withheld through every overlay (C6).
    if (like && likeProp === null) shown.likeCount = null;
    if (reaction) {
      if (totalProp === null) shown.reactionTotalCount = null;
      if (shown.reactionCounts) {
        const counts = { ...shown.reactionCounts };
        for (const k of reaction.kinds) if (known(k.count) === null) counts[k.key] = null;
        shown.reactionCounts = counts;
      }
    }
    return shown;
  }, [internalState, actions, controlled, pending, overrides]);

  // Refs read by the request functions + the subscription (latest committed values).
  const shownRef = useRef(state);
  const actionsRef = useRef(actions);
  const controlledRef = useRef(controlled);
  const optimisticRef = useRef(opts.optimistic ?? true);
  const onSubscribeDeltaRef = useRef(opts.onSubscribeDelta);
  useIsoLayoutEffect(() => {
    shownRef.current = state;
    actionsRef.current = actions;
    controlledRef.current = controlled;
    optimisticRef.current = opts.optimistic ?? true;
    onSubscribeDeltaRef.current = opts.onSubscribeDelta;
  });

  // Drop overlays whose basis is gone, so a prop that changes A → B → A can't revive them.
  // React's "adjust state when a prop changes" pattern (a guarded setState during render):
  // when the props' basis changes, drop every overlay made against an older basis.
  const basisKey = [
    ...GROUPS.map((group) => basisOf(group, actions)),
    ...COUNT_FIELDS.map((field) => String(propCount(actions, field))),
  ].join("§");
  const [seenBasisKey, setSeenBasisKey] = useState(basisKey);
  if (seenBasisKey !== basisKey) {
    setSeenBasisKey(basisKey);
    const stalePending = GROUPS.filter((group) => {
      const entry = pending[group];
      return !!entry && isGroupControlled(group, controlled) && entry.basis !== basisOf(group, actions);
    });
    if (stalePending.length > 0) {
      setPending((p) => {
        const next = { ...p };
        for (const group of stalePending) delete next[group];
        return next;
      });
    }
    const staleOverrides = COUNT_FIELDS.filter((field) => {
      const entry = overrides[field];
      return !!entry && entry.basis !== propCount(actions, field);
    });
    if (staleOverrides.length > 0) {
      setOverrides((o) => {
        const next = { ...o };
        for (const field of staleOverrides) delete next[field];
        return next;
      });
    }
  }

  const seqRef = useRef<Record<Group, number>>({ like: 0, bookmark: 0, reaction: 0 });
  const settledRef = useRef<Record<Group, number>>({ like: 0, bookmark: 0, reaction: 0 });

  const clearPending = useCallback((group: Group, id: number) => {
    setPending((p) => {
      if (p[group]?.seq !== id) return p;
      const next = { ...p };
      delete next[group];
      return next;
    });
  }, []);

  // One request path for like / bookmark / reaction (C5 semantics of the scaffold's
  // use-controllable-state): sync handler → uncontrolled applies, controlled waits for props;
  // promise → optimistic overlay until it settles; only the latest request decides.
  const run = useCallback(
    (group: Group, patch: Partial<EngagementState>, call: () => unknown, apply: () => void) => {
      const id = ++seqRef.current[group];
      const isControlled = isGroupControlled(group, controlledRef.current);
      const basis = basisOf(group, actionsRef.current);
      const dropPending = () =>
        setPending((p) => {
          if (!p[group]) return p;
          const next = { ...p };
          delete next[group];
          return next;
        });
      let result: unknown;
      try {
        result = call();
      } catch (error) {
        // A throwing handler is a host bug — never leave an older request's overlay stuck.
        dropPending();
        throw error;
      }
      const isPromise =
        !!result && typeof (result as PromiseLike<unknown>).then === "function";
      if (!isPromise) {
        // This request is now the latest: an older in-flight overlay must not outlive it.
        dropPending();
        if (!isControlled) {
          settledRef.current[group] = id;
          apply();
        }
        return;
      }
      if (optimisticRef.current) {
        setPending((p) => ({ ...p, [group]: { seq: id, patch, basis } }));
      }
      (result as PromiseLike<unknown>).then(
        () => {
          if (!isControlled && id > settledRef.current[group]) {
            settledRef.current[group] = id;
            apply();
          }
          if (id === seqRef.current[group]) clearPending(group, id);
        },
        () => {
          if (id === seqRef.current[group]) clearPending(group, id);
        },
      );
    },
    [clearPending],
  );

  const toggleLike = useCallback(() => {
    const action = findAction(actionsRef.current, "like");
    if (!action || action.disabled || action.hidden) return;
    const shown = shownRef.current;
    const target = !shown.liked;
    run(
      "like",
      { liked: target, likeCount: step(shown.likeCount, target ? 1 : -1) },
      () => action.onToggle?.(target),
      () => dispatch({ kind: "like-set", liked: target, baseCount: shown.likeCount }),
    );
  }, [run]);

  const toggleBookmark = useCallback(() => {
    const action = findAction(actionsRef.current, "bookmark");
    if (!action || action.disabled || action.hidden) return;
    const target = !shownRef.current.bookmarked;
    run(
      "bookmark",
      { bookmarked: target },
      () => action.onToggle?.(target),
      () => dispatch({ kind: "bookmark-set", bookmarked: target }),
    );
  }, [run]);

  const selectReaction = useCallback(
    (kind: string | null) => {
      const action = findAction(actionsRef.current, "reaction");
      if (!action || action.disabled || action.hidden) return;
      if (kind !== null && !action.kinds.some((k) => k.key === kind)) return;
      const shown = shownRef.current;
      if (kind === shown.viewerReaction) return;
      const next = engagementReducer(shown, { kind: "reaction-select", reactionKind: kind });
      run(
        "reaction",
        {
          viewerReaction: next.viewerReaction,
          reactionCounts: next.reactionCounts,
          reactionTotalCount: next.reactionTotalCount,
        },
        () => action.onSelect?.(kind),
        () =>
          dispatch({
            kind: "reaction-select",
            reactionKind: kind,
            base: { counts: shown.reactionCounts ?? {}, total: shown.reactionTotalCount },
          }),
      );
    },
    [run],
  );

  const reset = useCallback(() => {
    // In-flight requests may still settle — they must not re-apply over the reset.
    for (const group of GROUPS) settledRef.current[group] = seqRef.current[group];
    setPending({});
    setOverrides({});
    dispatch({ kind: "reset", next: deriveStateFromActions(actionsRef.current) });
  }, []);

  // Subscription — stable on `subscribe` identity only. Re-running it on `controlled` or
  // `onSubscribeDelta` change would drop deltas in flight between cleanup + re-call.
  const subscribe = opts.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    const unsub = subscribe((delta) => {
      onSubscribeDeltaRef.current?.(delta);
      const field: CountField | null =
        delta.kind === "comment-count-changed"
          ? "commentCount"
          : delta.kind === "share-count-changed"
            ? "shareCount"
            : delta.kind === "view-count-changed"
              ? "viewCount"
              : null;
      if (field && "count" in delta && Number.isFinite(delta.count)) {
        const value = Math.max(0, delta.count);
        const basis = propCount(actionsRef.current, field);
        setOverrides((o) => ({ ...o, [field]: { value, basis } }));
      }
      if (!isControlledForDelta(delta, controlledRef.current)) {
        dispatch({ kind: "subscribe-delta", delta });
      }
    });
    return unsub;
  }, [subscribe]);

  // Defense 2 (structural resync guard) per Q-PP-3 — when the host transitions
  // `viewerReaction` from uncontrolled → controlled (or changes the controlled
  // value), keep the internal mirror in step so a later switch back to
  // uncontrolled resumes from the last controlled value.
  const reactionAction = findAction(actions, "reaction");
  const controlledViewerReaction =
    controlled.viewerReaction && reactionAction
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

  return { state, dispatch, controlled, toggleLike, toggleBookmark, selectReaction, reset };
}
