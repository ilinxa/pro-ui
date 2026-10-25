import type { ElementType, ReactNode } from "react";
import { formatRelativeTime } from "./lib/relative-time";

// ─── Data shapes ────────────────────────────────────────────────────────

/**
 * v0.2.0 — optional link CTA on a story item. Surfaces as a bottom button
 * (per Q-V9 lock). Custom CTA label via `cta`; otherwise defaults to
 * `labels.openLink` ("Open link").
 */
export interface StoryItemLink {
  url: string;
  /** Custom CTA label. Defaults to `labels.openLink`. */
  cta?: string;
}

export interface StoryItem {
  id: string;
  type: "image" | "video";
  /**
   * Media URL. Optional: omit it when the host supplies the URL lazily through
   * {@link StoryViewerProps.resolveMedia} (called for the current and the next item only).
   * An item with a `src` is played as is and is never passed to `resolveMedia`. An item with
   * neither a `src` nor a `resolveMedia` is unavailable (reason `"resolve"`).
   */
  src?: string;
  /** Display duration in seconds. Default 5 for images; for videos, viewer reads the actual duration via onLoadedMetadata. */
  duration?: number;
  /**
   * 0.6.0 - plain-text caption shown over the lower part of the media. Rendered as a text node
   * (never as HTML) with `dir="auto"`, so a right-to-left caption in a left-to-right UI (and the
   * reverse) lays out correctly.
   */
  caption?: string;
  /**
   * 0.6.0 - ISO date this item was posted. The header time uses it when set, else
   * {@link Story.createdAt}. Formatted with {@link StoryViewerProps.locale} unless
   * `labels.formatTime` is given.
   */
  createdAt?: string;
  /**
   * v0.2.0 — optional link CTA rendered as a bottom button above the
   * engagement overlay. Polymorphic root via {@link StoryViewerProps.linkComponent}.
   */
  link?: StoryItemLink;
  /**
   * Initial per-item engagement counts and the viewer's own state, seeded into the viewer's
   * per-item engagement state the first time this item is shown. Live changes (a like toggle,
   * a reaction pick, an `engagementSubscribe` delta, a reply) apply on top of the seed.
   * `null` for a count = withheld: no number is rendered for it. Omitted fields default to
   * `0` / `false` / `null` as before.
   */
  engagement?: StoryItemEngagement;
  /**
   * Owner mode - this item's view count, shown on the view-count chip while this item is
   * current. `null` = withheld (no number rendered). When omitted, {@link Story.viewerCount}
   * is the fallback.
   */
  viewerCount?: number | null;
}

/** Initial engagement values for one item - see {@link StoryItem.engagement}. */
export interface StoryItemEngagement {
  /** Like tally. `null` = withheld (no number rendered). */
  likeCount?: number | null;
  /** Whether the viewer has already liked this item. */
  liked?: boolean;
  /** Total reactions across all kinds. `null` = withheld (no number rendered). */
  reactionCount?: number | null;
  /** The viewer's current reaction key, or `null` for none. */
  viewerReaction?: string | null;
  /** Reply / comment tally. `null` = withheld (no number rendered). */
  replyCount?: number | null;
}

/**
 * v0.2.0 — single viewer entry for the owner-mode viewers list. Relaxed
 * fields (parallel to engagement-bar's EngagementLikerProfile). Eager
 * seed via {@link Story.viewers}; lazy fetch via
 * {@link StoryViewerProps.onLoadViewers}.
 */
export interface ViewerListItem {
  id: string;
  name: string;
  avatar?: string;
  /** ISO date of when this user viewed the story. Optional. */
  viewedAt?: string;
}

/** One page of the owner-mode viewers list - the return type of `onLoadViewers`. */
export interface StoryViewersPage {
  items: ViewerListItem[];
  /** Cursor for the next page, or `null` when this was the last page. */
  nextCursor: string | null;
}

export interface Story {
  id: string;
  /** Stable user id — useful for cross-rail wiring. */
  userId: string;
  username: string;
  avatar?: string;
  items: StoryItem[];
  hasUnread?: boolean;
  /**
   * 0.6.0 — host-muted group. Every sequential move skips a muted group, in
   * both directions: auto-advance at the end of the previous story, next /
   * previous by tap, arrow key or swipe, and the swipe-preview neighbours. A
   * direct open (`initialStoryIndex`, `goToStory(index)`) still plays it. When
   * only muted groups remain ahead, the end of the current story behaves like
   * the end of the last one (close, or stay open with `disableAutoClose`).
   */
  muted?: boolean;
  /** ISO date string (matches the pro-ui convention from event-card / news-card). */
  createdAt: string;
  /**
   * Eager view count for the owner overlay - the fallback when the current item has no
   * {@link StoryItem.viewerCount}. `null` = withheld (no number rendered). The user list
   * itself is lazy via {@link StoryViewerProps.onLoadViewers}.
   */
  viewerCount?: number | null;
  /**
   * v0.2.0 — optional eager seed for the viewers list (hybrid Q-V5 lock). If
   * present, the owner overlay renders these immediately without waiting for
   * `onLoadViewers`. If absent, the overlay shows the count + a tap target that
   * triggers `onLoadViewers` on first expand.
   */
  viewers?: ViewerListItem[];
}

// ─── 0.6.0 — state & data contract ───────────────────────────────────────

/** Why an item stopped being playable (`onItemUnavailable`). */
export type StoryItemUnavailableReason = "resolve" | "media" | "removed" | "timeout";

/** How an item was left (`onItemViewed`'s 4th argument). */
export type StoryItemViewedCause = "completed" | "left";

/**
 * Built-in pause reasons. The viewer is paused while the reason set is not
 * empty; hosts may add their own strings through `pauseReasons`.
 * `user` = middle tap / Space (cleared on item change) · `host` =
 * `ref.setPaused(true)` · `hold` = long press · `reply-focus` = reply composer
 * focused or holding a draft · `sheet` = any layer open · `hidden-tab` = the
 * browser tab is in the background · `unavailable` = the removal notice shows.
 */
export type StoryViewerPauseReason =
  | "user"
  | "host"
  | "hold"
  | "reply-focus"
  | "sheet"
  | "hidden-tab"
  | "unavailable";

/**
 * The on-screen item vanished from `stories`; the viewer keeps this frame (no
 * media, never playing) for `unavailableNoticeMs`, then repairs the cursor.
 * `story` / `item` are the last known snapshots, so a notice can still show the
 * author. With `standalone` and a single-item story it stays until the viewer closes.
 */
