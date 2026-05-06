import type { ReactNode } from "react";

export type EngagementBar01Variant = "default" | "compact" | "stacked";

export type EngagementActionAlign = "left" | "right" | "auto";

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
    };

export interface EngagementLikeUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

/** Realtime delta union. Same shape conventions as comment-thread-01 will use. */
export type EngagementDelta =
  | { kind: "like-changed"; count: number; liked?: boolean; userId?: string }
  | { kind: "comment-count-changed"; count: number }
  | { kind: "share-count-changed"; count: number }
  | { kind: "view-count-changed"; count: number }
  | { kind: "bookmark-changed"; bookmarked: boolean }
  | { kind: "liker-added"; user: EngagementLikeUser }
  | { kind: "liker-removed"; userId: string };

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
  /** Read the current optimistic state of all toggleable actions. */
  getCurrentState: () => EngagementState;
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
}

/** Reducer action union. Public for hosts driving their own state machines. */
export type EngagementLocalAction =
  | { kind: "like-toggle" }
  | { kind: "bookmark-toggle" }
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
};
