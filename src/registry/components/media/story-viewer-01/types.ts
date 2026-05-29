import type { ElementType, ReactNode } from "react";

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
  src: string;
  /** Display duration in seconds. Default 5 for images; for videos, viewer reads the actual duration via onLoadedMetadata. */
  duration?: number;
  /**
   * v0.2.0 — optional link CTA rendered as a bottom button above the
   * engagement overlay. Polymorphic root via {@link StoryViewer01Props.linkComponent}.
   */
  link?: StoryItemLink;
}

/**
 * v0.2.0 — single viewer entry for the owner-mode viewers list. Relaxed
 * fields (parallel to engagement-bar-01's EngagementLikerProfile). Eager
 * seed via {@link Story.viewers}; lazy fetch via
 * {@link StoryViewer01Props.onLoadViewers}.
 */
export interface ViewerListItem {
  id: string;
  name: string;
  avatar?: string;
  /** ISO date of when this user viewed the story. Optional. */
  viewedAt?: string;
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
  /**
   * v0.2.0 — eager view count for the owner overlay. Cheap byte (single number);
   * the user list itself is lazy via {@link StoryViewer01Props.onLoadViewers}.
   */
  viewerCount?: number;
  /**
   * v0.2.0 — optional eager seed for the viewers list (hybrid Q-V5 lock). If
   * present, the owner overlay renders these immediately without waiting for
   * `onLoadViewers`. If absent, the overlay shows the count + a tap target that
   * triggers `onLoadViewers` on first expand.
   */
  viewers?: ViewerListItem[];
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
// Per Q-V3 lock: post-card-01 precedent has separate `engagementSubscribe` +
// `commentSubscribe` streams. story-viewer-01 mirrors with two streams:
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

export type StoryEngagementLocalAction =
  | { kind: "like-toggle"; storyId: string; itemId: string; nextLiked: boolean }
  | { kind: "reaction-select"; storyId: string; itemId: string; reactionKind: string | null }
  | { kind: "subscribe-delta"; delta: StoryEngagementDelta }
  | { kind: "reset"; storyId: string; itemId: string };

// ─── v0.2.0 — permissions (mirrors post-card-01 v0.3.0 resolver) ─────────
//
// Per Q-V10 lock: resolution order verbatim from post-card-01:
//   1. canPerformAction(action, story, item) returning true|false — wins
//   2. permissions[canX] per-field — false denies, true allows
//   3. viewerMode-derived defaults from PERMISSION_DEFAULTS_BY_MODE
//   4. (legacy v0.1 mode short-circuits in defaultStoryKebabActions when
//      all 3 role-aware inputs are undefined)

export type StoryViewerMode = "owner" | "viewer";

/**
 * Discriminator for the universal `canPerformAction` predicate.
 *
 * - Owner-side: `saveToHighlights`, `deleteStory`, `shareToFeed`, `seeViewers`
 * - Viewer-side: `react`, `reply`, `share`, `dm`, `report`, `blockAuthor`, `muteAuthor`
 * - Orthogonal: `moderate` (per Q-V11 lock — never auto-derived from viewerMode)
 */
export type StoryPermissionAction =
  | "saveToHighlights"
  | "deleteStory"
  | "shareToFeed"
  | "seeViewers"
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
 * opted in explicitly by the host's permission resolver (mirrors post-card-01).
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

// ─── v0.2.0 — inline-copies from engagement-bar-01 (F-S1 Bug 3 fix) ──────
//
// engagement-bar-01 is in `data/` category; story-viewer-01 is in `media/`.
// Cross-category `/types` imports do NOT survive the shadcn 4.6.0 path
// rewriter (mangles to wrong-slug or invalid `<cat>/` prefix). Therefore
// these shapes are INLINE-COPIED — kept structurally identical to upstream.
//
// SYNC WARNING: if @ilinxa/engagement-bar-01 changes any of these shapes
// in a future bump, this file MUST be updated manually. The upstream
// definitions live at src/registry/components/data/engagement-bar-01/types.ts.

export type StoryEngagementActionAlign = "left" | "right" | "auto";

/**
 * Inlined from engagement-bar-01's `EngagementReactionKind` (v0.3.x).
 * Used by the reaction action in {@link StoryEngagementAction}.
 */
export interface StoryEngagementReactionKind {
  /** Stable identifier matching backend payloads (e.g. `"love"`, `"laugh"`). */
  key: string;
  /** Host-supplied icon node (lucide / emoji / image). Library does not ship reaction icons. */
  icon: ReactNode;
  /** Localized human label — used in picker tooltip + aria-label. */
  label: string;
  /** Seed tally for this kind. */
  count: number;
  /** Optional tint applied to the icon when this is the viewer's current reaction. */
  color?: string;
}

/**
 * Inlined from engagement-bar-01's `EngagementAction` discriminated union (v0.3.x).
 * Strict — no extra fields per kind.
 */
export type StoryEngagementAction =
  | {
      kind: "like";
      count: number;
      liked?: boolean;
      onToggle?: (next: boolean) => void;
      onCountClick?: () => void;
      align?: StoryEngagementActionAlign;
    }
  | {
      kind: "comment";
      count?: number;
      onClick?: () => void;
      align?: StoryEngagementActionAlign;
    }
  | {
      kind: "share";
      count?: number;
      onClick?: () => void;
      align?: StoryEngagementActionAlign;
    }
  | {
      kind: "bookmark";
      bookmarked?: boolean;
      onToggle?: (next: boolean) => void;
      align?: StoryEngagementActionAlign;
    }
  | {
      kind: "view-count";
      count: number;
      align?: StoryEngagementActionAlign;
    }
  | {
      kind: "custom";
      id: string;
      label: string;
      icon?: ReactNode;
      active?: boolean;
      onClick?: () => void;
      align?: StoryEngagementActionAlign;
    }
  | {
      kind: "reaction";
      kinds: StoryEngagementReactionKind[];
      viewerReaction?: string | null;
      onSelect?: (kind: string | null) => void;
      clearOnTap?: boolean;
      align?: StoryEngagementActionAlign;
    };

/**
 * Inlined from engagement-bar-01's `EngagementBarLabels` (v0.3.x; 13 keys).
 * Used as a nested forward inside {@link StoryViewer01Labels.engagementLabels}.
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

// ─── v0.2.0 — inline-copies from comment-thread-01 (F-S1 Bug 3 fix) ─────
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
 * Used as a nested forward inside {@link StoryViewer01Labels.commentLabels}.
 */
export interface StoryReplyComposerLabels {
  composerPlaceholder?: string;
  composerSend?: string;
  composerCancel?: string;
}

// ─── v0.2.0 — reactor list (parallel to viewers list) ────────────────────

export interface StoryReactorProfile {
  id: string;
  name?: string;
  avatar?: string;
  reactionKind?: string;
}

// ─── Render-prop helpers ────────────────────────────────────────────────

export interface RenderItemContext {
  storyIndex: number;
  itemIndex: number;
  isPaused: boolean;
  isMuted: boolean;
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

export interface StoryViewer01Labels {
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
  /** Format the relative time shown in the header. */
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
  viewerCountLabel?: (count: number, time: string) => string;
  /** Default: "Viewers". */
  viewersHeading?: string;
  /** Function so hosts can pluralize. Default: `+${count} more`. */
  viewersMoreLabel?: (count: number) => string;

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

