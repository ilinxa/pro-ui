import type { ElementType, MouseEvent, ReactNode, Ref } from "react";

// F-S1 lock: cross-procomp imports use RELATIVE paths to specific files
// (NOT barrels) so shadcn 4.6.0's path-rewriter doesn't mangle them.
// See .claude/decisions/2026-05-28-post-card-01-v0.3.1-fcross-11-fs1-cleanup.md
import type { CommentMenuItem } from "../comment-thread-01/types";

// ─────────────────────────────────────────────────────────────────────────────
// v0.2 surface (preserved unchanged — every v0.2.x consumer keeps working)
// ─────────────────────────────────────────────────────────────────────────────

export type ContentCardNewsVariant =
  | "featured"
  | "large"
  | "medium"
  | "small"
  | "list";

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 — Role-aware mode
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Two-mode toggle for role-aware kebab + render affordances.
 *  - `"editor"`: shows Edit / Delete / Publish / Unpublish / Schedule / Feature /
 *    Pin / Change visibility / Change category / Mark sensitive / See analytics /
 *    Push to top kebab items (when their handlers are wired and the matrix permits).
 *  - `"viewer"`: shows Report / Block author / Mute author / Unfollow topic
 *    (when wired and the matrix permits).
 *
 * **Opt-in semantics (per Q-D1 lock):** `viewerMode === undefined` → v0.2 legacy
 * mode (NO kebab rendered unless any of the new role-aware args is explicitly
 * set). No auto-derivation from any identity source — the host explicitly picks
 * the mode to keep the library neutral across identity / role models.
 *
 * **Moderator UX** (take-down, feature, lock, etc.) is **NOT** a third value —
 * moderation is an orthogonal capability that crosses editor / viewer lines.
 * Wire it via `permissions.canModerate: true` (or
 * `canPerformAction("moderate", item) === true`) PLUS the
 * {@link ContentCardNewsProps.moderatorActions} slot which supplies the menu items.
 * The moderator section renders between common items and viewer-destructive
 * items with a divider above it. Full kebab takeover via
 * {@link ContentCardNewsProps.kebabActions} still bypasses everything.
 */
export type NewsViewerMode = "editor" | "viewer";

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 — Status + Visibility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifecycle status of an article. CLOSED enum per Q-P31 — library owns the
 * full set so it can render canonical badges. Hosts with custom workflow
 * states should encode via {@link NewsVisibility} (which IS extensible).
 *
 * Rendering: only `"draft"` / `"scheduled"` / `"archived"` render a badge.
 * `"published"` is the implicit baseline and produces no badge.
 *
 * Editor-only: status badge renders only when `viewerMode === "editor"` per
 * Q-D10 lock. Readers never see the status chip.
 */
export type ContentStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived";

/**
 * Facebook-style extensible visibility/access-tier shape per Q-P30.
 *
 * Library renders default labels for the 5 base values via
 * `DEFAULT_LABELS`. Custom string values (e.g. `"gold-tier"`,
 * `"employees-only"`, `"newsletter-subscribers"`) get a fallback "Custom"
 * label. Granular host-specific tiers are encoded as their own string keys.
 *
 * - `"public"` — visible to everyone
 * - `"members"` — visible to logged-in members
 * - `"subscribers"` — visible to paying subscribers (paywall typically aligns to this tier)
 * - `"staff"` — visible to internal editorial / CMS users only
 * - `"unlisted"` — published but hidden from feeds / listings (URL access only)
 * - `(string & {})` — branded extension for host-specific tiers
 */
export type NewsVisibility =
  | "public"
  | "members"
  | "subscribers"
  | "staff"
  | "unlisted"
  | (string & {});

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 — Entity sub-types
// ─────────────────────────────────────────────────────────────────────────────

