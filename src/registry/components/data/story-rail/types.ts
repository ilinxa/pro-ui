import type { ElementType, ReactNode } from "react";

export interface StoryRailItem {
  id: string;
  username: string;
  avatar?: string;
  /**
   * Portrait preview shown inside the ring. Optional — when absent (or when it
   * fails to load and `onPreviewError` cannot refresh it) the tile renders an
   * avatar card: the author's avatar centred on `bg-muted`.
   */
  previewImage?: string;
  /** Forwarded to the preview `<img srcSet>`. */
  previewSrcSet?: string;
  /** Forwarded to the preview `<img sizes>`. Defaults to `"80px"` when `previewSrcSet` is set. */
  previewSizes?: string;
  /** Drives ring visual: gradient (unread) vs muted (read). Default false. */
  hasUnread?: boolean;
  /**
   * Muted author — grey ring even when unread, tile + name at reduced opacity.
   * Ordering stays the host's. Default false.
   */
  muted?: boolean;
  /** Optional — exposed for downstream story-viewer wiring. */
  userId?: string;
}

export type StoryRailDelta =
  | { kind: "added"; item: StoryRailItem; position?: "start" | "end" }
  | { kind: "removed"; itemId: string }
  | { kind: "viewed"; itemId: string }
  | {
      kind: "updated";
      itemId: string;
      partial: Partial<StoryRailItem>;
    };

export type Unsubscribe = () => void;
export type Subscribe<T> = (handler: (delta: T) => void) => Unsubscribe;

export interface StoryRailLabels {
  /** Default "Stories". aria-label on the rail's <section role="region">. */
  railLabel?: string;
  /** Default "Add story". Visible label below the AddStoryThumbnail (read from the rail's context). */
  addStoryLabel?: string;
  /** Default "Add story" (contains the visible text — WCAG 2.5.3). aria-label for the AddStoryThumbnail button (read from the rail's context). */
  addStoryAriaLabel?: string;
  /**
   * Accessible name of a thumbnail. Receives the whole item (incl. `hasUnread`
   * and `muted`) so hosts can localize / pluralize. Default:
   * "{username}, muted" / "{username}, unread story" / "{username}, viewed".
   */
  thumbnailAriaLabel?: (item: StoryRailItem) => string;
  /** Default "Previous stories". Accessible name of the previous arrow. */
  previousLabel?: string;
  /** Default "Next stories". Accessible name of the next arrow. */
  nextLabel?: string;
  /** Default "No stories yet." Renders when items.length === 0 AND no leading AND no realtime. */
  emptyState?: string;
}

export type ResolvedStoryRailLabels = Required<StoryRailLabels>;

export const DEFAULT_STORY_RAIL_LABELS: ResolvedStoryRailLabels = {
  railLabel: "Stories",
  addStoryLabel: "Add story",
  addStoryAriaLabel: "Add story",
  thumbnailAriaLabel: (item) =>
    item.muted
      ? `${item.username}, muted`
      : item.hasUnread
        ? `${item.username}, unread story`
        : `${item.username}, viewed`,
  previousLabel: "Previous stories",
  nextLabel: "Next stories",
  emptyState: "No stories yet.",
};

export type StoryRailLocalAction =
  | { kind: "add"; item: StoryRailItem; position?: "start" | "end" }
  | { kind: "remove"; itemId: string }
  | { kind: "viewed"; itemId: string }
  | { kind: "update"; itemId: string; partial: Partial<StoryRailItem> }
  | { kind: "subscribe-delta"; delta: StoryRailDelta }
  | { kind: "reset"; next: StoryRailItem[] };

export interface ThumbnailRenderHelpers {
  index: number;
  onClick: () => void;
  /** Stable id for ARIA wiring inside the slot. */
  baseId: string;
  /**
   * Whether the default tile would show the gradient ring:
   * `hasUnread && !muted`. (`isUnread` is the raw `hasUnread`.)
   */
  showRing: boolean;
}