export interface StoryViewerPendingRemoval {
  storyId: string;
  itemId: string;
  reason: "removed";
  story: Story;
  item: StoryItem;
  /** True when the notice never auto-repairs (standalone + single-item story). */
  stayUntilClosed: boolean;
}

// ─── Realtime contract — viewer-state stream (v0.1.x; preserved) ─────────

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

// ─── v0.2.0 — engagement realtime (SEPARATE stream from StoryViewerDelta) ──
//
// Per Q-V3 lock: post-card precedent has separate `engagementSubscribe` +
// `commentSubscribe` streams. story-viewer mirrors with two streams:
// the existing `subscribe` (StoryViewerDelta — story-list mutations) and the
// new `engagementSubscribe` (StoryEngagementDelta — engagement events).
// Per Q-V16 lock: existing `subscribe` prop name preserved (asymmetric but
// zero v0.1 breakage).

export type StoryEngagementDelta =
  | { kind: "like-changed"; storyId: string; itemId: string; count: number; liked?: boolean }
  | { kind: "reaction-changed"; storyId: string; itemId: string; reactionKind?: string | null; count: number }
  | { kind: "reply-added"; storyId: string; itemId: string; replyId: string }
  | { kind: "viewer-added"; storyId: string; viewer: ViewerListItem }
  | { kind: "view-count-changed"; storyId: string; count: number };

/**
 * Local engagement actions. `seed` is attached by the viewer: the item's
 * {@link StoryItem.engagement}, so the first change to an item applies on top of it.
 */
export type StoryEngagementLocalAction =
  | { kind: "like-toggle"; storyId: string; itemId: string; nextLiked: boolean; seed?: StoryItemEngagement }
  | { kind: "reaction-select"; storyId: string; itemId: string; reactionKind: string | null; seed?: StoryItemEngagement }
  | { kind: "subscribe-delta"; delta: StoryEngagementDelta; seed?: StoryItemEngagement }
  | { kind: "reset"; storyId: string; itemId: string };

// ─── v0.2.0 — permissions (mirrors post-card v0.3.0 resolver) ─────────
//
// Per Q-V10 lock: resolution order verbatim from post-card:
//   1. canPerformAction(action, story, item) returning true|false — wins
//   2. permissions[canX] per-field — false denies, true allows
//   3. viewerMode-derived defaults from PERMISSION_DEFAULTS_BY_MODE
//   4. (legacy v0.1 mode short-circuits in defaultStoryKebabActions when
//      all 3 role-aware inputs are undefined)

export type StoryViewerMode = "owner" | "viewer";

/**
 * What an item-level handler (`onDeleteStory`, `onReport`, `onCopyLink`, `onSaveToHighlights`,
 * `onShareToFeed`) receives: the story and the item that were current when the action was
 * chosen. `onMuteAuthor` / `onBlockAuthor` act on the author and keep receiving the author id.
 */
export interface StoryItemTarget {
  story: Story;
  item: StoryItem;
}

/**
 * Discriminator for the universal `canPerformAction` predicate.
 *
 * - Owner-side: `saveToHighlights`, `deleteStory`, `shareToFeed`, `seeViewers`
 * - Viewer-side: `like`, `react`, `reply`, `share`, `dm`, `report`, `blockAuthor`, `muteAuthor`
 * - Orthogonal: `moderate` (per Q-V11 lock — never auto-derived from viewerMode)
 */
export type StoryPermissionAction =
  | "saveToHighlights"
  | "deleteStory"
  | "shareToFeed"
  | "seeViewers"
  | "like"
  | "react"
  | "reply"
  | "share"
  | "dm"
  | "report"
  | "blockAuthor"
  | "muteAuthor"
  | "moderate";

/**
 * Per-action permissions matrix. Overrides the `viewerMode`-derived defaults.
 * Resolution order documented in {@link StoryViewerMode}.
 *
 * `canModerate` defaults to `false` in BOTH viewer modes — moderators must be
 * opted in explicitly by the host's permission resolver (mirrors post-card).
 *
 * Note: `canDM` casing intentional (DM as an acronym; not `canDm`). The
 * `actionToPermissionKey` helper in `lib/permissions.ts` special-cases this.
 */
export interface StoryViewerPermissions {
  // owner-side
  canSaveToHighlights?: boolean;
  canDeleteStory?: boolean;
  canShareToFeed?: boolean;
  canSeeViewers?: boolean;
  // viewer-side
  /**
   * The like (heart) action. When omitted it resolves to the same answer as `canReact`
   * (the mode default, a `permissions.canReact` override, or `canPerformAction("react")`),
   * so a host that never sets it sees today's output. Set it to gate likes separately.
   */
  canLike?: boolean;
  /** The reaction picker action. */
  canReact?: boolean;
  canReply?: boolean;
  canShare?: boolean;
  canDM?: boolean;
  canReport?: boolean;
  canBlockAuthor?: boolean;
  canMuteAuthor?: boolean;
  // orthogonal (default false in BOTH modes — explicit-only, never auto-derived)
  canModerate?: boolean;
}

// ─── v0.2.0 — inline-copies from engagement-bar (F-S1 Bug 3 fix) ──────
//
// engagement-bar is in `data/` category; story-viewer is in `media/`.
// Cross-category `/types` imports do NOT survive the shadcn 4.6.0 path
// rewriter (mangles to wrong-slug or invalid `<cat>/` prefix). Therefore
// these shapes are INLINE-COPIED — kept structurally identical to upstream.
//
// SYNC WARNING: if @ilinxa/engagement-bar changes any of these shapes
// in a future bump, this file MUST be updated manually. The upstream
// definitions live at src/registry/components/data/engagement-bar/types.ts.
//
// NOTE — orphan arms: `kind: "bookmark"` + `kind: "view-count"` arms are
// part of the inline-copy for structural sync with upstream, but story-
// viewer-01 never produces them (bookmark was removed in v0.3.0; view-
// count lives in the owner overlay rather than the engagement bar). The
// `labels.bookmark` / `labels.unbookmark` keys on `StoryEngagementBarLabels`
// are similarly orphaned. Kept as-is so that an upstream EngagementAction
// passed through a slot still type-checks.

