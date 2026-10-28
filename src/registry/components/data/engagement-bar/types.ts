import type { MouseEvent, ReactNode } from "react";

export type EngagementBarVariant = "default" | "compact" | "stacked";

/**
 * Which end of the row an action sits at. `"start"` / `"end"` follow the text direction;
 * `"auto"` (or omitted) = the per-kind default — bookmark + view-count at the end, the rest at
 * the start.
 *
 * `"left"` / `"right"` are deprecated aliases of `"start"` / `"end"` (they always rendered at
 * the row's start / end, so they mirror under `dir="rtl"`).
 */
export type EngagementActionAlign = "start" | "end" | "auto" | "left" | "right";

/**
 * A count shown beside an action. `null` (or omitting it) withholds the count: no number
 * renders and no count reaches any accessible name (consumer contract C6). `0` renders "0",
 * unless the bar's `hideZeroCounts` is set.
 */
export type EngagementCount = number | null;

/**
 * A toggle / select handler. Return a promise to make the change optimistic: it shows at once,
 * and a rejection rolls it back (see `EngagementBarProps.optimistic`).
 */
export type EngagementHandler<T> = (next: T) => void | Promise<unknown>;

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
  /** Localized human label — used in the picker and in accessible names. */
  label: string;
  /**
   * Tally for this kind. Uncontrolled reaction (no `viewerReaction` passed): the seed — live
   * tallies then live in `EngagementState.reactionCounts[key]`. Controlled reaction: wins on
   * every render. `null` / omitted withholds it.
   */
  count?: EngagementCount;
  /** Optional tint (any CSS color) applied to the icon when this is the viewer's current reaction. */
  color?: string;
}

/**
 * The click event an action handler receives (0.7.0). Use `event.currentTarget` to return focus
 * to the button that opened a panel — Safari does not focus a clicked button, so
 * `document.activeElement` is not a reliable opener. Zero-argument handlers stay assignable.
 */
export type EngagementActionEvent = MouseEvent<HTMLElement>;

/**
 * Disclosure state for an action that opens a panel (0.7.0). Pass `expanded` while the panel is
 * open or closed; the button then carries `aria-expanded`, and `aria-controls={controls}` while
 * expanded (a closed panel may be unmounted, so the reference is dropped). Omit `expanded` and the
 * markup is unchanged.
 */
interface EngagementDisclosure {
  /** Whether the panel this action opens is open. Omit for an action that opens nothing. */
  expanded?: boolean;
  /** The `id` of the panel this action opens. Rendered only while `expanded` is `true`. */
  controls?: string;
}

/** Disclosure state for a split count button (like / reaction), whose main button is a toggle. */
interface EngagementCountDisclosure {
  /** Whether the panel the count button opens is open. See {@link EngagementDisclosure}. */
  countExpanded?: boolean;
  /** The `id` of the panel the count button opens. Rendered only while `countExpanded` is `true`. */
  countControls?: string;
}

/** Fields every action arm accepts (`view-count` is display-only and takes no `disabled`). */
interface EngagementActionBase {
  align?: EngagementActionAlign;
  /**
   * Renders the action with `aria-disabled="true"`; it stays focusable but never calls its
   * handler (click, keyboard, long-press, or the imperative handle).
   */
  disabled?: boolean;
  /** Renders nothing for this action; the imperative handle treats it as absent. */
  hidden?: boolean;
}