/**
 * Where the previous / next arrows render.
 * - `"none"` (default) — no arrows; pointer drag (mouse included) and Tab focus scroll the rail.
 *   There is no mouse-wheel / trackpad-swipe scrolling (Embla has none without a plugin).
 * - `"fine-pointer"` — only under `(pointer: fine)` (mouse / trackpad), resolved after mount.
 * - `"always"` — on every pointer type.
 */
export type StoryRailArrows = "none" | "fine-pointer" | "always";

export interface StoryRailProps {
  /**
   * Controlled items when `onItemsChange` is also passed: the prop wins on
   * every render, and every mutation (`markViewed`, `dispatch`, `reset`,
   * subscribe deltas) is reported through `onItemsChange` instead of applied.
   * To discard a reported change, re-render with a fresh array.
   *
   * Passed WITHOUT `onItemsChange` it is read once on mount (the pre-0.4
   * behaviour) and a dev-only warning asks you to choose `defaultItems` or
   * `onItemsChange`. Do not switch between controlled and uncontrolled after mount.
   */
  items?: StoryRailItem[];
  /** Uncontrolled seed, read once on mount. Mutations apply internally. */
  defaultItems?: StoryRailItem[];
  /**
   * Receives the next list for every mutation. With `items` it makes the rail
   * controlled; with `defaultItems` (or no items) the rail stays uncontrolled
   * and only notifies.
   */
  onItemsChange?: (next: StoryRailItem[]) => void;

  /** Optional content rendered before items (typically <AddStoryThumbnail>). */
  leading?: ReactNode;

  /** Wrap the rail in card-style chrome (bg-card + border + rounded). Default true. */
  framed?: boolean;

  /** Realtime delta stream. Identity-stable required (useCallback host-side). */
  subscribe?: Subscribe<StoryRailDelta>;
  onSubscribeDelta?: (delta: StoryRailDelta) => void;

  /**
   * Click handler — object-shape. Host typically opens a story viewer.
   * v0.2 cutover from positional `(item, index)`.
   */
  onItemClick?: (args: { item: StoryRailItem; index: number }) => void;

  /**
   * Called when a preview image fails to load (e.g. an expired signed URL).
   * Resolve a new URL to retry once with it; resolve nothing (or reject) to
   * fall back to the avatar card. A new `previewImage` on the item resets it.
   */
  onPreviewError?: (item: StoryRailItem) => Promise<string | void>;

  /**
   * Previous / next arrows. Default `"none"`. Vertically centred on the default
   * 112px tile; override with `--story-rail-arrow-top` for custom tiles.
   */
  arrows?: StoryRailArrows;

  /** Text direction. Default: the nearest `[dir]` ancestor, else `"ltr"`. */
  dir?: "ltr" | "rtl";

  /** Polymorphic root for the thumbnail when getHref provided. Default `"a"`. */
  linkComponent?: ElementType;
  /** When provided, thumbnail renders as `<linkComponent href={getHref(item)}>` instead of `<button>`. Click also fires onItemClick if both wired. */
  getHref?: (item: StoryRailItem) => string;

  /** Full-takeover render slot for the thumbnail visual. */
  renderThumbnail?: (
    item: StoryRailItem,
    isUnread: boolean,
    helpers: ThumbnailRenderHelpers,
  ) => ReactNode;

  /** Empty-state slot. Wins over labels.emptyState fallback. */
  emptyState?: ReactNode;

  labels?: StoryRailLabels;

  className?: string;
  thumbnailClassName?: string;

  ref?: React.Ref<StoryRailHandle>;
}

export interface StoryRailHandle {
  /** Scroll so the item at `index` (in `items`, not counting `leading`) sits at the start. */
  scrollTo: (index: number) => void;
  getCurrentItems: () => StoryRailItem[];
  reset: (next: StoryRailItem[]) => void;
  dispatch: (action: StoryRailLocalAction) => void;
  /** Mark a story as viewed (sets hasUnread=false). Call from your viewer's onClose. */
  markViewed: (itemId: string) => void;
}