/**
 * Inlined from engagement-bar's `EngagementActionAlign` (0.5.0). `"start"` / `"end"` follow the
 * text direction; `"left"` / `"right"` are deprecated aliases of them.
 */
export type StoryEngagementActionAlign = "start" | "end" | "auto" | "left" | "right";

/** Inlined from engagement-bar's `EngagementCount`. `null` withholds the count (no number rendered). */
export type StoryEngagementCount = number | null;

/** Inlined from engagement-bar's `EngagementHandler`. A returned promise makes the change optimistic. */
export type StoryEngagementHandler<T> = (next: T) => void | Promise<unknown>;

/**
 * Inlined from engagement-bar's `EngagementReactionKind` (0.5.0).
 * Used by the reaction action in {@link StoryEngagementAction}.
 */
export interface StoryEngagementReactionKind {
  /** Stable identifier matching backend payloads (e.g. `"love"`, `"laugh"`). */
  key: string;
  /** Host-supplied icon node (lucide / emoji / image). Library does not ship reaction icons. */
  icon: ReactNode;
  /** Localized human label — used in picker tooltip + aria-label. */
  label: string;
  /** Seed tally for this kind. `null` / omitted withholds it. */
  count?: StoryEngagementCount;
  /** Optional tint applied to the icon when this is the viewer's current reaction. */
  color?: string;
}

/** Fields every engagement action arm accepts (`view-count` takes no `disabled`). */
interface StoryEngagementActionBase {
  align?: StoryEngagementActionAlign;
  /** Renders the action `aria-disabled`; it stays focusable but never calls its handler. */
  disabled?: boolean;
  /** Renders nothing for this action. */
  hidden?: boolean;
}

/**
 * Inlined from engagement-bar's `EngagementAction` discriminated union (0.5.0). Must stay
 * assignable to engagement-bar's own type - guarded by `__tests__/engagement-types.test.ts`.
 */
export type StoryEngagementAction =
  | (StoryEngagementActionBase & {
      kind: "like";
      count?: StoryEngagementCount;
      liked?: boolean;
      onToggle?: StoryEngagementHandler<boolean>;
      onCountClick?: () => void;
    })
  | (StoryEngagementActionBase & {
      kind: "comment";
      count?: StoryEngagementCount;
      onClick?: () => void;
    })
  | (StoryEngagementActionBase & {
      kind: "share";
      count?: StoryEngagementCount;
      onClick?: () => void;
    })
  | (StoryEngagementActionBase & {
      kind: "bookmark";
      bookmarked?: boolean;
      onToggle?: StoryEngagementHandler<boolean>;
    })
  | (Omit<StoryEngagementActionBase, "disabled"> & {
      kind: "view-count";
      count?: StoryEngagementCount;
    })
  | (StoryEngagementActionBase & {
      kind: "custom";
      id: string;
      label: string;
      icon: ReactNode;
      count?: StoryEngagementCount;
      active?: boolean;
      onClick?: () => void;
    })
  | (StoryEngagementActionBase & {
      kind: "reaction";
      kinds: StoryEngagementReactionKind[];
      /** Pre-summed total across all kinds. `null` / omitted withholds it. */
      totalCount?: StoryEngagementCount;
      viewerReaction?: string | null;
      onSelect?: StoryEngagementHandler<string | null>;
      onCountClick?: () => void;
      clearOnTap?: boolean;
    });

/**
 * Inlined from engagement-bar's `EngagementBarLabels` (0.5.0).
 * Used as a nested forward inside {@link StoryViewerLabels.engagementLabels}.
 */
export interface StoryEngagementBarLabels {
  like?: string;
  unlike?: string;
  openLikersPanel?: string;
  comment?: string;
  share?: string;
  bookmark?: string;
  unbookmark?: string;
  viewCount?: string;
  react?: string;
  removeReaction?: string;
  openReactionsPanel?: string;
  reactionPickerLabel?: string;
  formatCount?: (n: number) => string;
}

// ─── v0.2.0 — inline-copies from comment-thread (F-S1 Bug 3 fix) ─────
//
// CommentThreadCurrentUser shape — small enough that a local minimal type
// matches the upstream contract structurally without needing the full inline-copy.
// CommentComposer is called directly from `parts/reply-composer.tsx` using
// its component import (cross-cat absolute-with-suffix path — works through
// the rewriter for components).

export interface StoryCurrentUser {
  id: string;
  name: string;
  avatar?: string;
}

/**
 * Inlined subset of CommentThreadLabels (the 3 composer-relevant keys).
 * Used as a nested forward inside {@link StoryViewerLabels.commentLabels}.
 */
export interface StoryReplyComposerLabels {
  composerPlaceholder?: string;
  composerSend?: string;
  composerCancel?: string;
}

// ─── Render-prop helpers ────────────────────────────────────────────────

/** The result of {@link StoryViewerProps.resolveMedia}. */
export interface StoryResolvedMedia {
  /** The media URL to play. */
  src: string;
  /** Poster for a video item (shown before playback). */
  poster?: string;
}

export interface RenderItemContext {
  storyIndex: number;
  itemIndex: number;
  isPaused: boolean;
  isMuted: boolean;
  /**
   * The media URL to render: `item.src`, else the URL `resolveMedia` returned, or the one
   * `onMediaError` supplied for the retry. `undefined` only while it is resolving (the frame is
   * then not ready, so the item does not count down).
   */
  src?: string;
  /** The poster `resolveMedia` returned, if any. */
  poster?: string;
  /**
   * The frame can render. Optional: a custom frame counts as ready as soon as it mounts, so calling
   * this changes nothing and is always safe.
   */
  onReady: () => void;
  /** The frame's media finished: the item advances. Fires the advance once per item. */
  onEnded: () => void;
  /**
   * The frame's media time, in seconds. Once a frame reports a finite `duration` above zero and the
   * item has no explicit `duration`, the progress bar follows `currentTime / duration` instead of
   * the default-duration timer. The item still ends only through `onEnded` (or `item.duration`
   * when set), so call `onEnded` when the frame's media finishes.
   */
  onProgress: (currentTime: number, duration: number) => void;
  /**
   * The frame's media failed. With {@link StoryViewerProps.onMediaError} the viewer asks it once for
   * a new `src` (delivered as `ctx.src`); without a new `src` the item is unavailable
   * (`"media"`). Without `onMediaError` the item is unavailable (`"media"`) at once.
   */
  onError: () => void;
}