/** Strict discriminated union — no extra fields. */
export type EngagementAction =
  | (EngagementActionBase & {
      kind: "like";
      /**
       * Like tally. Uncontrolled (`liked` omitted): read once at mount. Controlled (`liked`
       * passed): wins on every render, together with `liked`.
       */
      count?: EngagementCount;
      /** Pass to control the like state (with `count`); omit for uncontrolled. */
      liked?: boolean;
      onToggle?: EngagementHandler<boolean>;
      /**
       * Optional separate click target for the count number. When provided, the
       * like action splits into two clickable elements:
       *   - the heart icon (fires onToggle)
       *   - the count text (fires onCountClick)
       * Use this for kasder-style "tap heart to like, tap count to open likers panel".
       * If omitted, the heart + count behave as a single button. A withheld count renders no
       * count button.
       */
      onCountClick?: (event: EngagementActionEvent) => void;
    } & EngagementCountDisclosure)
  | (EngagementActionBase & {
      kind: "comment";
      /** Wins on every render; a `comment-count-changed` delta shows until this prop next changes. */
      count?: EngagementCount;
      onClick?: (event: EngagementActionEvent) => void;
    } & EngagementDisclosure)
  | (EngagementActionBase & {
      kind: "share";
      /** Wins on every render; a `share-count-changed` delta shows until this prop next changes. */
      count?: EngagementCount;
      onClick?: (event: EngagementActionEvent) => void;
    } & EngagementDisclosure)
  | (EngagementActionBase & {
      kind: "bookmark";
      /** Pass to control the bookmark state; omit for uncontrolled. */
      bookmarked?: boolean;
      onToggle?: EngagementHandler<boolean>;
    })
  | (Omit<EngagementActionBase, "disabled"> & {
      /** Display-only: no handler, so no `disabled` (use `hidden` to remove it). */
      kind: "view-count";
      /** Wins on every render; a `view-count-changed` delta shows until this prop next changes. */
      count?: EngagementCount;
    })
  | (EngagementActionBase & {
      kind: "custom";
      id: string;
      label: string;
      icon: ReactNode;
      count?: EngagementCount;
      /**
       * Renders `aria-pressed` (a toggle). An action that opens a panel passes `expanded` instead;
       * when both are set, `expanded` wins (a button is not both a toggle and a disclosure) and a
       * development warning is logged.
       */
      active?: boolean;
      onClick?: (event: EngagementActionEvent) => void;
    } & EngagementDisclosure)
  | (EngagementActionBase & {
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
      /** Ordered kind catalog. Single source of truth for icons + labels + counts. */
      kinds: EngagementReactionKind[];
      /**
       * Pre-summed total across all kinds; drives the action's count. Uncontrolled: the seed.
       * Controlled (`viewerReaction` passed): wins on every render. `null` / omitted withholds it.
       */
      totalCount?: EngagementCount;
      /**
       * Viewer's currently-selected kind key (must match one of `kinds[].key`), or null.
       * Passing it (string OR null) controls the reaction: `viewerReaction`, every
       * `kinds[i].count` and `totalCount` then win on every render, and the bar no longer
       * applies `reaction-changed` deltas itself (the host gets them via `onSubscribeDelta`).
       */
      viewerReaction?: string | null;
      /** Fires when viewer picks a kind, or `null` to clear. */
      onSelect?: EngagementHandler<string | null>;
      /**
       * Optional separate click target for the count number — mirrors `like.onCountClick`.
       * Hosts use this to open a reactors panel inline. When unset, count is non-interactive text.
       */
      onCountClick?: (event: EngagementActionEvent) => void;
      /**
       * Tap-with-current-reaction behavior. Default `true` (tap-clears, Twitter-heart style).
       * Set `false` for FB-Reactions parity — tap opens the picker; the picker's `Remove`
       * button is then the clear escape. Long-press always opens the picker regardless.
       */
      clearOnTap?: boolean;
    } & EngagementCountDisclosure);

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

/** Realtime delta union. Same shape conventions as comment-thread will use. */
export type EngagementDelta =
  | { kind: "like-changed"; count: number; liked?: boolean; userId?: string }
  | { kind: "comment-count-changed"; count: number }
  | { kind: "share-count-changed"; count: number }
  | { kind: "view-count-changed"; count: number }
  | { kind: "bookmark-changed"; bookmarked: boolean }
  | { kind: "liker-added"; user: EngagementLikeUser }
  | { kind: "liker-removed"; userId: string }
  /** Server-authoritative replace of all 3 reaction state fields (uncontrolled reaction only). */
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

/**
 * Localized strings. Every key is optional on input; omitted (or `undefined`) keys fall back to
 * {@link defaultEngagementBarLabels}. Action names are read with their count appended
 * ("Like 12"), unless the count is withheld.
 */
export interface EngagementBarLabels {
  /** Default: "Like". Name when not liked. */
  like?: string;
  /** Default: "Unlike". Name when liked. */
  unlike?: string;
  /** Default: "Show likers". Name of the count button when split via onCountClick. */
  openLikersPanel?: string;
  /** Default: "Comment". */
  comment?: string;
  /** Default: "Share". */
  share?: string;
  /** Default: "Bookmark". Name when not bookmarked. */
  bookmark?: string;
  /** Default: "Remove bookmark". Name when bookmarked. */
  unbookmark?: string;
  /** Default: "Views". Name of the view-count display. */
  viewCount?: string;
  /** Default: "React". Name of the reaction trigger when `viewerReaction` is null. */
  react?: string;
  /** Default: "Remove reaction". Name of the picker's clear-current-reaction control. */
  removeReaction?: string;
  /** Default: "Show reactions". Name of the reaction count button when split via onCountClick. */
  openReactionsPanel?: string;
  /** Default: "Pick a reaction". Name of the picker group. */
  reactionPickerLabel?: string;
  /** @deprecated Use the bar's `formatCount` prop. Still honoured when `formatCount` is not set. */
  formatCount?: (n: number) => string;
}

/** Fully-resolved labels (what parts receive). */
export type ResolvedEngagementBarLabels = Required<Omit<EngagementBarLabels, "formatCount">>;

