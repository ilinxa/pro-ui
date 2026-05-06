import type { ReactNode } from "react";

// ─── Data shapes ────────────────────────────────────────────────────────

export interface StoryItem {
  id: string;
  type: "image" | "video";
  src: string;
  /** Display duration in seconds. Default 5 for images; for videos, viewer reads the actual duration via onLoadedMetadata. */
  duration?: number;
}

export interface Story {
  id: string;
  /** Stable user id — useful for cross-rail wiring. */
  userId: string;
  username: string;
  avatar?: string;
  items: StoryItem[];
  hasUnread?: boolean;
  /** ISO date string (matches the pro-ui convention from event-card-01 / content-card-news-01). */
  createdAt: string;
}

// ─── Realtime contract ──────────────────────────────────────────────────

export type Unsubscribe = () => void;
export type Subscribe<TDelta> = (handler: (delta: TDelta) => void) => Unsubscribe;

export type StoryViewerDelta =
  | { kind: "story-added"; story: Story; position?: "start" | "end" }
  | { kind: "story-removed"; storyId: string }
  | { kind: "item-added"; storyId: string; item: StoryItem; position?: "start" | "end" }
  | { kind: "item-removed"; storyId: string; itemId: string }
  | { kind: "story-viewed"; storyId: string };

export type StoryViewerLocalAction =
  | { kind: "add-story"; story: Story; position?: "start" | "end" }
  | { kind: "remove-story"; storyId: string }
  | { kind: "add-item"; storyId: string; item: StoryItem; position?: "start" | "end" }
  | { kind: "remove-item"; storyId: string; itemId: string }
  | { kind: "patch-story"; storyId: string; partial: Partial<Story> }
  | { kind: "subscribe-delta"; delta: StoryViewerDelta }
  | { kind: "reset"; next: Story[] };

// ─── Render-prop helpers ────────────────────────────────────────────────

export interface RenderItemContext {
  storyIndex: number;
  itemIndex: number;
  isPaused: boolean;
  isMuted: boolean;
}

// ─── i18n ───────────────────────────────────────────────────────────────

export interface StoryViewer01Labels {
  /** aria-label for the modal. Default: "Story viewer". */
  viewerLabel?: string;
  /** aria-label for the play button (when paused). Default: "Play". */
  play?: string;
  /** aria-label for the pause button (when playing). Default: "Pause". */
  pause?: string;
  /** aria-label for the mute button (when audio is on). Default: "Mute". */
  mute?: string;
  /** aria-label for the unmute button (when audio is off). Default: "Unmute". */
  unmute?: string;
  /** aria-label for the close button. Default: "Close". */
  close?: string;
  /** aria-label for the previous-story arrow. Default: "Previous story". */
  prevStory?: string;
  /** aria-label for the next-story arrow. Default: "Next story". */
  nextStory?: string;
  /** Format the relative time shown in the header. */
  formatTime?: (date: Date) => string;
  /** Default alt text for image items. */
  itemImageAlt?: (story: Story, itemIndex: number, totalItems: number) => string;
}

export const DEFAULT_STORY_VIEWER_LABELS: Required<StoryViewer01Labels> = {
  viewerLabel: "Story viewer",
  play: "Play",
  pause: "Pause",
  mute: "Mute",
  unmute: "Unmute",
  close: "Close",
  prevStory: "Previous story",
  nextStory: "Next story",
  formatTime: (date: Date) =>
    new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date),
  itemImageAlt: (story: Story, idx: number, total: number) =>
    `${story.username}, story image ${idx + 1} of ${total}`,
};

// ─── Imperative handle ──────────────────────────────────────────────────

export interface StoryViewer01Handle {
  /** Jump to a specific story by index (item index resets to 0). */
  goToStory: (index: number) => void;
  /** Jump to a specific item within the current story. */
  goToItem: (index: number) => void;
  /** Force pause/resume from outside (matches the in-component pause state). */
  setPaused: (paused: boolean) => void;
  /** Read current navigation cursor. */
  getCursor: () => { storyIndex: number; itemIndex: number };
  /** Read current stories snapshot (post-realtime patches). */
  getCurrentStories: () => Story[];
  /** Re-seed external state push (always-uncontrolled escape hatch). */
  reset: (next: Story[]) => void;
  /** Surgical state edit. */
  dispatch: (action: StoryViewerLocalAction) => void;
}

// ─── Props ──────────────────────────────────────────────────────────────

export interface StoryViewer01Props {
  /** Story list. **Mount-only** — subsequent prop changes are ignored; push updates via `ref.current.reset(next)` or `dispatch`. */
  stories: Story[];
  /** Which story to open (item always starts at 0). */
  initialStoryIndex: number;
  /** Controlled open state. */
  isOpen: boolean;
  /** Fires on Escape, backdrop click, close button, or auto-close at end of last story. */
  onClose: () => void;
  /** Imperative handle. */
  ref?: React.Ref<StoryViewer01Handle>;

  // ─── Realtime ──────────────────────────────────────────────────────────
  /** Live source. Memoize via useCallback over a stable channel ref; identity changes trigger clean teardown + re-call. Mount-scoped. */
  subscribe?: Subscribe<StoryViewerDelta>;
  /** Fires for every delta; useful for analytics / cross-component coordination. */
  onSubscribeDelta?: (delta: StoryViewerDelta) => void;

  // ─── Lifecycle callbacks ──────────────────────────────────────────────
  /** Forward-completion only — fires when the user advances forward into the next story OR when the last item completes naturally. Does NOT fire on backward navigation (matches Instagram). */
  onStoryViewed?: (storyId: string) => void;
  /** Fires when an item completes naturally OR is navigated past forward. */
  onItemViewed?: (storyId: string, itemId: string, itemIndex: number) => void;
  /** Fires whenever the cursor moves (manual nav or auto-advance). */
  onCursorChange?: (storyIndex: number, itemIndex: number) => void;
  /** Fires synchronously immediately before `onClose()` when the auto-close triggers at end of the last story. */
  onAutoCloseAtEnd?: () => void;

  // ─── Slots ─────────────────────────────────────────────────────────────
  /** Custom item renderer. When provided, replaces the default branching on item.type. Hosts using this MUST set `item.duration` explicitly for non-video items. */
  renderItem?: (item: StoryItem, context: RenderItemContext) => ReactNode;

  // ─── Defaults ──────────────────────────────────────────────────────────
  /** Default item duration in seconds when neither item.duration nor video metadata is available. Default 5. */
  defaultItemDuration?: number;

  // ─── i18n ──────────────────────────────────────────────────────────────
  labels?: StoryViewer01Labels;

  // ─── Style overrides ──────────────────────────────────────────────────
  /** Extra classes for the inner content wrapper. */
  className?: string;
  /** Extra classes for the modal content surface. */
  contentClassName?: string;
}