/**
 * v0.2.0 — shared helper context passed to all renderXxx slots (except renderItem).
 */
export interface StoryViewerSlotHelpers {
  cursor: { storyIndex: number; itemIndex: number };
  isPaused: boolean;
  isMuted: boolean;
  setPaused: (paused: boolean) => void;
  setMuted: (muted: boolean) => void;
  goToPrevItem: () => void;
  goToNextItem: () => void;
  goToPrevStory: () => void;
  goToNextStory: () => void;
  onClose: () => void;
  labels: ResolvedStoryViewer01Labels;
}

// ─── i18n ───────────────────────────────────────────────────────────────

export interface StoryViewerLabels {
  // v0.1 (preserved)
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
  /** 0.6.0 - assistive-tech button: previous item of the current story. Default: "Previous item". */
  prevItem?: string;
  /** 0.6.0 - assistive-tech button: next item of the current story. Default: "Next item". */
  nextItem?: string;
  /**
   * 0.6.0 - polite announcement when the item changes. `index` is zero-based (like
   * `itemImageAlt`). Default: `${author}, ${index + 1} of ${total}`.
   */
  position?: (author: string, index: number, total: number) => string;
  /**
   * Format the time shown in the header (and the owner overlay). Wins over the default, which is a
   * relative time ("5 min. ago") formatted with {@link StoryViewerProps.locale}.
   */
  formatTime?: (date: Date) => string;
  /** Default alt text for image items. */
  itemImageAlt?: (story: Story, itemIndex: number, totalItems: number) => string;

  // v0.2.0 — engagement overlay
  /** aria-label on the reaction picker popover. Default: "Pick a reaction". */
  reactionPickerLabel?: string;

  // v0.2.0 — reply composer
  /** Function so hosts can interpolate `${story.username}`. Default: `Reply to ${story.username}…`. */
  replyComposerPlaceholder?: (story: Story) => string;
  /** Default: "Send". */
  replyComposerSend?: string;
  /** Default: "Cancel". */
  replyComposerCancel?: string;

  // v0.2.0 — owner overlay
  /** Function so hosts can pluralize / localize. Default: `${count} views · ${time}`. */
  /** Owner chip name. `formatted` is `count` formatted for `locale` (0.6.0). */
  viewerCountLabel?: (count: number, time: string, formatted?: string) => string;
  /** Default: "Viewers". */
  viewersHeading?: string;
  /** Function so hosts can pluralize. Default: `+${count} more`. */
  viewersMoreLabel?: (count: number) => string;
  /** Viewers list, while a page is loading. Default: "Loading viewers…". */
  viewersLoading?: string;
  /** Viewers list, when there are no viewers. Default: "No viewers yet.". */
  viewersEmpty?: string;
  /** Viewers list, the button that loads the next page. Default: "Load more". */
  viewersLoadMore?: string;
  /** Viewers list, the message shown when loading a page failed. Default: "Could not load viewers.". */
  viewersError?: string;
  /** Viewers list, the button that repeats a failed load. Default: "Retry". */
  viewersRetry?: string;

  // v0.2.0 — owner kebab
  /** Default: "Save to highlights". */
  saveToHighlights?: string;
  /** Default: "Remove from highlights". */
  unsaveFromHighlights?: string;
  /** Default: "Delete story". */
  deleteStory?: string;
  /** Default: "Share to feed". */
  shareToFeed?: string;

  // v0.2.0 — viewer kebab
  /** Default: "Report". */
  report?: string;
  /** Default: "Block author". */
  blockAuthor?: string;
  /** Default: "Mute author". */
  muteAuthor?: string;
  /** Default: "Copy link". */
  copyLink?: string;
  /** aria-label on the kebab button itself. Default: "Story actions". */
  kebabAriaLabel?: string;

  // v0.2.0 — link CTA
  /** Default fallback when StoryItem.link.cta absent. Default: "Open link". */
  openLink?: string;
  /** v0.3.9 — aria-label on the link-drawer close button. Default: "Close link". */
  linkCloseLabel?: string;

  // v0.3.9 — engagement column toggle (heart inline with DM bar)
  /** aria-label on the heart toggle when the column is collapsed. Default: "Show reactions". */
  engagementShowLabel?: string;
  /** aria-label on the heart toggle when the column is expanded. Default: "Hide reactions". */
  engagementHideLabel?: string;

  // v0.3.9 — reply / DM input aria
  /** Function so hosts can interpolate username. Default: `Reply to ${story.username}`. Used as the textarea aria-label. */
  replyAriaLabel?: (story: Story) => string;

  // v0.3.0 — comments panel
  /** Panel heading. Default: "Comments". */
  commentsHeading?: string;
  /** aria-label on the panel-close button. Default: "Close comments". */
  commentsCloseLabel?: string;
  /** Default empty-state copy when no renderCommentsPanel is supplied. */
  commentsDefaultEmptyState?: string;

  // v0.3.1 — share panel
  /** Panel heading. Default: "Share". */
  shareHeading?: string;
  /** aria-label on the share-panel close button. Default: "Close share". */
  shareCloseLabel?: string;
  /** Default empty-state copy when no renderSharePanel is supplied. */
  shareDefaultEmptyState?: string;

  // 0.6.0 — unavailable notice
  /** Notice shown in place of an item that cannot be played. Default: "This story is no longer available". */
  unavailable?: string;
  /** Close button of the notice (`standalone` single-item stories). Default: "Close". */
  unavailableClose?: string;

  // v0.2.0 — nested forwards
  /** Nested forward to engagement-bar labels (per Q-V14 — defensive callback contravariance applied). */
  engagementLabels?: StoryEngagementBarLabels;
  /** Nested forward to comment-thread composer labels (subset of CommentThreadLabels). */
  commentLabels?: StoryReplyComposerLabels;
}

/**
 * The resolved labels shape after merging DEFAULT_STORY_VIEWER_LABELS with
 * the optional `labels` prop. All standalone keys are required; nested
 * forwards (`engagementLabels` / `commentLabels`) stay optional — hosts opt
 * in. Used as the prop type for every part that accepts labels.
 */
export type ResolvedStoryViewer01Labels = Required<
  Omit<StoryViewerLabels, "engagementLabels" | "commentLabels">
> &
  Pick<StoryViewerLabels, "engagementLabels" | "commentLabels">;

