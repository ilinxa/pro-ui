import type { ElementType, ReactNode } from "react";

export interface StoryRailItem {
  id: string;
  username: string;
  avatar?: string;
  /** Rectangular preview shown inside the gradient/muted ring. */
  previewImage: string;
  /** Drives ring visual: gradient (unread) vs muted (read). Default false. */
  hasUnread?: boolean;
  /** Optional — exposed for downstream story-viewer-01 wiring. */
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

export interface StoryRail01Labels {
  /** Default "Stories". aria-label on the rail's <section role="region">. */
  railLabel?: string;
  /** Default "Add story". Visible label below the AddStoryThumbnail. */
  addStoryLabel?: string;
  /** Default "Add a story". aria-label for the AddStoryThumbnail button. */
  addStoryAriaLabel?: string;
  /** Function so hosts can pluralize / localize. Default returns "{username}, unread story" / "{username}, viewed". */
  thumbnailAriaLabel?: (item: StoryRailItem) => string;
  /** Default "No stories yet." Renders when items.length === 0 AND no leading AND no realtime. */
  emptyState?: string;
}

export const DEFAULT_STORY_RAIL_LABELS: Required<
  Omit<StoryRail01Labels, "thumbnailAriaLabel">
> = {
  railLabel: "Stories",
  addStoryLabel: "Add story",
  addStoryAriaLabel: "Add a story",
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
}

export interface StoryRail01Props {
  /** Items rendered in the rail. Mount-only initial state — use ref.current.reset() to push updates. */
  items: StoryRailItem[];

  /** Optional content rendered before items (typically <AddStoryThumbnail>). */
  leading?: ReactNode;

  /** Wrap the rail in card-style chrome (bg-card + border + rounded). Default true. */
  framed?: boolean;

  /** Realtime delta stream. Identity-stable required (useCallback host-side). */
  subscribe?: Subscribe<StoryRailDelta>;
  onSubscribeDelta?: (delta: StoryRailDelta) => void;

  /**
   * Click handler — positional signature. Host typically opens a story viewer.
   * @deprecated Use `onItemClickArgs` for the object-shape signature. v0.2 will
   *   remove the positional shape and rename `onItemClickArgs` → `onItemClick`.
   */
  onItemClick?: (item: StoryRailItem, index: number) => void;
  /**
   * Click handler — object-shape signature; wins over `onItemClick`
   * (deprecated positional) when both are provided.
   */
  onItemClickArgs?: (args: { item: StoryRailItem; index: number }) => void;

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

  labels?: StoryRail01Labels;

  className?: string;
  thumbnailClassName?: string;

  ref?: React.Ref<StoryRail01Handle>;
}

export interface StoryRail01Handle {
  scrollTo: (index: number) => void;
  getCurrentItems: () => StoryRailItem[];
  reset: (next: StoryRailItem[]) => void;
  dispatch: (action: StoryRailLocalAction) => void;
  /** Mark a story as viewed (sets hasUnread=false). Call from your viewer's onClose. */
  markViewed: (itemId: string) => void;
}