export interface NewsArticleAuthor {
  id: string;
  name: string;
  /** Optional role label — "Senior Editor", "Contributor", "Wire Reporter". */
  role?: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface NewsPublisher {
  id: string;
  name: string;
  logo?: string;
  slug?: string;
}

export interface ContentSensitivity {
  isSensitive: boolean;
  reason?: string;
  /** Specific content warnings — ["graphic", "death", "violence", "nudity"]. */
  contentWarnings?: string[];
}

/**
 * Premium-gate over excerpt + media (per Q-P33). Distinct from
 * {@link ContentSensitivity} (monetization vs content-warning motivation; see
 * description §3.2).
 */
export interface ContentPaywall {
  isPaywalled: boolean;
  /** Subscription tier required to access — matches a {@link NewsVisibility} value. */
  tier?: string;
  /** First N words shown above the gate (renders inline when set). */
  preview?: string;
  /** Custom label on the CTA button. Defaults to "Subscribe to read" via labels. */
  ctaLabel?: string;
  /**
   * When set, CTA renders as `<a href={ctaHref}>` (host can pass `linkComponent`
   * to swap to Next/Remix link). `onClick` fires `onRevealPaywall(articleId)`
   * BEFORE navigation as an analytics hook. When unset, CTA renders as
   * `<button>` and only fires `onRevealPaywall`.
   */
  ctaHref?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 — Extended ContentCardItem (31 new optional fields)
// ─────────────────────────────────────────────────────────────────────────────

export interface ContentCardItem {
  // ─── v0.1 / v0.2 core (unchanged) ────────────────────────────────────────
  /** Stable identifier. Used for React keys and the default ariaLabel. */
  id: string;
  /** Headline. Rendered in the H-tag appropriate for the variant. */
  title: string;
  /** Image URL. */
  image: string;
  /** Short summary or lead paragraph. Variants gracefully omit when absent. */
  excerpt?: string;
  /** Category / tag string. Used as a key into `categoryStyles`. */
  category?: string;
  /**
   * Author byline as a plain string (legacy v0.1 shape). Stays for soft-compat.
   * When {@link ContentCardItem.authorEntity} is also set, the structured
   * version wins for rendering; this string is the fallback.
   */
  author?: string;
  /**
   * Publish date — ISO-8601 string or Date. Stays for soft-compat.
   * When {@link ContentCardItem.publishedAt} is set, it wins; this is the fallback.
   */
  date?: string | Date;
  /** Estimated read time in minutes. */
  readTime?: number;
  /** View count for engagement chip. Only `medium` renders this. */
  views?: number;

  // ─── v0.3.0 schema expansion (all optional; v0.2.x shape still satisfies) ─

  /** URL slug — canonical-URL composition, deep-linking. */
  slug?: string;

  /** Structured author — wins over the string `author` field when both set. */
  authorEntity?: NewsArticleAuthor;

  /** Publisher / source — wire-service / multi-source attribution. */
  publisher?: NewsPublisher;

  /** Canonical published timestamp — wins over `date` when both set. */
  publishedAt?: string | Date | number;
  /** Timestamp of the last edit. Renders an "(edited)" suffix on the date row. */
  updatedAt?: string | Date | number;
  /** Future timestamp when a `status: "scheduled"` article will publish. */
  scheduledFor?: string | Date | number;

  /** Lifecycle status. Only editor-mode renders the badge (Q-D10). */
  status?: ContentStatus;
  /** Audience / access tier. Renders a visibility badge in the badge stack. */
  visibility?: NewsVisibility;
  /** Topic taxonomy axis (separate from `category` / `tags`). */
  topics?: string[];
  /** Freeform hashtag-style chips. */
  tags?: string[];
  /** BCP-47 language tag. Drives `onTranslate` kebab item visibility. */
  language?: string;
  /** Languages this article is available in (data only in v0.3 — no render). */
  availableTranslations?: string[];

  /** Pinned articles render a "Pinned" badge. */
  isPinned?: boolean;
  /** Featured articles render a "Featured" badge. */
  isFeatured?: boolean;
  /** Breaking-news articles render a "Breaking" badge. Highest priority. */
  isBreaking?: boolean;
  /** Live-blog articles render a "Live" badge + optional live-update sub-line. */
  isLive?: boolean;
  /** Exclusive content renders an "Exclusive" badge. */
  isExclusive?: boolean;
  /** Sponsored content renders a "Sponsored" badge. */
  isSponsored?: boolean;
  /** Optional sponsor name — renders as "Sponsored by {name}" when set. */
  sponsorLabel?: string;

  /** Number of live updates posted (only meaningful when `isLive`). */
  liveUpdateCount?: number;
  /** Timestamp of the most-recent live update. */
  lastLiveUpdateAt?: string | Date | number;

  /** Sensitive-content gate (per-card). */
  sensitivity?: ContentSensitivity;
  /** Paywall gate (per-card). */
  paywall?: ContentPaywall;

  /** When false, comment-count chip is suppressed regardless of `commentCount`. */
  commentsEnabled?: boolean;
  /** Comment count for engagement chip. */
  commentCount?: number;
  /** Like count for engagement chip. */
  likeCount?: number;
  /** Whether the current viewer has liked this article. */
  isLiked?: boolean;
  /** Bookmark count for engagement chip. */
  bookmarkCount?: number;
  /** Whether the current viewer has bookmarked this article. */
  isBookmarked?: boolean;
  /** Share count for engagement chip. */
  shareCount?: number;