export const DEFAULT_STORY_VIEWER_LABELS: Required<
  Omit<
    StoryViewerLabels,
    "engagementLabels" | "commentLabels"
  >
> = {
  // v0.1 (preserved)
  viewerLabel: "Story viewer",
  play: "Play",
  pause: "Pause",
  mute: "Mute",
  unmute: "Unmute",
  close: "Close",
  prevStory: "Previous story",
  nextStory: "Next story",
  prevItem: "Previous item",
  nextItem: "Next item",
  position: (author: string, index: number, total: number) => `${author}, ${index + 1} of ${total}`,
  // Locale-aware relative time (English here). The viewer swaps in `props.locale` unless the host
  // passes `labels.formatTime`.
  formatTime: (date: Date) => formatRelativeTime(date, "en"),
  itemImageAlt: (story: Story, idx: number, total: number) =>
    `${story.username}, story image ${idx + 1} of ${total}`,
  // v0.2.0
  reactionPickerLabel: "Pick a reaction",
  replyComposerPlaceholder: (story: Story) => `Reply to ${story.username}…`,
  replyComposerSend: "Send",
  replyComposerCancel: "Cancel",
  viewerCountLabel: (count: number, time: string, formatted?: string) =>
    `${formatted ?? count} views · ${time}`,
  viewersHeading: "Viewers",
  viewersMoreLabel: (count: number) => `+${count} more`,
  viewersLoading: "Loading viewers…",
  viewersEmpty: "No viewers yet.",
  viewersLoadMore: "Load more",
  viewersError: "Could not load viewers.",
  viewersRetry: "Retry",
  saveToHighlights: "Save to highlights",
  unsaveFromHighlights: "Remove from highlights",
  deleteStory: "Delete story",
  shareToFeed: "Share to feed",
  report: "Report",
  blockAuthor: "Block author",
  muteAuthor: "Mute author",
  copyLink: "Copy link",
  kebabAriaLabel: "Story actions",
  openLink: "Open link",
  linkCloseLabel: "Close link",
  engagementShowLabel: "Show reactions",
  engagementHideLabel: "Hide reactions",
  replyAriaLabel: (story: Story) => `Reply to ${story.username}`,
  commentsHeading: "Comments",
  commentsCloseLabel: "Close comments",
  commentsDefaultEmptyState: "No comments yet. Be the first to reply.",
  shareHeading: "Share",
  shareCloseLabel: "Close share",
  shareDefaultEmptyState: "Share targets not loaded yet.",
  unavailable: "This story is no longer available",
  unavailableClose: "Close",
};

// ─── Imperative handle ──────────────────────────────────────────────────

export interface StoryViewerHandle {
  // v0.1 (preserved)
  /** Jump to a specific story by index (item index resets to 0). */
  goToStory: (index: number) => void;
  /** Jump to a specific item within the current story. */
  goToItem: (index: number) => void;
  /**
   * Force pause/resume from outside. `true` adds the `host` pause reason (it
   * survives item changes, layers and a backgrounded tab); `false` removes the
   * `host` and `user` reasons — other reasons (an open sheet, a focused reply
   * box) keep the viewer paused.
   */
  setPaused: (paused: boolean) => void;
  /** Read current navigation cursor. */
  getCursor: () => { storyIndex: number; itemIndex: number };
  /** Read current stories snapshot (post-realtime patches). */
  getCurrentStories: () => Story[];
  /** Re-seed external state push (always-uncontrolled escape hatch). */
  reset: (next: Story[]) => void;
  /** Surgical state edit. */
  dispatch: (action: StoryViewerLocalAction) => void;

  // v0.2.0 additions (6 new) — escape hatches that fire handlers without
  // consulting the permissions matrix. The matrix gates UI affordances; the
  // handle is the programmatic bypass. If the handler isn't wired, no-op.
  /** Force mute/unmute from outside (parity with setPaused). */
  setMuted: (muted: boolean) => void;
  /** Programmatically toggle the like state — fires onLikeStory if wired. */
  triggerLike: () => void;
  /** Programmatically pick a reaction — fires onReactStory if wired. */
  triggerReaction: (kind?: string) => void;
  /** Focus the reply composer + optionally pre-fill content. */
  triggerReply: (content?: string) => void;
  /** Programmatically open the share affordance — fires onShareStory if wired. */
  triggerShare: () => void;
  /** Programmatically open the kebab dropdown. */
  openKebab: () => void;
}

// ─── Props ──────────────────────────────────────────────────────────────

export interface StoryViewerProps {
  // v0.1 (preserved)