  // v0.2.0 — nested forwards
  /** Nested forward to engagement-bar-01 labels (per Q-V14 — defensive callback contravariance applied). */
  engagementLabels?: StoryEngagementBarLabels;
  /** Nested forward to comment-thread-01 composer labels (subset of CommentThreadLabels). */
  commentLabels?: StoryReplyComposerLabels;
}

/**
 * The resolved labels shape after merging DEFAULT_STORY_VIEWER_LABELS with
 * the optional `labels` prop. All standalone keys are required; nested
 * forwards (`engagementLabels` / `commentLabels`) stay optional — hosts opt
 * in. Used as the prop type for every part that accepts labels.
 */
export type ResolvedStoryViewer01Labels = Required<
  Omit<StoryViewer01Labels, "engagementLabels" | "commentLabels">
> &
  Pick<StoryViewer01Labels, "engagementLabels" | "commentLabels">;

export const DEFAULT_STORY_VIEWER_LABELS: Required<
  Omit<
    StoryViewer01Labels,
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
  formatTime: (date: Date) =>
    new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date),
  itemImageAlt: (story: Story, idx: number, total: number) =>
    `${story.username}, story image ${idx + 1} of ${total}`,
  // v0.2.0
  reactionPickerLabel: "Pick a reaction",
  replyComposerPlaceholder: (story: Story) => `Reply to ${story.username}…`,
  replyComposerSend: "Send",
  replyComposerCancel: "Cancel",
  viewerCountLabel: (count: number, time: string) => `${count} views · ${time}`,
  viewersHeading: "Viewers",
  viewersMoreLabel: (count: number) => `+${count} more`,
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
  commentsHeading: "Comments",
  commentsCloseLabel: "Close comments",
  commentsDefaultEmptyState: "No comments yet. Be the first to reply.",
  shareHeading: "Share",
  shareCloseLabel: "Close share",
  shareDefaultEmptyState: "Share targets not loaded yet.",
};

