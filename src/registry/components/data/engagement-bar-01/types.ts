import type { ReactNode } from "react";

export type EngagementBar01Variant = "default" | "compact" | "stacked";

export type EngagementActionAlign = "left" | "right" | "auto";

/**
 * Single reaction kind in the host-supplied catalog for the `reaction` action.
 *
 * One source of truth for icon + label + count — no parallel `counts` /
 * `availableKinds` maps that can drift. Backends with their own reaction codes
 * map their rows to this shape at the host boundary.
 */
export interface EngagementReactionKind {
  /** Stable identifier matching backend payloads (e.g. `"love"`, `"laugh"`). */
  key: string;
  /** Host-supplied icon node (lucide / emoji / image). Library does not ship reaction icons. */
  icon: ReactNode;
  /** Localized human label — used in picker tooltip + aria-label. */
  label: string;
  /** Seed tally for this kind. After the bar mounts, live tally lives in `EngagementState.reactionCounts[key]`. */
  count: number;
  /** Optional tint (any CSS color) applied to the icon when this is the viewer's current reaction. */
  color?: string;
}

/** Strict discriminated union — no extra fields. */
export type EngagementAction =
  | {
      kind: "like";
      count: number;
      liked?: boolean;
      onToggle?: (next: boolean) => void;
      /**
       * Optional separate click target for the count number. When provided, the
       * like action splits into two clickable elements:
       *   - the heart icon (fires onToggle)
       *   - the count text (fires onCountClick)
       * Use this for kasder-style "tap heart to like, tap count to open likers panel".
       * If omitted, the heart + count behave as a single button (backwards-compatible).
       */
      onCountClick?: () => void;
      align?: EngagementActionAlign;
    }
  | {
      kind: "comment";
      count: number;
      onClick?: () => void;
      align?: EngagementActionAlign;
    }
  | {
      kind: "share";
      count?: number;
      onClick?: () => void;
      align?: EngagementActionAlign;
    }
  | {
      kind: "bookmark";
      bookmarked?: boolean;
      onToggle?: (next: boolean) => void;
      align?: EngagementActionAlign;
    }
  | {
      kind: "view-count";
      count: number;
      align?: EngagementActionAlign;
    }
  | {
      kind: "custom";
      id: string;
      label: string;
      icon: ReactNode;
      count?: number;
      active?: boolean;
      onClick?: () => void;
      align?: EngagementActionAlign;
    }
  | {
      /**
       * Multi-kind reaction action (FB / LinkedIn style). One per-content reaction
       * per viewer; choose from `kinds`. Picker opens on tap-when-null, on
       * tap-when-set if `clearOnTap === false`, or on long-press (350ms) always.
       *
       * Coexists freely with `kind: "like"` per Q-P3 lock — a single content item
       * MAY have both action types in the bar's `actions` array (hybrid UIs are
       * a supported pattern).
       */
      kind: "reaction";
      /** Ordered kind catalog. Single source of truth for icons + labels + seed counts. */
      kinds: EngagementReactionKind[];
      /** Pre-summed total across all kinds. Drives the action's count label. */
      totalCount: number;
      /** Viewer's currently-selected kind key (must match one of `kinds[].key`), or null. */
      viewerReaction?: string | null;
      /** Fires when viewer picks a kind, or `null` to clear. */
      onSelect?: (kind: string | null) => void;
      /**
       * Optional separate click target for the count number — mirrors `like.onCountClick`.
       * Hosts use this to open a reactors panel inline. When unset, count is non-interactive text.
       */
      onCountClick?: () => void;
      /**
       * Tap-with-current-reaction behavior. Default `true` (tap-clears, Twitter-heart style).
       * Set `false` for FB-Reactions parity — tap opens the picker; the picker's `Remove`
       * button is then the clear escape. Long-press always opens the picker regardless.
       */
      clearOnTap?: boolean;
      align?: EngagementActionAlign;
    };

export interface EngagementLikeUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

/**
 * UI-display shape for likers strips and share-menu user pickers.
 * Looser than {@link EngagementLikeUser} (the realtime-delta payload shape) —
 * `username` and `avatar` are optional because UI sources may not always have them.
 */
export interface EngagementLikerProfile {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
}

/** Realtime delta union. Same shape conventions as comment-thread-01 will use. */
export type EngagementDelta =
  | { kind: "like-changed"; count: number; liked?: boolean; userId?: string }
  | { kind: "comment-count-changed"; count: number }
  | { kind: "share-count-changed"; count: number }
  | { kind: "view-count-changed"; count: number }
  | { kind: "bookmark-changed"; bookmarked: boolean }
  | { kind: "liker-added"; user: EngagementLikeUser }
  | { kind: "liker-removed"; userId: string }
  /** Server-authoritative replace of all 3 reaction state fields. Wins over local optimistic ops. */
  | {
      kind: "reaction-changed";
      counts: Record<string, number>;
      totalCount: number;
      viewerReaction?: string | null;
    }
  /** Pass-through to host (bar does not maintain reactor lists; that's the host's `reactionsPreview` slot). */
  | { kind: "reactor-added"; user: EngagementLikeUser; reactionKind: string }
  | { kind: "reactor-removed"; userId: string; reactionKind: string };

export type Unsubscribe = () => void;
export type Subscribe<T> = (handler: (delta: T) => void) => Unsubscribe;