  /**
   * Story list. **Uncontrolled** (no `onStoriesChange`): mount-only — later prop
   * changes are ignored; push updates via `ref.current.reset(next)` or
   * `dispatch`. **Controlled** (`onStoriesChange` passed): this prop wins on
   * every render; local mutations are reported through `onStoriesChange`
   * instead of being applied. The cursor is anchored to item ids, so an insert
   * before the current group keeps the same item on screen, and removing the
   * on-screen item / story runs the same repair as `dispatch` / `reset` /
   * `subscribe`.
   */
  stories: Story[];
  /**
   * 0.6.0 — makes `stories` controlled. Called instead of applying a local
   * mutation (`dispatch`, `reset`, a `subscribe` delta): `next` is the list the
   * mutation would produce, `change` the mutation (`{ kind: "reset" }` /
   * `{ kind: "subscribe-delta" }` / the dispatched action). Feed `next` back as
   * `stories` to accept it, ignore it to reject.
   */
  onStoriesChange?: (next: Story[], change: StoryViewerLocalAction) => void;
  /**
   * 0.6.0 — fires once when the on-screen item stops being playable: `"removed"` (it left
   * `stories`), `"resolve"` (`resolveMedia` returned `null` / rejected, or there is neither a `src`
   * nor a `resolveMedia`), `"media"` (the media failed and `onMediaError` supplied no new `src`)
   * or `"timeout"` (`loadTimeoutMs` elapsed). The viewer then shows `labels.unavailable` for
   * `unavailableNoticeMs` and moves on.
   */
  onItemUnavailable?: (
    storyId: string,
    itemId: string,
    reason: StoryItemUnavailableReason,
  ) => void;
  /**
   * 0.6.0 — how long (ms) the viewer holds the unavailable notice (any reason) before it
   * moves on to the next item. While held the item does not play and
   * the `unavailable` pause reason is active. `0` moves on immediately (the
   * 0.5.x behaviour for a removal). Default 1500.
   */
  unavailableNoticeMs?: number;
  /**
   * 0.6.0 — the viewer was opened from a link rather than a rail. With a
   * single-item story whose item becomes unavailable, the notice stays until
   * the viewer is closed instead of moving on.
   */
  standalone?: boolean;
  /**
   * 0.6.0 — supplies the media URL of an item that has no `src`. Called for the CURRENT and the NEXT
   * item only (never the previous item or story); the URL lives in component state, never in storage
   * or the URL. Returns the `src` (and optionally a `poster`, used by video items and passed to a
   * custom frame as `ctx.poster`), or `null` when the media is gone. `null` or a rejection makes the
   * item unavailable with reason `"resolve"`. While it resolves the item is not ready (the progress
   * bar waits). The viewer keeps a few results while the viewer is open, so the host does not need to
   * cache; an item that already has a `src` is never passed here.
   */
  resolveMedia?: (item: StoryItem) => Promise<StoryResolvedMedia | null>;
  /**
   * 0.6.0 — called ONCE per item when its media fails to load or play. Return a new `src` (a fresh
   * signed URL) and the viewer retries with it, resuming a video at the same playback time; return
   * nothing (or reject) and the item is unavailable with reason `"media"`. A second failure of the
   * retried media is unavailable too. Without this prop a failure makes the item unavailable
   * (`"media"`) at once: the notice shows for `unavailableNoticeMs` and the viewer moves on. A video
   * whose duration is not finite still falls back to the timer.
   */
  onMediaError?: (item: StoryItem) => Promise<string | void>;
  /**
   * 0.6.0 — an item whose media is not ready within this many milliseconds (resolving included)
   * becomes unavailable with reason `"timeout"`. Default: off. A custom `renderItem` frame is ready
   * as soon as it mounts, so it only times out while `resolveMedia` is pending.
   */
  loadTimeoutMs?: number;
  /**
   * 0.6.0 — controlled pause reasons. The viewer is paused while the list is
   * not empty. Built-ins are {@link StoryViewerPauseReason}; any other string
   * is the host's own reason. When passed it wins on every render and changes
   * are reported through `onPauseReasonsChange` instead of being applied.
   */
  pauseReasons?: string[];
  /** 0.6.0 — fires with the next reason list whenever the viewer adds or removes a reason. */
  onPauseReasonsChange?: (next: string[]) => void;
  /** Which story to open (item always starts at 0). */
  initialStoryIndex: number;
  /** Controlled open state. */
  isOpen: boolean;
  /** Fires on Escape, backdrop click, close button, or auto-close at end of last story. */
  onClose: () => void;
  /** Imperative handle. */
  ref?: React.Ref<StoryViewerHandle>;

  // ─── Realtime ──────────────────────────────────────────────────────────

  /** Story-list realtime stream. Memoize via useCallback over a stable channel ref. Mount-scoped. */
  subscribe?: Subscribe<StoryViewerDelta>;
  /** Fires for every story-list delta. */
  onSubscribeDelta?: (delta: StoryViewerDelta) => void;

  /**
   * v0.2.0 — engagement realtime stream (SEPARATE from `subscribe`).
   * Per Q-V16: asymmetric naming preserved for zero v0.1 breakage. The two
   * streams are semantically different (story-list mutations vs engagement
   * events) — the naming reflects that.
   */
  engagementSubscribe?: Subscribe<StoryEngagementDelta>;
  /** v0.2.0 — fires for every engagement delta. */
  onSubscribeEngagementDelta?: (delta: StoryEngagementDelta) => void;

  // ─── Lifecycle callbacks (v0.1 preserved) ─────────────────────────────

  /** Forward-completion only — fires when the user advances forward into the next story OR when the last item completes naturally. Does NOT fire on backward navigation (matches Instagram). */
  onStoryViewed?: (storyId: string) => void;
  /**
   * Fires when an item is finished with. `cause` is `"completed"` when it
   * played to the end or was tapped past within its story, `"left"` when the
   * viewer jumped to another author (next / previous story by tap, key, swipe,
   * `goToStory`, or a previous-item tap that crosses into the previous story).
   */
  onItemViewed?: (
    storyId: string,
    itemId: string,
    itemIndex: number,
    cause: StoryItemViewedCause,
  ) => void;
  /** Fires whenever the cursor moves (manual nav or auto-advance). */
  onCursorChange?: (storyIndex: number, itemIndex: number) => void;
  /** Fires synchronously immediately before `onClose()` when the auto-close triggers at end of the last story. */
  onAutoCloseAtEnd?: () => void;

  // ─── v0.2.0 — engagement handlers ─────────────────────────────────────

  /** Fires on like toggle. Optimistic flow per Q-P5 lock — host can reject via reset. */
  onLikeStory?: (storyId: string, itemId: string, nextLiked: boolean) => void;
  /** Fires on reaction selection (or clear when reactionKind is null). */
  onReactStory?: (storyId: string, itemId: string, reactionKind: string | null) => void;
  /** Fires on share affordance. Host opens share-sheet / system share. */
  onShareStory?: (storyId: string, itemId: string) => void;
  // onBookmarkStory removed in v0.3.0 — stories are not bookmarkable.

  // ─── v0.2.0 — DM composer (always-visible bottom input) ──────────────
  //
  // Per Instagram-canonical semantic: the always-visible bottom input is a
  // DIRECT MESSAGE to the story author (content sent through to the author's
  // chat alongside a snapshot of the current item). It is NOT a public
  // comment — public comments live in the v0.3.0 comments panel (see below).

  /**
   * Fires on DM submit from the always-visible bottom input. Library does
   * NOT optimistically render (DM is a chat message; the response surface
   * lives outside the viewer entirely).
   *
   * The name `onAddReply` is preserved from v0.2.0 for back-compat —
   * semantically equivalent to `onSendDirectMessage`.
   */
  onAddReply?: (storyId: string, itemId: string, content: string) => Promise<void> | void;

  // ─── v0.2.0 — owner overlay ───────────────────────────────────────────

  /**
   * Owner mode - pages the viewers list of the CURRENT item. Called with `(itemId, null)` when
   * the list opens (unless `story.viewers` seeds it), then with the previous `nextCursor` each
   * time "load more" is pressed while `nextCursor` is non-null. A rejection shows an error row
   * with a Retry button (`labels.viewersRetry`); Retry repeats the same call. The list resets
   * when the current item changes.
   */
  onLoadViewers?: (
    itemId: string,
    cursor: string | null,
  ) => Promise<StoryViewersPage>;