  /**
   * Quoted / referenced parent article — renders as a nested compact mini-card.
   * Recursion-strip applies: the inner card's own `quotedArticle` is ignored
   * (no infinite nesting). Per Q-P32 + Q-PE renders only in `medium` + `list`
   * variants.
   */
  quotedArticle?: ContentCardItem;
}

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 — Permissions matrix
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Discriminator for the universal {@link ContentCardNewsProps.canPerformAction}
 * predicate. 19 actions spanning editor / host-policy / reader / moderator.
 */
export type ContentCardPermissionAction =
  // editor-side (12)
  | "edit"
  | "delete"
  | "publish"
  | "unpublish"
  | "schedule"
  | "feature"
  | "pin"
  | "changeVisibility"
  | "changeCategory"
  | "markSensitive"
  | "seeAnalytics"
  | "pushToTop"
  // host-policy gates (2)
  | "share"
  | "bookmark"
  // reader-side (4)
  | "report"
  | "blockAuthor"
  | "muteAuthor"
  | "unfollowTopic"
  // moderator (1)
  | "moderate";

/**
 * Per-action permissions matrix. Overrides the `viewerMode`-derived defaults.
 *
 * **Resolution order (most → least specific):**
 *  1. `canPerformAction(action, item)` returning `true` / `false` — wins everything
 *  2. `permissions[canX]` per-field — `false` denies, `true` allows
 *  3. `viewerMode`-derived defaults (`"editor"` → editor-side `true`, reader-side `false`; `"viewer"` → inverse)
 *  4. Library-baseline default (legacy mode — no `viewerMode` + no `permissions` + no `canPerformAction`): no kebab rendered
 *
 * `canShare` / `canBookmark` are **host-policy gates** — reader-side actions
 * whose visibility the host can deny (e.g. paywalled articles may hide Share
 * for non-subscribers).
 *
 * `canModerate` is **orthogonal** to editor / viewer modes. When `true` AND
 * {@link ContentCardNewsProps.moderatorActions} returns ≥1 item, the kebab
 * renders a moderator section between common items and reader-destructive
 * items with a divider above. Defaults to `false` in both viewer modes.
 */
export interface ContentCardPermissions {
  // editor-side (12)
  canEdit?: boolean;
  canDelete?: boolean;
  canPublish?: boolean;
  canUnpublish?: boolean;
  canSchedule?: boolean;
  canFeature?: boolean;
  canPin?: boolean;
  canChangeVisibility?: boolean;
  canChangeCategory?: boolean;
  canMarkSensitive?: boolean;
  canSeeAnalytics?: boolean;
  canPushToTop?: boolean;
  // host-policy gates (2)
  canShare?: boolean;
  canBookmark?: boolean;
  // reader-side (4)
  canReport?: boolean;
  canBlockAuthor?: boolean;
  canMuteAuthor?: boolean;
  canUnfollowTopic?: boolean;
  // moderator (1)
  canModerate?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 — Mutation handlers (separate from engagement)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Editor + reader mutation handlers. Flattened onto {@link ContentCardNewsProps}
 * (not a nested prop bag).
 *
 * **Picker-free contract (Q-P40):** `onChangeVisibility`, `onChangeCategory`,
 * `onSchedule` are single triggers — library does NOT ship picker UIs. Host
 * opens its own picker (sheet / dialog / inline form) and calls back to its
 * API directly. Library only receives the trigger event.
 */
export interface ContentCardMutationHandlers {
  // editor-side (12)
  onEdit?: (articleId: string) => void;
  onDelete?: (articleId: string) => void;
  onPublish?: (articleId: string) => void;
  onUnpublish?: (articleId: string) => void;
  onSchedule?: (
    articleId: string,
    currentScheduledFor: Date | undefined,
  ) => void;
  onFeature?: (articleId: string, nextFeatured: boolean) => void;
  onPin?: (articleId: string, nextPinned: boolean) => void;
  onChangeVisibility?: (
    articleId: string,
    currentVisibility: NewsVisibility | undefined,
  ) => void;
  onChangeCategory?: (
    articleId: string,
    currentCategory: string | undefined,
  ) => void;
  onMarkSensitive?: (
    articleId: string,
    nextSensitive: boolean,
    reason?: string,
  ) => void;
  onSeeAnalytics?: (articleId: string) => void;
  onPushToTop?: (articleId: string) => void;
  // reader-side (4)
  onReport?: (articleId: string) => void;
  onBlockAuthor?: (authorId: string) => void;
  onMuteAuthor?: (authorId: string) => void;
  onUnfollowTopic?: (topic: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 — Engagement handlers (light count-chip model per Q-P35)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Engagement handlers for the light count-chip model. NOT a full
 * engagement-bar composition (Q-D6=(a)). Consumers who want the full bar
 * pass `<EngagementBar01>` into the `renderEngagementCounts` slot — the same
 * handlers below are pre-wired into the slot's `helpers` bag.
 */
export interface ContentCardEngagementHandlers {
  onLike?: (articleId: string, nextLiked: boolean) => void;
  onBookmark?: (articleId: string, nextBookmarked: boolean) => void;
  onShare?: (articleId: string) => void;
  /** Fired when the comment-count chip is tapped. Host navigates to article + jumps to comments. */
  onCommentCountClick?: (articleId: string) => void;
  /** Alias for {@link onCommentCountClick} — kept for symmetry with post-card-01. */
  onComment?: (articleId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 — Labels (~49 new keys per description §9)
// ─────────────────────────────────────────────────────────────────────────────

export interface ContentCardNewsLabels {
  // ─── v0.2 labels (5) — preserved ──────────────────────────────────────────
  /** Featured-variant CTA label. Default: 'Read More'. */
  readMore?: string;
  /** Compact "min" suffix for `large` variant. Default: 'min'. */
  minutesShort?: string;
  /** Long "min read" suffix for `featured` variant. Default: 'min read'. */
  minutesRead?: string;
  /** Visually-hidden label prefix on the link. Default: 'Read article:'. */
  readArticlePrefix?: string;
  /** aria-label suffix on the views chip. Default: 'views'. */
  viewsLabel?: string;

  // ─── v0.3.0 kebab labels (22) ─────────────────────────────────────────────
  /** Editor-side kebab item. Default "Edit". */
  edit?: string;
  /** Editor-side kebab item. Default "Delete". */
  delete?: string;
  /** Editor-side kebab item when `status !== "published"`. Default "Publish". */
  publish?: string;
  /** Editor-side kebab item when `status === "published"`. Default "Unpublish". */
  unpublish?: string;
  /** Editor-side kebab item. Default "Schedule". */
  schedule?: string;
  /** Editor-side kebab item when not featured. Default "Feature". */
  feature?: string;
  /** Editor-side kebab item when featured. Default "Unfeature". */
  unfeature?: string;
  /** Editor-side kebab item when not pinned. Default "Pin to top". */
  pin?: string;
  /** Editor-side kebab item when pinned. Default "Unpin". */
  unpin?: string;
  /** Editor-side kebab item. Default "Change visibility". */
  changeVisibility?: string;
  /** Editor-side kebab item. Default "Change category". */
  changeCategory?: string;
  /** Editor-side kebab item when not sensitive. Default "Mark as sensitive". */
  markSensitive?: string;
  /** Editor-side kebab item when sensitive. Default "Remove sensitive mark". */
  unmarkSensitive?: string;
  /** Editor-side kebab item. Default "See analytics". */
  seeAnalytics?: string;
  /** Editor-side kebab item. Default "Push to top of feed". */
  pushToTop?: string;
  /** Common kebab item when not bookmarked. Default "Bookmark". */
  bookmark?: string;
  /** Common kebab item when bookmarked. Default "Remove bookmark". */
  unbookmark?: string;
  /** Common kebab item. Default "Share". */
  share?: string;
  /** Common kebab item. Default "Copy link". */
  copyLink?: string;
  /** Common kebab item (visible when `item.language` set). Default "Translate". */
  translate?: string;
  /** Reader-side kebab item. Default "Report". */
  report?: string;
  /** Reader-side kebab item. Default "Block author". */
  blockAuthor?: string;
  /** Reader-side kebab item. Default "Mute author". */
  muteAuthor?: string;
  /** Reader-side kebab item. Default "Unfollow topic". */
  unfollowTopic?: string;

  // ─── v0.3.0 visibility labels (6) ─────────────────────────────────────────
  /** Visibility badge label for `"public"`. Default "Public". */
  visibilityPublic?: string;
  /** Visibility badge label for `"members"`. Default "Members". */
  visibilityMembers?: string;
  /** Visibility badge label for `"subscribers"`. Default "Subscribers". */
  visibilitySubscribers?: string;
  /** Visibility badge label for `"staff"`. Default "Staff". */
  visibilityStaff?: string;
  /** Visibility badge label for `"unlisted"`. Default "Unlisted". */
  visibilityUnlisted?: string;
  /** Fallback label for any custom visibility string. Default "Custom". */
  visibilityCustom?: string;

  // ─── v0.3.0 status labels (3 — `"published"` produces no badge) ───────────
  /** Status badge text when draft. Default "Draft". */
  statusDraft?: string;
  /** Status badge text when scheduled. Default "Scheduled". */
  statusScheduled?: string;
  /** Status badge text when archived. Default "Archived". */
  statusArchived?: string;

  // ─── v0.3.0 editorial badge labels (6) ────────────────────────────────────
  /** "Pinned" badge text. Default "Pinned". */
  pinnedBadgeLabel?: string;
  /** "Featured" badge text. Default "Featured". */
  featuredBadgeLabel?: string;
  /** "Breaking" badge text. Default "Breaking". */
  breakingBadgeLabel?: string;
  /** "Live" badge text. Default "Live". */
  liveBadgeLabel?: string;
  /** "Exclusive" badge text. Default "Exclusive". */
  exclusiveBadgeLabel?: string;
  /**
   * "Sponsored" badge template. `{name}` is replaced with `sponsorLabel`.
   * When `sponsorLabel` is not set, falls back to {@link sponsoredBadgeFallback}.
   * Default "Sponsored by {name}".
   */
  sponsoredBadgeLabelTemplate?: string;
  /** Fallback when `sponsorLabel` is not set. Default "Sponsored". */
  sponsoredBadgeFallback?: string;

  // ─── v0.3.0 paywall labels (4) ────────────────────────────────────────────
  /** Paywall gate heading. Default "Premium content". */
  paywallHeading?: string;
  /** Default CTA when `paywall.ctaLabel` is not set. Default "Subscribe to read". */
  paywallDefaultCta?: string;
  /** aria-label on the blurred overlay region. Default "Premium content — subscription required". */
  paywallBlurredOverlayAria?: string;
  /** Visual separator between `paywall.preview` text and the gate. Default "…". */
  paywallPreviewSeparator?: string;

  // ─── v0.3.0 sensitive labels (3) ──────────────────────────────────────────
  /** Sensitive-content gate heading. Default "Sensitive content". */
  sensitiveHeading?: string;
  /** Sensitive-content gate reveal button. Default "Show". */
  sensitiveRevealLabel?: string;
  /** Content-warning template; `{warnings}` is replaced with the joined warnings. Default "Contains: {warnings}". */
  sensitiveContentWarningTemplate?: string;

  // ─── v0.3.0 engagement labels (4) ─────────────────────────────────────────
  /** aria-label template on the like chip. `{count}` is replaced. Default "{count} likes". */
  likeAriaLabel?: string;
  /** aria-label template on the comment chip. `{count}` is replaced. Default "{count} comments". */
  commentAriaLabel?: string;
  /** aria-label template on the bookmark chip. `{count}` is replaced. Default "{count} bookmarks". */
  bookmarkAriaLabel?: string;
  /** aria-label template on the share chip. `{count}` is replaced. Default "{count} shares". */
  shareAriaLabel?: string;

  // ─── v0.3.0 live-blog label (1) ───────────────────────────────────────────
  /** Live-update sub-line template; `{time}` + `{count}` are replaced. Default "Updated {time} · {count} updates". */
  liveUpdatedTemplate?: string;

  // ─── v0.3.0 verified-byline label (1 extra for parallelism with post-card-01) ─
  /** aria-label on the verified-author check icon. Default "Verified author". */
  verifiedAuthorLabel?: string;
}

/**
 * Defaults — English. Hosts override via the {@link ContentCardNewsProps.labels}
 * prop, which deep-merges into this object.
 */
export const DEFAULT_LABELS: Required<ContentCardNewsLabels> = {
  // v0.2
  readMore: "Read More",
  minutesShort: "min",
  minutesRead: "min read",
  readArticlePrefix: "Read article:",
  viewsLabel: "views",

  // v0.3 — kebab
  edit: "Edit",
  delete: "Delete",
  publish: "Publish",
  unpublish: "Unpublish",
  schedule: "Schedule",
  feature: "Feature",
  unfeature: "Unfeature",
  pin: "Pin to top",
  unpin: "Unpin",
  changeVisibility: "Change visibility",
  changeCategory: "Change category",
  markSensitive: "Mark as sensitive",
  unmarkSensitive: "Remove sensitive mark",
  seeAnalytics: "See analytics",
  pushToTop: "Push to top of feed",
  bookmark: "Bookmark",
  unbookmark: "Remove bookmark",
  share: "Share",
  copyLink: "Copy link",
  translate: "Translate",
  report: "Report",
  blockAuthor: "Block author",
  muteAuthor: "Mute author",
  unfollowTopic: "Unfollow topic",

  // v0.3 — visibility
  visibilityPublic: "Public",
  visibilityMembers: "Members",
  visibilitySubscribers: "Subscribers",
  visibilityStaff: "Staff",
  visibilityUnlisted: "Unlisted",
  visibilityCustom: "Custom",

  // v0.3 — status
  statusDraft: "Draft",
  statusScheduled: "Scheduled",
  statusArchived: "Archived",

  // v0.3 — editorial badges
  pinnedBadgeLabel: "Pinned",
  featuredBadgeLabel: "Featured",
  breakingBadgeLabel: "Breaking",
  liveBadgeLabel: "Live",
  exclusiveBadgeLabel: "Exclusive",
  sponsoredBadgeLabelTemplate: "Sponsored by {name}",
  sponsoredBadgeFallback: "Sponsored",

  // v0.3 — paywall
  paywallHeading: "Premium content",
  paywallDefaultCta: "Subscribe to read",
  paywallBlurredOverlayAria: "Premium content — subscription required",
  paywallPreviewSeparator: "…",

  // v0.3 — sensitive
  sensitiveHeading: "Sensitive content",
  sensitiveRevealLabel: "Show",
  sensitiveContentWarningTemplate: "Contains: {warnings}",

  // v0.3 — engagement
  likeAriaLabel: "{count} likes",
  commentAriaLabel: "{count} comments",
  bookmarkAriaLabel: "{count} bookmarks",
  shareAriaLabel: "{count} shares",

  // v0.3 — live
  liveUpdatedTemplate: "Updated {time} · {count} updates",

  // v0.3 — verified
  verifiedAuthorLabel: "Verified author",
};

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 — Imperative handle (11 methods)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Imperative escape hatch for CMS dashboards / bulk-action UIs.
 *
 * Handle methods **bypass the permissions matrix** — they fire the underlying
 * handler regardless of whether the kebab item is visible. The matrix gates
 * UI affordances (which items render); the handle gates programmatic intent.
 * If a handler isn't wired, the method is a no-op.
 */
export interface ContentCardNews01Handle {
  openKebab: () => void;
  /** Fires `onEdit(item.id)` if wired. No-op otherwise. */
  triggerEdit: () => void;
  /** Fires `onDelete(item.id)` if wired. No-op otherwise. */
  triggerDelete: () => void;
  /** Fires `onPublish(item.id)` if wired. No-op otherwise. */
  triggerPublish: () => void;
  /** Fires `onUnpublish(item.id)` if wired. No-op otherwise. */
  triggerUnpublish: () => void;
  /** Fires `onPin(item.id, !item.isPinned)` if wired. No-op otherwise. */
  triggerPin: () => void;
  /** Fires `onFeature(item.id, !item.isFeatured)` if wired. No-op otherwise. */
  triggerFeature: () => void;
  /** Sets local `paywallRevealed=true` + fires `onRevealPaywall(item.id)` if wired. */
  revealPaywall: () => void;
  /** Sets local `sensitiveRevealed=true` + fires `onRevealSensitive(item.id)` if wired. */
  revealSensitive: () => void;
  /** Replace the item — re-derives local mirror; clears `paywallRevealed` + `sensitiveRevealed`. */
  reset: (next: ContentCardItem) => void;
  /** Read the current local mirror state (item + any local flags applied). */
  getCurrentItem: () => ContentCardItem;
}

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 — Per-entity click handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Click handlers for nested entities. Each fires when the corresponding
 * inline element is tapped — host opens its own profile / topic / tag /
 * category routes.
 */
export interface ContentCardClickHandlers {
  onAuthorClick?: (author: NewsArticleAuthor) => void;
  onPublisherClick?: (publisher: NewsPublisher) => void;
  onCategoryClick?: (category: string) => void;
  onTopicClick?: (topic: string) => void;
  onTagClick?: (tag: string) => void;
  /** Fired when the nested quoted-article mini-card is tapped. */
  onQuotedClick?: (quotedArticle: ContentCardItem) => void;
  /** Fired when the kebab "Translate" item is tapped (visible only if `item.language` set). */
  onTranslate?: (articleId: string, sourceLanguage: string) => void;
  /** Analytics hook — fires when the paywall CTA is tapped. */
  onRevealPaywall?: (articleId: string) => void;
  /** Analytics hook — fires when the sensitive-gate reveal button is tapped. */
  onRevealSensitive?: (articleId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.0 — Main props interface
// ─────────────────────────────────────────────────────────────────────────────

export interface ContentCardNewsProps
  extends ContentCardMutationHandlers,
    ContentCardEngagementHandlers,
    ContentCardClickHandlers {
  /** The item to render. */
  item: ContentCardItem;

  /** Visual variant. Default: 'medium'. */
  variant?: ContentCardNewsVariant;

  /** URL the card links to. */
  href?: string;
  /**
   * Click handler — object-shape, fired before navigation if `href` is also
   * set. v0.2 cutover stays — canonical `onClick` carries the object shape.
   */
  onClick?: (args: { item: ContentCardItem; event: MouseEvent }) => void;
  /** Element used for the link. Default: 'a'. Pass NextLink / RemixLink / etc. */
  linkComponent?: ElementType;

  /** Custom relative-time formatter. Default: English. */
  formatRelativeTime?: (date: Date, now?: Date) => string;
  /** Custom absolute-date formatter. Default: browser locale long format. */
  formatDate?: (date: Date) => string;
  /** Localized labels. Defaults are English. */
  labels?: ContentCardNewsLabels;

  /** Map of category → Tailwind class string. Falls back to `bg-muted` when absent. */
  categoryStyles?: Record<string, string>;
  /** Override classes for the title. */
  titleClassName?: string;
  /** Override classes for the image. */
  imageClassName?: string;
  /** Override classes for the root <article>. */
  className?: string;

  /** Override the link's accessible name. Default: '<readArticlePrefix> <title>'. */
  ariaLabel?: string;

  /** Optional cluster of buttons/links sitting ABOVE the link overlay (z-10). */
  actions?: ReactNode;

  /** Image loading strategy. Default: 'lazy' ('eager' for `featured`). */
  loading?: "lazy" | "eager";

  // ─── v0.3.0 role-aware mode (opt-in per Q-D1 lock) ───────────────────────

  /**
   * Two-mode toggle for role-aware kebab + render affordances. `undefined` =
   * v0.2 legacy mode (no kebab rendered unless any role-aware arg is set).
   * No auto-derivation — host explicitly picks.
   */
  viewerMode?: NewsViewerMode;
  /** Per-action permissions matrix. Overrides `viewerMode`-derived defaults. */
  permissions?: ContentCardPermissions;
  /**
   * Universal permission predicate — wins over `permissions` + `viewerMode`.
   * Return `true` / `false` to force-allow / deny; return `undefined` to fall
   * through to the matrix → mode defaults → legacy mode.
   */
  canPerformAction?: (
    action: ContentCardPermissionAction,
    item: ContentCardItem,
  ) => boolean | undefined;

  // ─── v0.3.0 render slots (7 sub-feature + kebab + moderator) ─────────────

  /** Full takeover for the badge stack. Default renders `<NewsBadges>`. */
  renderBadges?: (
    item: ContentCardItem,
    helpers: { canModerate: boolean },
  ) => ReactNode;
  /** Full takeover for the author byline. Default renders `<NewsAuthorByline>`. */
  renderAuthor?: (
    author: NewsArticleAuthor | string | undefined,
    helpers: { publisher: NewsPublisher | undefined },
  ) => ReactNode;
  /** Full takeover for the excerpt. Default renders the string from `item.excerpt`. */
  renderExcerpt?: (item: ContentCardItem) => ReactNode;
  /** Full takeover for the paywall gate. Default renders `<NewsPaywallGate>` when `item.paywall.isPaywalled`. */
  renderPaywallGate?: (
    item: ContentCardItem,
    helpers: { onReveal: () => void },
  ) => ReactNode;
  /** Full takeover for the sensitive-content gate. Default renders `<ContentSensitiveGate>` when `item.sensitivity.isSensitive`. */
  renderSensitiveGate?: (
    item: ContentCardItem,
    helpers: { onReveal: () => void },
  ) => ReactNode;
  /** Full takeover for the quoted-article mini-card. Default renders `<QuotedArticleCard>` when `item.quotedArticle` set. */
  renderQuoted?: (
    item: ContentCardItem,
    helpers: { onClick?: () => void },
  ) => ReactNode;
  /**
   * Full takeover for the engagement counts row. Default renders
   * `<NewsEngagementCounts>` (light count chips). Consumers compose
   * `<EngagementBar01>` here for the news article detail page (see
   * description §6.2 — the news-detail-page composition pattern).
   */
  renderEngagementCounts?: (
    item: ContentCardItem,
    helpers: {
      handlers: {
        onLike?: ContentCardNewsProps["onLike"];
        onComment?: ContentCardNewsProps["onCommentCountClick"];
        onShare?: ContentCardNewsProps["onShare"];
        onBookmark?: ContentCardNewsProps["onBookmark"];
      };
    },
  ) => ReactNode;
  /**
   * Kebab full-takeover slot. When supplied, all default items + moderator
   * section + permission gating are bypassed; host's items render verbatim.
   */
  kebabActions?: (item: ContentCardItem) => CommentMenuItem[];
  /**
   * Supplier for the moderator section of the kebab. Items render only when
   * `canModerate` resolves to `true`. Bypassed entirely when `kebabActions`
   * full-takeover slot is supplied.
   */
  moderatorActions?: (item: ContentCardItem) => CommentMenuItem[];

  // ─── v0.3.0 opt-outs (suppress defaults without taking over via slot) ────

  /** Suppress the default badge-stack render. */
  disableBadgesRender?: boolean;
  /** Suppress the default author-byline render. */
  disableAuthorRender?: boolean;
  /** Suppress the default excerpt render. */
  disableExcerptRender?: boolean;
  /** Suppress the default paywall gate even when `item.paywall.isPaywalled`. */
  disablePaywallGate?: boolean;
  /** Suppress the default sensitive gate even when `item.sensitivity.isSensitive`. */
  disableSensitiveGate?: boolean;
  /** Suppress the default quoted-article render even when `item.quotedArticle` set. */
  disableQuotedRender?: boolean;
  /** Suppress the default engagement-counts row. */
  disableEngagementCounts?: boolean;

  // ─── v0.3.0 imperative handle ─────────────────────────────────────────────

  ref?: Ref<ContentCardNews01Handle>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal — passed from the root to each `parts/<variant>.tsx`
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Internal shape passed from the root to each `parts/<variant>.tsx`.
 * All defaults resolved; all formatting pre-computed.
 *
 * Grows at C4 (root + local-mirror + handle) — variant parts pull resolved
 * permissions / slots / opt-outs / kebab items / pre-wired handlers from
 * here without re-deriving. C11 wires them up.
 */
export interface ResolvedPartProps {
  // v0.2 carry
  item: ContentCardItem;
  formattedDate: string | undefined;
  formattedRelativeTime: string | undefined;
  categoryStyle: string;
  labels: Required<ContentCardNewsLabels>;
  LinkComponent: ElementType;
  href: string | undefined;
  onClick: ((event: MouseEvent) => void) | undefined;
  ariaLabel: string;
  titleId: string;
  titleClassName: string | undefined;
  imageClassName: string | undefined;
  className: string | undefined;
  actions: ReactNode;
  loading: "lazy" | "eager";

  // v0.3 — resolved permissions + role-aware passthrough
  viewerMode: NewsViewerMode | undefined;
  resolvedPermissions: Required<ContentCardPermissions>;
  canModerate: boolean;

  // v0.3 — local-mirror flags + reveal callbacks
  paywallRevealed: boolean;
  sensitiveRevealed: boolean;
  onRevealPaywallInternal: () => void;
  onRevealSensitiveInternal: () => void;

  // v0.3 — render slots passthrough
  renderBadges: ContentCardNewsProps["renderBadges"];
  renderAuthor: ContentCardNewsProps["renderAuthor"];
  renderExcerpt: ContentCardNewsProps["renderExcerpt"];
  renderPaywallGate: ContentCardNewsProps["renderPaywallGate"];
  renderSensitiveGate: ContentCardNewsProps["renderSensitiveGate"];
  renderQuoted: ContentCardNewsProps["renderQuoted"];
  renderEngagementCounts: ContentCardNewsProps["renderEngagementCounts"];

  // v0.3 — opt-outs passthrough
  disableBadgesRender: boolean;
  disableAuthorRender: boolean;
  disableExcerptRender: boolean;
  disablePaywallGate: boolean;
  disableSensitiveGate: boolean;
  disableQuotedRender: boolean;
  disableEngagementCounts: boolean;

  // v0.3 — engagement handlers pre-bound to item id (for the counts row)
  engagementHandlers: {
    onLike?: (nextLiked: boolean) => void;
    onComment?: () => void;
    onShare?: () => void;
    onBookmark?: (nextBookmarked: boolean) => void;
  };

  // v0.3 — kebab items computed once. Empty array → don't render kebab.
  kebabItems: CommentMenuItem[];

  // v0.3 — per-entity click handlers passthrough
  onAuthorClick: ContentCardNewsProps["onAuthorClick"];
  onPublisherClick: ContentCardNewsProps["onPublisherClick"];
  onCategoryClick: ContentCardNewsProps["onCategoryClick"];
  onTopicClick: ContentCardNewsProps["onTopicClick"];
  onTagClick: ContentCardNewsProps["onTagClick"];
  onQuotedClick: ContentCardNewsProps["onQuotedClick"];
}