export interface EngagementBarLabels {
  /** Default: "Like". aria-label when not liked. */
  like?: string;
  /** Default: "Unlike". aria-label when liked. */
  unlike?: string;
  /** Default: "Show likers". aria-label for the count-as-button when split via onCountClick. */
  openLikersPanel?: string;
  /** Default: "Comment". aria-label on comment action. */
  comment?: string;
  /** Default: "Share". aria-label on share action. */
  share?: string;
  /** Default: "Bookmark". aria-label when not bookmarked. */
  bookmark?: string;
  /** Default: "Remove bookmark". aria-label when bookmarked. */
  unbookmark?: string;
  /** Default: "Views". aria-label on view-count display. */
  viewCount?: string;
  /** Default: "React". aria-label on the reaction action trigger when `viewerReaction` is null. */
  react?: string;
  /** Default: "Remove reaction". aria-label / button text for the picker's clear-current-reaction control. */
  removeReaction?: string;
  /** Default: "Show reactions". aria-label for the count-as-button on the reaction action when split via onCountClick. */
  openReactionsPanel?: string;
  /** Default: "Pick a reaction". aria-label on the picker popover (group label). */
  reactionPickerLabel?: string;
  /** Optional locale-aware count formatter. Defaults to formatEngagementCount. */
  formatCount?: (n: number) => string;
}

export interface EngagementBar01Props {
  /** The actions to render. Required. Order = render order (within each align group). */
  actions: EngagementAction[];
  /** Variant. Default: "default". */
  variant?: EngagementBar01Variant;
  /** Realtime subscription. Optional. Identity must be stable across renders (memoize via useCallback). */
  subscribe?: Subscribe<EngagementDelta>;
  /** Fires for every delta the subscription emits, regardless of controlled/uncontrolled mode. */
  onSubscribeDelta?: (delta: EngagementDelta) => void;
  /** Slot rendered below the action row. Hosts use for likers preview / "X liked this" / etc. */
  likersPreview?: ReactNode;
  /**
   * Slot rendered below the action row — parallel to `likersPreview`. Hosts use for
   * mixed-kind reactor preview / "Alice, Bob and 42 others reacted" / etc. Rendered
   * unconditionally when provided (does not gate on reaction action presence).
   * When BOTH slots are passed, both render in order: `likersPreview` first, then
   * `reactionsPreview`. Host's call to deduplicate if both would be redundant.
   */
  reactionsPreview?: ReactNode;
  /** Localized labels. Defaults are English. */
  labels?: EngagementBarLabels;
  /** Override classes for the wrapping <div>. */
  className?: string;
  /** Override classes for each action button. */
  actionClassName?: string;
}

export interface EngagementBar01Handle {
  /** Programmatically toggle the like action (flips state + fires onToggle). No-op if no like action present. */
  triggerLike: () => void;
  /** Programmatically toggle the bookmark action. No-op if no bookmark action present. */
  triggerBookmark: () => void;
  /**
   * Programmatically set the viewer's reaction (or `null` to clear). Flips local
   * mirror + fires `action.onSelect` (microtask-deferred per Defense 1). No-op if
   * no reaction action present. No-op if `kind` is not in the action's `kinds[].key` catalog.
   */
  triggerReaction: (kind: string | null) => void;
  /** Read the current optimistic state of all toggleable actions. Includes reaction fields (null when no reaction action). */
  getCurrentState: () => EngagementState;
  /** Convenience read — returns `state.viewerReaction`. Mirrors the `triggerLike`/`getCurrentState` parity. */
  getCurrentReaction: () => string | null;
  /** Reset internal optimistic state to actions' values (no-op for fully-controlled fields). */
  reset: () => void;
}

/** Internal optimistic state shape. Public-readable via getCurrentState() / engagementReducer. */
export interface EngagementState {
  liked: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number | null;
  viewCount: number | null;
  bookmarked: boolean;
  /**
   * Live per-kind tallies. `null` when no `kind: "reaction"` entry is present in
   * the actions array. After init, `reactionCounts[key]` is the source of truth
   * for display — `action.kinds[i].count` is the seed only. Renderers MUST read
   * `state.reactionCounts[k.key] ?? k.count` per kind.
   */
  reactionCounts: Record<string, number> | null;
  /** Live total across all kinds. `null` when no reaction action present. */
  reactionTotalCount: number | null;
  /** Viewer's current reaction key, or `null` if none / no reaction action present. */
  viewerReaction: string | null;
}

/** Reducer action union. Public for hosts driving their own state machines. */
export type EngagementLocalAction =
  | { kind: "like-toggle" }
  | { kind: "bookmark-toggle" }
  /** Pick a kind (string) or clear (`null`). Updates `viewerReaction` + per-kind counts + total. */
  | { kind: "reaction-select"; reactionKind: string | null }
  | { kind: "subscribe-delta"; delta: EngagementDelta }
  | { kind: "reset"; next: EngagementState };

export const DEFAULT_ENGAGEMENT_BAR_LABELS: Required<
  Omit<EngagementBarLabels, "formatCount">
> = {
  like: "Like",
  unlike: "Unlike",
  openLikersPanel: "Show likers",
  comment: "Comment",
  share: "Share",
  bookmark: "Bookmark",
  unbookmark: "Remove bookmark",
  viewCount: "Views",
  react: "React",
  removeReaction: "Remove reaction",
  openReactionsPanel: "Show reactions",
  reactionPickerLabel: "Pick a reaction",
};