  // ─── v0.2.0 — role-aware mode (opt-in per Q-V11 lock) ─────────────────

  /**
   * Two-mode toggle for role-aware affordances. `undefined` = v0.1 legacy
   * mode (no engagement overlay, no reply composer, no owner overlay, no
   * kebab). No auto-derivation from `currentUser.id === story.userId` — host
   * explicitly picks the mode to keep the library neutral across identity
   * models (mirrors post-card precedent).
   */
  viewerMode?: StoryViewerMode;
  /** Per-action permissions matrix. Overrides `viewerMode`-derived defaults. */
  permissions?: StoryViewerPermissions;
  /**
   * Universal permission predicate — wins over `permissions` + `viewerMode`.
   * Return `true` / `false` to force-allow / deny; return `undefined` to fall
   * through to the matrix → mode defaults → legacy mode.
   */
  canPerformAction?: (
    action: StoryPermissionAction,
    story: Story,
    item: StoryItem,
  ) => boolean | undefined;

  // ─── v0.2.0 — kebab ───────────────────────────────────────────────────

  /** Full kebab takeover — bypasses default role-aware assembly + moderator section. */
  kebabActions?: (story: Story, item: StoryItem) => StoryKebabMenuItem[];
  /**
   * Supplier for the moderator section of the kebab. Items render only when
   * `canModerate` resolves to true (via `permissions.canModerate` or
   * `canPerformAction("moderate", …)`). Library inserts a divider above the
   * first returned item via `separatorBefore: true`. Bypassed when
   * `kebabActions` is supplied (full-takeover wins).
   */
  moderatorActions?: (story: Story, item: StoryItem) => StoryKebabMenuItem[];

  // ─── v0.2.0 — kebab item handlers (mirrors post-card v0.2.0) ──────
  //
  // Flattened onto Props (rather than a discrete StoryMutationHandlers
  // interface) to match the post-card mutation-handler convention. Each
  // handler is optional; the default kebab assembly in
  // `lib/kebab.ts::defaultStoryKebabActions` consults the permissions matrix
  // before deciding which items to render, so a wired handler only surfaces
  // its kebab item when the matrix allows it.

  /**
   * Owner action — save the current item to highlights. Receives the current `Story` and
   * `StoryItem` objects (not an id), so the host can act on the item that is on screen.
   */
  onSaveToHighlights?: (target: StoryItemTarget) => void;
  /** Owner action — delete the current item. Receives `{ story, item }`. */
  onDeleteStory?: (target: StoryItemTarget) => void;
  /** Owner action — re-share the current item to the main feed. Receives `{ story, item }`. */
  onShareToFeed?: (target: StoryItemTarget) => void;
  /** Viewer action — report the current item to moderators. Receives `{ story, item }`. */
  onReport?: (target: StoryItemTarget) => void;
  /** Viewer action — block the story author. */
  onBlockAuthor?: (authorId: string) => void;
  /** Viewer action — mute the story author. */
  onMuteAuthor?: (authorId: string) => void;
  /** Viewer action — copy a deep link to the current item. Receives `{ story, item }`. */
  onCopyLink?: (target: StoryItemTarget) => void;
  /**
   * Owner side — whether the current story is already saved to highlights.
   * Drives the default kebab item label toggle
   * (`saveToHighlights` ↔ `unsaveFromHighlights`).
   */
  isSavedToHighlights?: boolean;

  // ─── v0.2.0 — engagement overlay configuration ────────────────────────

  /**
   * Reaction kinds for the engagement overlay's reaction action. Host supplies
   * (no defaults — same Q-V4 lock as engagement-bar v0.3.x). When omitted,
   * the reaction action is suppressed even if `canReact` resolves true.
   */
  reactionKinds?: StoryEngagementReactionKind[];

  // ─── v0.2.0 — viewer identity ─────────────────────────────────────────

  /** Viewer identity. Drives reply composer avatar + isOwn check on default kebab. Absent → composer hidden, composerEmptyState rendered. */
  currentUser?: StoryCurrentUser;
  /** Rendered in place of the reply composer when currentUser is absent. */
  composerEmptyState?: ReactNode;

  // ─── v0.2.0 — link CTA + polymorphic root ─────────────────────────────

  /** Polymorphic root for the StoryItem.link CTA button. Default `"a"`. */
  linkComponent?: ElementType;
  /** Fired when the link CTA is tapped. Overrides default href navigation if provided. */
  onLinkClick?: (storyId: string, itemId: string, url: string) => void;

  // ─── v0.2.2 — author tap-target ───────────────────────────────────────

  /**
   * v0.2.2 — fires when the avatar + username strip in the header is
   * tapped. When set, the strip renders as a `<button>` (or
   * `authorComponent` if provided) instead of a static `<div>`, with a
   * subtle hover opacity to telegraph affordance. Common use: navigate to
   * the author's profile.
   */
  onAuthorClick?: (story: Story) => void;
  /**
   * v0.2.2 — polymorphic root for the author tap-target. Default:
   * `"button"` when `onAuthorClick` is set, otherwise the strip stays a
   * static `<div>`. Pass `"a"` / Next.js `<Link>` / react-router `<Link>`
   * etc. for href-based nav — the root receives `onClick`, `className`,
   * and the avatar + name as children; manage `href` inside the custom
   * component if needed. F-cross-13 safe (polymorphic component
   * identifiers are not touched by the rewriter).
   */
  authorComponent?: ElementType;

  // ─── v0.2.0 — long-press pause ────────────────────────────────────────

  /** Long-press hold threshold in ms before pause kicks in. Default 200 (Instagram-feel). */
  longPressThresholdMs?: number;

  // ─── Slots (v0.1) ─────────────────────────────────────────────────────

  /** Custom item renderer. When provided, replaces the default branching on item.type. */
  renderItem?: (item: StoryItem, context: RenderItemContext) => ReactNode;

  // ─── v0.2.0 render slots (7 new connective seams) ─────────────────────