// ─── Imperative handle ──────────────────────────────────────────────────

export interface StoryViewer01Handle {
  // v0.1 (preserved)
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

export interface StoryViewer01Props {
  // v0.1 (preserved)

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
  /** Fires when an item completes naturally OR is navigated past forward. */
  onItemViewed?: (storyId: string, itemId: string, itemIndex: number) => void;
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

  /** Lazy-fetch viewers when owner taps the view-count chip. Returns ViewerListItem[]. */
  onLoadViewers?: (storyId: string) => Promise<ViewerListItem[]>;

  // ─── v0.2.0 — role-aware mode (opt-in per Q-V11 lock) ─────────────────

  /**
   * Two-mode toggle for role-aware affordances. `undefined` = v0.1 legacy
   * mode (no engagement overlay, no reply composer, no owner overlay, no
   * kebab). No auto-derivation from `currentUser.id === story.userId` — host
   * explicitly picks the mode to keep the library neutral across identity
   * models (mirrors post-card-01 precedent).
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

  // ─── v0.2.0 — kebab item handlers (mirrors post-card-01 v0.2.0) ──────
  //
  // Flattened onto Props (rather than a discrete StoryMutationHandlers
  // interface) to match the post-card-01 mutation-handler convention. Each
  // handler is optional; the default kebab assembly in
  // `lib/kebab.ts::defaultStoryKebabActions` consults the permissions matrix
  // before deciding which items to render, so a wired handler only surfaces
  // its kebab item when the matrix allows it.

  /** Owner action — save the current story to highlights. */
  onSaveToHighlights?: (storyId: string) => void;
  /** Owner action — delete the current story. */
  onDeleteStory?: (storyId: string) => void;
  /** Owner action — re-share the current story to the main feed. */
  onShareToFeed?: (storyId: string) => void;
  /** Viewer action — report the current story to moderators. */
  onReport?: (storyId: string) => void;
  /** Viewer action — block the story author. */
  onBlockAuthor?: (authorId: string) => void;
  /** Viewer action — mute the story author. */
  onMuteAuthor?: (authorId: string) => void;
  /** Viewer action — copy a deep link to the current story. */
  onCopyLink?: (storyId: string) => void;
  /**
   * Owner side — whether the current story is already saved to highlights.
   * Drives the default kebab item label toggle
   * (`saveToHighlights` ↔ `unsaveFromHighlights`).
   */
  isSavedToHighlights?: boolean;

  // ─── v0.2.0 — engagement overlay configuration ────────────────────────

  /**
   * Reaction kinds for the engagement overlay's reaction action. Host supplies
   * (no defaults — same Q-V4 lock as engagement-bar-01 v0.3.x). When omitted,
   * the reaction action is suppressed even if `canReact` resolves true.
   */
  reactionKinds?: StoryEngagementReactionKind[];
  /** Pre-loaded reactor profiles for the engagement overlay's reactionsPreview. */
  reactors?: StoryReactorProfile[];
  /** Lazy-fetch additional reactors on tap. */
  onLoadReactors?: (storyId: string, itemId: string) => Promise<StoryReactorProfile[]>;

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
  /** Replace the entire engagement overlay (default: <EngagementBar01 variant="stacked">). */
  renderEngagementOverlay?: (story: Story, item: StoryItem, helpers: StoryViewerSlotHelpers) => ReactNode;
  /** Replace the reply composer. */
  renderReplyComposer?: (story: Story, item: StoryItem, helpers: StoryViewerSlotHelpers) => ReactNode;
  /** Replace the owner overlay (view-count + viewers list). */
  renderOwnerOverlay?: (story: Story, item: StoryItem, helpers: StoryViewerSlotHelpers) => ReactNode;
  /**
   * v0.3.0 — replace the comments-panel content. When the panel is opened
   * (tapping the comment icon in the engagement overlay), the visual content
   * shrinks toward the top and this slot's return is rendered inside the
   * bottom sheet. Hosts typically mount `<CommentThread01 />` here with
   * per-item comments + `onAddComment` + `onLoadMore` wired.
   *
   * When omitted, the panel renders a thin default surface (heading +
   * "drop a comment" hint + `composerEmptyState` fallback) — usable, but
   * the canonical pattern is to provide CommentThread01.
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
   * `@ilinxa/engagement-bar-01`) here with recent-shareable-users + onShareTo
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

// ─── v0.2.0 — kebab menu item shape ──────────────────────────────────────
//
// Local definition (NOT inline-copied from comment-thread-01's
// `CommentMenuItem`) — keeps story-viewer-01's public surface independent
// from comment-thread-01 type evolution. Structurally compatible by design.

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