export interface EngagementBarProps {
  /** The actions to render. Required. Order = render order (within each align group). */
  actions: EngagementAction[];
  /** Variant. Default: "default". */
  variant?: EngagementBarVariant;
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
  /**
   * Host content rendered inside the action row, after the end-aligned actions (stacked: after
   * the last action). Use it for menus the built-in actions can't express (report, more…).
   */
  trailing?: ReactNode;
  /** Localized labels. Defaults are English. */
  labels?: EngagementBarLabels;
  /** BCP 47 locale for the default count formatter. Default `"en"`. */
  locale?: string;
  /**
   * Count formatter. Default: `Intl.NumberFormat(locale, { notation: "compact" })`
   * ("1.2K" in English, "1,2 B" in Turkish).
   */
  formatCount?: (n: number) => string;
  /**
   * 0.7.0. When `true`, a count of `0` renders no digit and no count in the accessible name, for
   * every counted action (like, comment, share, view-count, custom, reaction); a later `1` renders
   * normally. Default `false` (`0` renders "0"; the reaction action already hides a zero total).
   */
  hideZeroCounts?: boolean;
  /**
   * Applies when `onToggle` / `onSelect` returns a promise. Default `true`: the change shows at
   * once until the promise settles (controlled: or until the props change); a rejection rolls it
   * back to the props (controlled) or to the last accepted value (uncontrolled); only the latest
   * request decides. `false`: only the props (controlled) / only a settled change (uncontrolled)
   * render. A synchronous handler is never optimistic when controlled.
   */
  optimistic?: boolean;
  /**
   * Text direction for the picker's arrow keys. Default: the bar's direction after mount
   * (`"ltr"` before). Layout mirrors through CSS either way.
   */
  dir?: "ltr" | "rtl";
  /**
   * Fires when the reaction picker opens (`true`) or closes (`false`) - by a tap, a long-press,
   * a pick, an outside press, Escape, or the bar unmounting while it is open. Fires only on a
   * change of state, never on mount. Hosts use it to pause surrounding playback while the
   * picker is up. Never called when there is no `kind: "reaction"` action.
   */
  onReactionPickerOpenChange?: (open: boolean) => void;
  /** Override classes for the wrapping <div>. */
  className?: string;
  /** Override classes for each action button. */
  actionClassName?: string;
}

export interface EngagementBarHandle {
  /** Toggle the like action (same path as a click). No-op if no like action, or it is disabled / hidden. */
  triggerLike: () => void;
  /** Toggle the bookmark action. No-op if no bookmark action, or it is disabled / hidden. */
  triggerBookmark: () => void;
  /**
   * Set the viewer's reaction (or `null` to clear) through the same path as a pick
   * (microtask-deferred, per Defense 1). No-op if no reaction action, it is disabled / hidden,
   * or `kind` is not in the action's `kinds[].key` catalog.
   */
  triggerReaction: (kind: string | null) => void;
  /** Read the current shown state of all actions. Includes reaction fields (null when no reaction action). */
  getCurrentState: () => EngagementState;
  /** Convenience read — returns `state.viewerReaction`. Mirrors the `triggerLike`/`getCurrentState` parity. */
  getCurrentReaction: () => string | null;
  /** Reset internal state to the actions' values and drop optimistic / delta overlays. */
  reset: () => void;
}

/**
 * The bar's state shape. `getCurrentState()` returns the shown state (props, optimistic and delta
 * overlays applied); `engagementReducer` works on the same shape. A `null` count is withheld.
 */
export interface EngagementState {
  liked: boolean;
  likeCount: EngagementCount;
  commentCount: EngagementCount;
  shareCount: EngagementCount;
  viewCount: EngagementCount;
  bookmarked: boolean;
  /**
   * Per-kind tallies. `null` when no `kind: "reaction"` entry is present in the actions array;
   * a kind's value is `null` when its count is withheld.
   */
  reactionCounts: Record<string, EngagementCount> | null;
  /** Total across all kinds. `null` when no reaction action is present or the total is withheld. */
  reactionTotalCount: EngagementCount;
  /** Viewer's current reaction key, or `null` if none / no reaction action present. */
  viewerReaction: string | null;
}

/** Reducer action union. Public for hosts driving their own state machines. */
export type EngagementLocalAction =
  | { kind: "like-toggle" }
  /** Set `liked`; adjusts the count by one only when the value changes. */
  | {
      kind: "like-set";
      liked: boolean;
      /** Count to start from when the state's own `likeCount` is `null` (the bar passes the shown count). */
      baseCount?: EngagementCount;
    }
  | { kind: "bookmark-toggle" }
  | { kind: "bookmark-set"; bookmarked: boolean }
  /** Pick a kind (string) or clear (`null`). Updates `viewerReaction` + per-kind counts + total. */
  | {
      kind: "reaction-select";
      reactionKind: string | null;
      /**
       * Tallies to start from for kinds the state has no live count for (added after mount or
       * seeded withheld) — the bar passes the shown counts. Live tallies always win.
       */
      base?: { counts: Record<string, EngagementCount>; total: EngagementCount };
    }
  | { kind: "subscribe-delta"; delta: EngagementDelta }
  | { kind: "reset"; next: EngagementState };

export const defaultEngagementBarLabels: ResolvedEngagementBarLabels = {
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

/** @deprecated Use {@link defaultEngagementBarLabels}. */
export const DEFAULT_ENGAGEMENT_BAR_LABELS = defaultEngagementBarLabels;