  /** Replace the avatar/name/time/buttons header strip. */
  renderHeader?: (story: Story, item: StoryItem, helpers: StoryViewerSlotHelpers) => ReactNode;
  /**
   * 0.6.0 - a badge rendered in the default header after the author name and before the time
   * (a verified tick, a "close friends" mark...). No default content. Ignored when
   * `renderHeader` replaces the whole header.
   */
  renderHeaderBadge?: (story: Story, item: StoryItem) => ReactNode;
  /**
   * 0.6.0 - BCP 47 locale for the default relative time in the header ("5 min. ago" / "5 dk. once").
   * Default `"en"`; an invalid tag falls back to `"en"`. `labels.formatTime` wins when given.
   */
  locale?: string;
  /**
   * 0.6.0 - where the desktop previous / next story arrows sit: `"inside"` (default, over the
   * card edges) or `"outside"` (beside the card, so they never cover the media). Mobile has no
   * arrows either way.
   */
  navArrowsPlacement?: "inside" | "outside";
  /** Replace the segmented progress bars. */
  renderProgress?: (
    items: StoryItem[],
    currentItemIndex: number,
    progress: number,
    helpers: StoryViewerSlotHelpers,
  ) => ReactNode;
  /** Replace the desktop ← → nav arrows. */
  renderNavArrows?: (helpers: StoryViewerSlotHelpers) => ReactNode;
  /** Replace the touch nav tap-zone strip. */
  renderTapZones?: (helpers: StoryViewerSlotHelpers) => ReactNode;
  /** Replace the entire engagement overlay (default: <EngagementBar variant="stacked">). */
  renderEngagementOverlay?: (story: Story, item: StoryItem, helpers: StoryViewerSlotHelpers) => ReactNode;
  /** Replace the reply composer. */
  renderReplyComposer?: (story: Story, item: StoryItem, helpers: StoryViewerSlotHelpers) => ReactNode;
  /** Replace the owner overlay (view-count + viewers list). */
  renderOwnerOverlay?: (story: Story, item: StoryItem, helpers: StoryViewerSlotHelpers) => ReactNode;
  /**
   * v0.3.0 — replace the comments-panel content. When the panel is opened
   * (tapping the comment icon in the engagement overlay), the visual content
   * shrinks toward the top and this slot's return is rendered inside the
   * bottom sheet. Hosts typically mount `<CommentThread />` here with
   * per-item comments + `onAddComment` + `onLoadMore` wired.
   *
   * When omitted, the panel renders a thin default surface (heading +
   * "drop a comment" hint + `composerEmptyState` fallback) — usable, but
   * the canonical pattern is to provide CommentThread.
   */
  renderCommentsPanel?: (
    story: Story,
    item: StoryItem,
    helpers: StoryViewerSlotHelpers & {
      isCommentsOpen: boolean;
      closeCommentsPanel: () => void;
    },
  ) => ReactNode;
  /**
   * v0.3.1 — replace the share-panel content. When the panel is opened
   * (tapping the share icon in the engagement overlay), the visual content
   * shrinks toward the top and this slot's return is rendered inside the
   * bottom sheet. Hosts typically mount `<ShareMenu />` (from
   * `@ilinxa/engagement-bar`) here with recent-shareable-users + onShareTo
   * wired.
   *
   * When omitted, the panel renders a thin default empty-state surface.
   */
  renderSharePanel?: (
    story: Story,
    item: StoryItem,
    helpers: StoryViewerSlotHelpers & {
      isShareOpen: boolean;
      closeSharePanel: () => void;
    },
  ) => ReactNode;

  // ─── v0.2.0 disable opt-outs (8 new) ──────────────────────────────────

  /** Suppress the touch tap-zone strip entirely. Keyboard + nav arrows + header pause still work. */
  disableTapZones?: boolean;
  /** Suppress the keyboard navigation hook entirely. */
  disableKeyboardNav?: boolean;
  /** Suppress the desktop ← → nav arrows. */
  disableNavArrows?: boolean;
  /** Suppress the auto-close at end of last story. `onAutoCloseAtEnd` still fires; viewer stays open. */
  disableAutoClose?: boolean;
  /** Suppress the segmented progress bars (timer still drives auto-advance). */
  disableProgressBars?: boolean;
  /** Suppress the engagement overlay entirely (kebab falls back to header right cluster). */
  disableEngagement?: boolean;
  /** Suppress the reply composer entirely. */
  disableReplyComposer?: boolean;
  /** Suppress the owner overlay (view-count + viewers list) entirely. */
  disableOwnerOverlay?: boolean;
  /**
   * v0.3.0 — suppress the comments panel entirely. When set, the comment
   * action in the engagement overlay falls back to focusing the DM input
   * (v0.2.x behavior). The comment icon is NOT hidden — `disableEngagement`
   * is the way to remove the whole overlay.
   */
  disableComments?: boolean;
  /**
   * v0.3.1 — suppress the share panel entirely. When set, the share action
   * in the engagement overlay falls back to firing `onShareStory` directly
   * (the v0.2.x system-share behavior, no overlay panel).
   */
  disableSharePanel?: boolean;
  /**
   * v0.4.0 — suppress the Instagram-canonical 3D cube transition between
   * stories. When set, story-to-story navigation is a hard cut (the v0.3.x
   * behavior). Item-to-item navigation within a story is always a hard cut
   * either way (matches Instagram). Default `false`.
   */
  disableStoryTransition?: boolean;
  /**
   * v0.4.0 — duration of the 3D cube transition in milliseconds. Default 400
   * (matches Instagram's perceived feel). Ignored when `disableStoryTransition`
   * is true.
   */
  storyTransitionDurationMs?: number;

  // ─── Defaults ──────────────────────────────────────────────────────────
  /** Default item duration in seconds when neither item.duration nor video metadata is available. Default 5. */
  defaultItemDuration?: number;

  // ─── i18n ──────────────────────────────────────────────────────────────
  labels?: StoryViewerLabels;

  // ─── Style overrides ──────────────────────────────────────────────────
  /** Extra classes for the inner content wrapper. */
  className?: string;
  /** Extra classes for the modal content surface. */
  contentClassName?: string;
}

// ─── v0.2.0 — kebab menu item shape ──────────────────────────────────────
//
// Local definition (NOT inline-copied from comment-thread's
// `CommentMenuItem`) — keeps story-viewer's public surface independent
// from comment-thread type evolution. Structurally compatible by design.

export interface StoryKebabMenuItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  /**
   * Render a divider line above this item. Used by the moderator section in
   * `defaultStoryKebabActions` (first moderator item carries `separatorBefore: true`).
   */
  separatorBefore?: boolean;
}
