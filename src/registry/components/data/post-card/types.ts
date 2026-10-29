import type { ElementType, ReactNode } from "react";
// F-S1 lock: cross-procomp imports use RELATIVE paths to specific files
// (NOT barrels) so shadcn 4.6.0's path-rewriter doesn't mangle them.
// See .claude/decisions/2026-05-28-post-card-v0.3.1-fcross-11-fs1-cleanup.md
// Cross-category type imports are not safe under shadcn 4.6.0's rewriter
// (both `@/registry/components/<other-cat>/<other-slug>` AND its `/types`
// suffix get mangled — sometimes to the wrong slug, sometimes preserving an
// invalid `<cat>/` prefix). For cross-category TYPES we inline a local
// structurally-compatible copy. Keep in sync with media-carousel's
// MediaItem export. Cross-category COMPONENT imports (MediaCarousel) DO
// work via `@/registry/components/<cat>/<slug>/<slug>` — see variants.

/**
 * Structurally identical to `@ilinxa/media-carousel`'s `MediaItem`.
 * Inlined to avoid the cross-category type-import rewriter bug. If
 * media-carousel's MediaItem changes shape, this must follow manually.
 */
export type PostMediaItem =
  | {
      id: string;
      type: "image";
      url: string;
      alt?: string;
    }
  | {
      id: string;
      type: "video";
      url: string;
      alt?: string;
      poster?: string;
    };

/**
 * @deprecated v0.3.2 — use `PostMediaItem`. Soft-compat alias for v0.2.x
 * consumers that imported `MediaItem` from this barrel. The cross-category
 * type re-export was broken at install-time even at v0.2.0; this alias
 * preserves the symbol name for source-code compatibility.
 */
export type MediaItem = PostMediaItem;
import type {
  Comment,
  CommentDelta,
  CommentMenuItem,
  CommentThreadCurrentUser,
  CommentThreadLabels,
  CommentThreadHandle,
  CommentThreadProps,
  Subscribe,
} from "../comment-thread/types";
import type {
  EngagementAction,
  EngagementActionEvent,
  EngagementBarHandle,
  EngagementBarLabels,
  EngagementBarProps,
  EngagementDelta,
  EngagementLikerProfile,
  EngagementReactionKind,
} from "../engagement-bar/types";
import type { LikersStripLabels, LikersStripProps } from "../engagement-bar/parts/likers-strip";
import type { ShareMenuLabels, ShareMenuProps } from "../engagement-bar/parts/share-menu";
import type { ExpandableTextLabels } from "../expandable-text/types";

/**
 * The media carousel options the card forwards (`mediaProps`). Structurally a subset of
 * `@ilinxa/media-carousel`'s props — inlined because cross-category TYPE imports do not survive
 * the shadcn path rewriter. Keep in sync with media-carousel.
 */
export interface PostMediaProps {
  /** Slide frame ratio. Default `"square"`. */
  aspect?: "square" | "video" | "portrait" | "auto" | "natural-clamped";
  /** `natural-clamped` lower bound (width / height). */
  minRatio?: number;
  /** `natural-clamped` upper bound (width / height). */
  maxRatio?: number;
  /** Gallery peek ratio per side. */
  peekRatio?: number;
  loop?: boolean;
  showIndicators?: boolean;
  showNavButtons?: boolean | "fine-pointer";
  showCounter?: boolean;
  /** A built-in image / video failed to load: resolve a fresh URL to retry once. */
  onMediaError?: (item: PostMediaItem) => Promise<string | void> | string | void;
  /** Carousel labels (media-carousel's `MediaCarouselLabels`). */
  labels?: {
    carouselLabel?: string;
    previousSlide?: string;
    nextSlide?: string;
    goToSlide?: string | ((position: number) => string);
    slideAriaLabel?: string | ((position: number, total: number) => string);
    counter?: (position: number, total: number, format: (n: number) => string) => string;
    carouselRoleDescription?: string;
    slideRoleDescription?: string;
  };
  className?: string;
  slideClassName?: string;
}

/** The engagement-bar options the card forwards (`engagementBarProps`). */
export type PostEngagementBarProps = Pick<
  EngagementBarProps,
  | "formatCount"
  | "optimistic"
  | "likersPreview"
  | "reactionsPreview"
  | "trailing"
  | "onReactionPickerOpenChange"
  | "className"
  | "actionClassName"
  | "size"
  | "hideZeroCounts"
>;

/**
 * The likers-strip options the card forwards to its inline likers panel (`likersStripProps`, 0.7.0):
 * profile links, full names, a per-liker badge, touch size.
 */
export type PostLikersStripProps = Pick<
  LikersStripProps,
  "getProfileHref" | "linkComponent" | "nameDisplay" | "renderBadge" | "size"
>;

/**
 * The share-menu options the card forwards to its inline share panel (`shareMenuProps`, 0.7.0): a
 * header row (copy link, the system share sheet), per-person send state, touch size. With
 * `pendingIds` or `sentIds` set the panel stays open after a pick, so the row can show its state.
 */
export type PostShareMenuProps = Pick<ShareMenuProps, "header" | "pendingIds" | "sentIds" | "size">;

/**
 * Disclosure wiring for post-card's inline panels (0.6.1). post-card passes it to its default
 * actions in inline mode, and (0.7.0) as the fourth argument of the `engagementActions` slot so a
 * host's own actions can carry `aria-expanded` and open the panels with the clicked button as the
 * opener.
 */
export interface PostInlineDisclosure {
  /** The inline panel that is open. */
  open: "none" | "likes" | "comments" | "share";
  /** The panels' element ids (`aria-controls` targets). */
  ids: { likes: string; comments: string; share: string };
  /** Share opens a panel (`shareSuggestions` is set); otherwise the share action carries no disclosure state. */
  shareOpens: boolean;
  /** 0.7.0. Toggles the likers panel, taking the clicked button as the opener. */
  likes: (event: EngagementActionEvent) => void;
  /** Toggles the comments panel, taking the clicked button as the opener. */
  comment: (event: EngagementActionEvent) => void;
  /** Toggles the share panel, taking the clicked button as the opener. */
  share: (event: EngagementActionEvent) => void;
}

/**
 * Reactions for the post (`reactions` prop). With it, the default actions show a reaction picker
 * in place of the like, and double-tap applies `defaultKind` when the viewer has no reaction yet.
 * The `Post` shape does not change.
 */
export interface PostReactions {
  /** Ordered reaction catalog (icon + label per key). */
  kinds: EngagementReactionKind[];
  /**
   * The viewer's reaction key, or `null`. Passing it (string or `null`) controls the reaction:
   * it, `counts` and `totalCount` win on every render. Omit it for an uncontrolled picker.
   */
  viewerReaction?: string | null;
  /** Per-kind tallies (merged into `kinds[].count`). A `null` tally is withheld. */
  counts?: Record<string, number | null>;
  /** Total across kinds. `null` withholds it. */
  totalCount?: number | null;
  /** Pick (or clear, `null`). Return a promise: a rejection rolls the change back. */
  onReact?: (postId: string, reaction: string | null) => void | Promise<unknown>;
  /** Kind double-tap applies. Default: the first of `kinds`. */
  defaultKind?: string;
  /** Tap with a reaction set clears it (`true`, default) or opens the picker (`false`). */
  clearOnTap?: boolean;
  /**
   * 0.7.0. `"primary"`: one tap sets `primaryKey` (default: the first of `kinds`), a tap while set
   * clears it, and the picker opens on a long-press, ArrowUp / ContextMenu / Shift+F10 or (with
   * `hoverOpenDelay`) a resting mouse. Passed to engagement-bar's reaction action.
   */
  tapAction?: "picker" | "primary";
  /** 0.7.0. The kind a primary tap sets (`tapAction: "primary"`). */
  primaryKey?: string;
  /** 0.7.0. Opt-in: a mouse resting this many milliseconds on the trigger opens the picker. */
  hoverOpenDelay?: number;
}

/** What changed, reported with the next post to `onPostChange` (controlled mode), once accepted. */
export type PostChange =
  | { kind: "like"; liked: boolean }
  | { kind: "bookmark"; bookmarked: boolean }
  | { kind: "poll-vote"; optionId: string }
  | { kind: "delta"; delta: EngagementDelta };

/** Helpers `renderHeader` receives. */
export interface PostHeaderRenderHelpers {
  currentUser?: CommentThreadCurrentUser;
  /** The default actions menu (trigger + items), or `null` when there are no items. Place it anywhere. */
  kebab: ReactNode;
}

export type PostCardVariant = "feed" | "compact" | "list" | "detail";

/**
 * Two-mode toggle for role-aware kebab + render affordances.
 *  - `"owner"`: shows Edit / Delete / Pin / Change-visibility / Mark-sensitive / See-analytics kebab items (when their handlers are wired).
 *  - `"viewer"`: shows Report / Block author / Mute author (when wired).
 *
 * **Opt-in semantics (per Q-D1 lock):** `viewerMode === undefined` → v0.1 legacy
 * mode (handler-driven kebab, no role-aware items). No auto-derivation from
 * `currentUser` — the host explicitly picks the mode to keep the library neutral
 * across identity / role models (different projects derive ownership differently).
 *
 * Moderator UX (take-down, feature, lock, etc.) is **NOT** a third `viewerMode`
 * value — moderation is an orthogonal capability that crosses owner / viewer
 * lines. Wire it via `permissions.canModerate: true` (or
 * `canPerformAction("moderate", post) === true`) PLUS the
 * {@link PostCardProps.moderatorActions} slot which supplies the menu items.
 * The moderator section renders as its own group in the kebab with a divider
 * above it, sitting between common items and viewer-destructive items. Full
 * kebab takeover via {@link PostCardProps.kebabActions} still bypasses everything.
 */
export type PostViewerMode = "owner" | "viewer";

/**
 * Facebook-style extensible visibility shape.
 *
 * Library renders default labels + icons for the 6 base values via
 * `DEFAULT_POST_CARD_LABELS`. Custom string values (e.g. `"specific-friends"`,
 * `"list:close-friends"`, `"everyone-except-bob"`) get a fallback "Custom" label.
 * Granular Facebook-style cases ("Friends except…", "Specific friends only")
 * are encoded by the host as their own string keys; library doesn't model the
 * granularity directly.
 */
export type PostVisibility =
  | "public"
  | "followers"
  | "friends"
  | "circle"
  | "only-me"
  | "private"
  | (string & {});

/** Discriminator for the universal `canPerformAction` predicate. */
export type PostPermissionAction =
  | "edit"
  | "delete"
  | "pin"
  | "changeVisibility"
  | "markSensitive"
  | "seeAnalytics"
  | "share"
  | "bookmark"
  | "report"
  | "blockAuthor"
  | "muteAuthor"
  | "moderate";

/**
 * Per-action permissions matrix. Overrides the `viewerMode`-derived defaults.
 *
 * Resolution order (most → least specific):
 *  1. `canPerformAction(action, post)` returning `true` / `false` — wins everything
 *  2. `permissions[canX]` per-field — `false` denies, `true` allows
 *  3. `viewerMode`-derived defaults (`"owner"` → all owner-side `true`, viewer-side `false`; `"viewer"` → inverse)
 *  4. Library-baseline default (legacy mode — no `viewerMode` + no `permissions` + no `canPerformAction`): v0.1 handler-driven kebab behavior
 *
 * `canShare` / `canBookmark` are **host-policy gates** — viewer-side actions whose
 * visibility the host can deny (e.g. `visibility: "private"` posts may hide Share;
 * unauthenticated viewers may have `canBookmark: false`).
 */
export interface PostPermissions {
  // owner-side
  canEdit?: boolean;
  canDelete?: boolean;
  canPin?: boolean;
  canChangeVisibility?: boolean;
  canMarkSensitive?: boolean;
  canSeeAnalytics?: boolean;
  // host-policy gates
  canShare?: boolean;
  canBookmark?: boolean;
  // viewer-side
  canReport?: boolean;
  canBlockAuthor?: boolean;
  canMuteAuthor?: boolean;
  /**
   * Moderator capability — orthogonal to owner / viewer modes. When `true`
   * AND {@link PostCardProps.moderatorActions} returns ≥1 item, the kebab
   * renders a moderator section between common items and viewer-destructive
   * items with a divider above it. Defaults to `false` in both viewer modes —
   * moderators must be opted in explicitly by the host's permission resolver.
   */
  canModerate?: boolean;
  /**
   * Actions that stay visible but cannot be used: their kebab items render disabled. Works in
   * role-aware mode and in the legacy handler-driven mode.
   */
  disabled?: Partial<Record<PostPermissionAction, boolean>>;
}

/**
 * Owner / viewer mutation handlers. Separate from {@link PostHandlers} (which
 * stays "engagement-action handlers only" — `onLike` / `onComment` / `onShare`
 * / `onBookmark`). Flattened onto `PostCardProps` — consumers pass handlers
 * at the top level, not as a nested prop bag.
 *
 * `onChangeVisibility` per Q-P42 lock: library does NOT ship a visibility picker
 * UI. This callback fires when the kebab "Change visibility" item is tapped;
 * the host opens its own picker (banner / sheet / dialog / inline control) and
 * calls back to its API directly. Library only receives the trigger event.
 */
export interface PostMutationHandlers {
  // owner-side
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onPin?: (postId: string, nextPinned: boolean) => void;
  onChangeVisibility?: (
    postId: string,
    currentVisibility: PostVisibility | undefined,
  ) => void;
  onMarkSensitive?: (
    postId: string,
    nextSensitive: boolean,
    reason?: string,
  ) => void;
  onSeeAnalytics?: (postId: string) => void;
  // viewer-side (onReport already exists on PostCardProps from v0.1 — preserved)
  onBlockAuthor?: (authorId: string) => void;
  onMuteAuthor?: (authorId: string) => void;
}

/**
 * Inline mention with range offset for highlighting in the content body.
 * Consumer-supplied; library doesn't parse mentions from raw text.
 */
export interface PostMention {
  id: string;
  name: string;
  username?: string;
  /** [start, end] character offsets in `post.content` (UTF-16 code units, end-exclusive). */
  range: [number, number];
}

/** Geo / place chip data for the header sub-row. */
export interface PostLocation {
  name: string;
  lat?: number;
  lng?: number;
}

/** Reply-to ancestor — drives the "Replying to @x" sub-header line. */
export interface PostReplyTo {
  id: string;
  author: PostAuthor;
}

/** Single poll option. */
export interface PostPollOption {
  id: string;
  label: string;
  voteCount: number;
}

/**
 * Inline poll on the post body. Viewer sees vote buttons; owner sees live
 * results. Optimistic vote: the card shows the vote at once and calls `onVotePoll`;
 * a returned promise that rejects rolls it back (controlled: reported once accepted).
 */
export interface PostPoll {
  options: PostPollOption[];
  closesAt?: Date | string | number;
  totalVotes: number;
  /** Whether the current viewer has already voted (gates the vote buttons). */
  hasVoted?: boolean;
  /** The option id the viewer voted for (highlights it in the results view). */
  viewerVoteOptionId?: string;
  /** Whether the poll allows multi-select. Default false (single-choice). */
  multiSelect?: boolean;
}

/**
 * OG-style link preview card. Host pre-fetches and supplies; library is
 * fetch-free per Q-D4 lock.
 */
export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  /** Image URL — rendered as a hero image at the top of the preview card. */
  image?: string;
  siteName?: string;
}

/**
 * Behavior of the comment + like actions:
 *  - `"inline"` (default): like splits into heart (toggle) + count (open likers panel inline);
 *    comment toggles an inline `<CommentThread>` (with composer) below the engagement bar.
 *    Card owns the panel state. Matches the kasder PostEngagementPanel UX.
 *  - `"navigate"`: comment-icon click fires `onComment(postId)` (host navigates / scrolls);
 *    like is a single button (heart + count bundled, fires `onLike(postId, next)`). No inline panels.
 *
 * Default is `"inline"` so the canonical social UX works without opt-in. Pass `"navigate"` to
 * deactivate the inline panels for a host that wants page navigation instead.
 */
export type EngagementMode = "navigate" | "inline";

/**
 * @deprecated Use `EngagementLikerProfile` from `@ilinxa/engagement-bar` instead.
 * Kept as a soft-compat type alias for v0.1.x consumers that imported this name
 * directly. Will be removed in a future major bump. Structurally identical to
 * `EngagementLikerProfile` (relaxed-fields UI display shape).
 */
export type PostLikeUser = EngagementLikerProfile;

export interface PostAuthor {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  media?: MediaItem[];
  createdAt: Date | string | number;
  likes: number;
  isLiked?: boolean;
  comments: number;
  shares?: number;
  viewCount?: number;
  isBookmarked?: boolean;

  // ─── v0.2.0 schema expansion (all optional; v0.1.x consumers' Post shape still satisfies) ───

  /** Hashtag chips rendered below the content body. Clickable via `onTagClick`. */
  tags?: string[];
  /** Inline mention ranges for `@name` highlighting in the body (host-supplied; library doesn't parse). */
  mentions?: PostMention[];
  /** Place chip in the header sub-row beside the timestamp. */
  location?: PostLocation;
  /**
   * Audience visibility. Renders a small icon badge next to the timestamp.
   * Default semantics if absent: treated as `"public"` (no badge rendered).
   */
  visibility?: PostVisibility;
  /** Timestamp of the last edit. Renders an "(edited)" suffix after the relative time. */
  editedAt?: Date | string | number;
  /** Pinned posts render a "Pinned" badge above the header. */
  isPinned?: boolean;
  /** Sensitive content gate over the media block — viewer must tap to reveal. */
  isSensitive?: boolean;
  /** Optional reason shown inside the sensitive-content gate. */
  sensitiveReason?: string;
  /** BCP-47 language tag. Drives `onTranslate` kebab item visibility (no auto-translate in v0.2.0). */
  language?: string;
  /** Reply-to ancestor — drives the "Replying to @x" sub-header line. */
  replyTo?: PostReplyTo;
  /** Quoted / reposted parent — renders as a nested compact mini-card under the content. */
  repostOf?: Post;
  /** OG-style link preview card rendered below content and above media. */
  linkPreview?: LinkPreview;
  /** Inline poll widget below content. */
  poll?: PostPoll;
}

/**
 * Engagement-action handlers only — comment handlers stay separate. `onLike` / `onBookmark` may
 * return a promise: the change shows at once and a rejection rolls it back (`optimistic`).
 */
export interface PostHandlers {
  /**
   * `event` (0.7.0) is the heart's click event when the like came from the card's own bar —
   * `undefined` otherwise (a double-tap on the media, the imperative handle).
   */
  onLike?: (
    postId: string,
    nextLiked: boolean,
    event?: EngagementActionEvent,
  ) => void | Promise<unknown>;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string, nextBookmarked: boolean) => void | Promise<unknown>;
}

export interface PostCardLabels {
  verifiedBadgeLabel?: string;
  bookmark?: string;
  unbookmark?: string;
  share?: string;
  copyLink?: string;
  report?: string;
  commentsHeading?: string;
  /** Inline likers panel heading. Default "Likes". */
  likersHeading?: string;
  /**
   * Likers panel "+N" pill accessible name. `formatted` is the count in `locale`.
   * Default `` (_, f) => `+${f} more` ``. (A string template before 0.6.0.)
   */
  likersMoreLabel?: (count: number, formatted: string) => string;
  /** Inline panel "Hide" button label. Default "Hide". */
  hidePanelLabel?: string;
  /** Share panel heading. Default "Share with…". */
  shareHeading?: string;
  /** Share panel search placeholder. Default "Search people…". */
  shareSearchPlaceholder?: string;
  /** Share panel empty-state. Default "No matches." */
  shareEmptyLabel?: string;
  /** @deprecated Use the card's `formatRelativeTime` prop. Still honoured when the prop is not set. */
  formatRelativeTime?: (date: Date, now: Date) => string;
  engagementLabels?: EngagementBarLabels;
  commentLabels?: CommentThreadLabels;
  /** Nested: the inline likers panel (LikersStrip). Wins over `likersHeading` / `likersMoreLabel` / `hidePanelLabel`. */
  likersLabels?: Partial<LikersStripLabels>;
  /** Nested: the inline share panel (ShareMenu). Wins over the `share*` keys and `hidePanelLabel`. */
  shareLabels?: Partial<ShareMenuLabels>;
  /** Nested: the body's "Show more" / "Show less" toggle (ExpandableText). */
  textLabels?: ExpandableTextLabels;

  // ─── 0.6.0 ───
  /** Name of the post's actions menu. Default "Post actions". */
  kebabAriaLabel?: string;
  /** List variant meta: likes. Default `` (n, f) => `${f} ${n === 1 ? "like" : "likes"}` ``. */
  listLikes?: (count: number, formatted: string) => string;
  /** List variant meta: comments. Default `` (n, f) => `${f} ${n === 1 ? "comment" : "comments"}` ``. */
  listComments?: (count: number, formatted: string) => string;
  /** List variant meta: shares. Default `` (n, f) => `${f} ${n === 1 ? "share" : "shares"}` ``. */
  listShares?: (count: number, formatted: string) => string;
  /** Name of the quoted (repost) mini-card's link. Default `` (name) => `Open ${name}'s post` ``. */
  openRepost?: (authorName: string) => string;

  // ─── v0.2.0 kebab labels (role-aware items) ───

  /** Owner-side kebab item label. Default "Edit". */
  edit?: string;
  /** Owner-side kebab item label. Default "Delete". */
  delete?: string;
  /** Owner-side kebab item label when not pinned. Default "Pin to top". */
  pin?: string;
  /** Owner-side kebab item label when already pinned. Default "Unpin". */
  unpin?: string;
  /** Owner-side kebab item label. Default "Change visibility". */
  changeVisibility?: string;
  /** Owner-side kebab item label when not sensitive. Default "Mark as sensitive". */
  markSensitive?: string;
  /** Owner-side kebab item label when already sensitive. Default "Remove sensitive mark". */
  unmarkSensitive?: string;
  /** Owner-side kebab item label. Default "See analytics". */
  seeAnalytics?: string;
  /** Viewer-side kebab item label. Default "Block author". */
  blockAuthor?: string;
  /** Viewer-side kebab item label. Default "Mute author". */
  muteAuthor?: string;
  /** Translate kebab item label (visible when `post.language` is set and `onTranslate` handler is wired). Default "Translate". */
  translate?: string;

  // ─── v0.2.0 visibility-badge + edit-suffix labels ───

  /** Visibility badge label / tooltip for `"public"`. Default "Public". */
  visibilityPublic?: string;
  /** Visibility badge label / tooltip for `"followers"`. Default "Followers". */
  visibilityFollowers?: string;
  /** Visibility badge label / tooltip for `"friends"`. Default "Friends". */
  visibilityFriends?: string;
  /** Visibility badge label / tooltip for `"circle"`. Default "Circle". */
  visibilityCircle?: string;
  /** Visibility badge label / tooltip for `"only-me"`. Default "Only me". */
  visibilityOnlyMe?: string;
  /** Visibility badge label / tooltip for `"private"`. Default "Private". */
  visibilityPrivate?: string;
  /** Fallback label for any custom visibility string not in the 6 base values. Default "Custom". */
  visibilityCustom?: string;
  /** Suffix appended after the relative timestamp when `editedAt` is set. Default "(edited)". */
  editedSuffix?: string;
  /** Pinned badge text. Default "Pinned". */
  pinnedBadgeLabel?: string;
  /** "Replying to" sub-header line label prefix. Default "Replying to". Renders as `{label} @{username}`. */
  replyingTo?: string;

  // ─── v0.2.0 sensitive-gate labels ───

  /** Sensitive-media gate heading. Default "Sensitive content". */
  sensitiveHeading?: string;
  /** Sensitive-media gate reveal button. Default "Show". */
  sensitiveRevealLabel?: string;

  // ─── v0.2.0 poll labels ───

  /** Poll widget heading. Default "Poll". */
  pollHeading?: string;
  /**
   * Poll total. `formatted` is the count in `locale`.
   * Default `` (n, f) => `${f} ${n === 1 ? "vote" : "votes"}` ``. (A `{count}` template before 0.6.0.)
   */
  pollTotalVotesLabel?: (count: number, formatted: string) => string;
  /** Poll countdown while open; `time` is the relative time. Default `` (t) => `Closes ${t}` ``. (A `{time}` template before 0.6.0.) */
  pollClosesAtLabel?: (time: string) => string;
  /** Poll countdown text when closed. Default "Poll closed". */
  pollClosedLabel?: string;
}

/** The nested and deprecated keys — everything else in {@link PostCardLabels} is resolved. */
export type PostCardNestedLabelKeys =
  | "formatRelativeTime"
  | "engagementLabels"
  | "commentLabels"
  | "likersLabels"
  | "shareLabels"
  | "textLabels";

/** Fully-resolved flat labels (what parts receive). */
export type ResolvedPostCardLabels = Required<Omit<PostCardLabels, PostCardNestedLabelKeys>>;

export const defaultPostCardLabels: ResolvedPostCardLabels = {
  verifiedBadgeLabel: "Verified account",
  bookmark: "Bookmark",
  unbookmark: "Remove bookmark",
  share: "Share",
  copyLink: "Copy link",
  report: "Report",
  commentsHeading: "Comments",
  likersHeading: "Likes",
  likersMoreLabel: (_, f) => `+${f} more`,
  hidePanelLabel: "Hide",
  shareHeading: "Share with…",
  shareSearchPlaceholder: "Search people…",
  shareEmptyLabel: "No matches.",
  // v0.2.0 additions
  edit: "Edit",
  delete: "Delete",
  pin: "Pin to top",
  unpin: "Unpin",
  changeVisibility: "Change visibility",
  markSensitive: "Mark as sensitive",
  unmarkSensitive: "Remove sensitive mark",
  seeAnalytics: "See analytics",
  blockAuthor: "Block author",
  muteAuthor: "Mute author",
  translate: "Translate",
  visibilityPublic: "Public",
  visibilityFollowers: "Followers",
  visibilityFriends: "Friends",
  visibilityCircle: "Circle",
  visibilityOnlyMe: "Only me",
  visibilityPrivate: "Private",
  visibilityCustom: "Custom",
  editedSuffix: "(edited)",
  pinnedBadgeLabel: "Pinned",
  replyingTo: "Replying to",
  sensitiveHeading: "Sensitive content",
  sensitiveRevealLabel: "Show",
  pollHeading: "Poll",
  pollTotalVotesLabel: (n, f) => `${f} ${n === 1 ? "vote" : "votes"}`,
  pollClosesAtLabel: (t) => `Closes ${t}`,
  pollClosedLabel: "Poll closed",
  kebabAriaLabel: "Post actions",
  listLikes: (n, f) => `${f} ${n === 1 ? "like" : "likes"}`,
  listComments: (n, f) => `${f} ${n === 1 ? "comment" : "comments"}`,
  listShares: (n, f) => `${f} ${n === 1 ? "share" : "shares"}`,
  openRepost: (name) => `Open ${name}'s post`,
};

/** @deprecated Use {@link defaultPostCardLabels}. */
export const DEFAULT_POST_CARD_LABELS = defaultPostCardLabels;

export interface PostCardProps extends PostHandlers, PostMutationHandlers {
  variant: PostCardVariant;
  /**
   * The post. Without `onPostChange` it is read once, at mount (use the handle's `reset(next)` to
   * push updates). With `onPostChange` it is controlled: it wins on every render, optimistic
   * like / bookmark / poll vote show over it while their promise is in flight, and accepted
   * changes are reported, not applied.
   */
  post: Post;
  /** Makes `post` controlled. Called with the next post and what changed, once a change is accepted. */
  onPostChange?: (next: Post, change: PostChange) => void;
  /**
   * Show like / bookmark / poll vote at once while their promise is in flight (default `true`).
   * A rejection rolls it back; only the latest request per action decides.
   */
  optimistic?: boolean;
  currentUser?: CommentThreadCurrentUser;

  // ─── 0.6.0 ───

  /** Reactions in place of the like; see {@link PostReactions}. */
  reactions?: PostReactions;
  /** Link for the author's avatar and name (rendered with `linkComponent`). */
  getAuthorHref?: (author: PostAuthor, post: Post) => string | undefined;
  /** Extra line under the author's name (e.g. "Sponsored", a role). */
  subtitle?: ReactNode | ((post: Post) => ReactNode);
  /** Notice above the content (e.g. "Under review"). Return `null` for none. */
  noticeSlot?: (post: Post) => ReactNode;
  /** Items appended to the end of the default actions menu (not gated by `canModerate`). */
  extraKebabActions?: (post: Post) => CommentMenuItem[];
  /** BCP 47 locale for times, counts and every composed child. Default `"en"`. */
  locale?: string;
  /** Time zone for absolute dates (the edited tooltip). Default: the runtime's. */
  timeZone?: string;
  /**
   * "Now" for relative times and the poll's closed check. Without it the card reads the clock
   * after mount (no relative text renders on the server or the first client render) and again
   * every minute.
   */
  now?: Date;
  /**
   * Relative-time formatter. Default: English "5m" / "2h" for `"en"`, `Intl.RelativeTimeFormat`
   * otherwise. Also called with a FUTURE date — the poll's closing time ("in 3d") — so handle both.
   */
  formatRelativeTime?: (date: Date, now: Date) => string;
  /** Count formatter for every count the card renders (list meta, poll total, likers pill) and the bar / thread unless they get their own. Default `Intl.NumberFormat(locale, { notation: "compact" })`. */
  formatCount?: (n: number) => string;
  /** Media carousel options; see {@link PostMediaProps}. */
  mediaProps?: PostMediaProps;
  /** Engagement bar options; see {@link PostEngagementBarProps}. */
  engagementBarProps?: PostEngagementBarProps;
  /**
   * Anything else for the comment thread (cursor paging, `onLoadReplies`, `onCommentsChange`,
   * `moderation`, `extraActions`, reactions…). The card's own comment props (`onAddComment`,
   * `commentActions`, …) win over the same keys here when they are defined.
   */
  commentThreadProps?: Omit<Partial<CommentThreadProps>, "comments">;

  // ─── v0.2.0 role-aware mode (opt-in per Q-D1 lock) ───

  /**
   * Two-mode toggle for role-aware kebab + render affordances. `undefined` =
   * v0.1 legacy mode (handler-driven kebab, no role-aware items). No
   * auto-derivation from `currentUser` — host explicitly picks.
   */
  viewerMode?: PostViewerMode;
  /** Per-action permissions matrix. Overrides `viewerMode`-derived defaults. */
  permissions?: PostPermissions;
  /**
   * Universal permission predicate — wins over `permissions` + `viewerMode`.
   * Return `true` / `false` to force-allow / deny; return `undefined` to fall
   * through to the matrix → mode defaults → legacy mode.
   */
  canPerformAction?: (
    action: PostPermissionAction,
    post: Post,
  ) => boolean | undefined;

  // ─── v0.2.0 schema-expansion render handlers ───

  /** Fired when the viewer taps a poll option (optimistic; return a promise to roll back on reject). */
  onVotePoll?: (postId: string, optionId: string) => void | Promise<unknown>;
  /** Fired when the viewer dismisses the sensitive-media gate. Analytics hook. */
  onRevealSensitive?: (postId: string) => void;
  /** Fired when the kebab "Translate" item is tapped (visible only if `post.language` is set). */
  onTranslate?: (postId: string, sourceLanguage: string) => void;
  /** Fired when a `@mention` span is tapped in the content body. Host opens its own profile preview / popover. */
  onMentionClick?: (mentionId: string) => void;
  /** Fired when a `#tag` chip is tapped below the content body. */
  onTagClick?: (tag: string) => void;
  /** Fired when the location chip in the header sub-row is tapped. */
  onLocationClick?: (location: PostLocation) => void;
  /** Fired when the OG link-preview card is tapped. Overrides the default `<a href>` navigation. */
  onLinkPreviewClick?: (url: string) => void;
  /** Fired when the nested repost mini-card is tapped. Overrides the default `getHref(repostOf)` navigation. */
  onRepostOfClick?: (originalPost: Post) => void;

  /**
   * The comments for the thread. Read once by the thread, even when `post` is controlled — to make
   * it controlled too, pass `commentThreadProps.onCommentsChange`.
   */
  commentThread?: Comment[];
  commentPageSize?: number;

  onAddComment?: CommentThreadProps["onAddComment"];
  onLikeComment?: CommentThreadProps["onLikeComment"];
  onDeleteComment?: CommentThreadProps["onDeleteComment"];
  onReportComment?: (commentId: string) => void;
  onLoadMoreComments?: (page: number) => Promise<Comment[]>;
  onCopyLink?: (postId: string) => void;
  onReport?: (postId: string) => void;

  engagementSubscribe?: Subscribe<EngagementDelta>;
  commentSubscribe?: Subscribe<CommentDelta>;
  onSubscribeEngagementDelta?: (delta: EngagementDelta) => void;
  onSubscribeCommentDelta?: (delta: CommentDelta) => void;

  /** Card overlay-link target + Copy-link kebab item. Ignored for overlay-link in detail variant. */
  getHref?: (post: Post) => string;
  /** Polymorphic root component for overlay-link. Default "a". */
  linkComponent?: ElementType;
  /** Opt-out for the canonical heart-burst flow. Default false. */
  disableHeartBurst?: boolean;

  // ─── Inline engagement panels (kasder UX) ───
  /**
   * `"navigate"` (default): comment click → `onComment(postId)`; no inline panels.
   * `"inline"`: comment click toggles `<CommentThread>` panel; like opens inline likers strip.
   */
  engagementMode?: EngagementMode;
  /** Pre-loaded likers (for inline likers panel). Only used when `engagementMode === "inline"`. */
  likers?: PostLikeUser[];
  /** Fetch more likers — host returns appended page; component appends to local state. */
  onLoadMoreLikers?: () => Promise<PostLikeUser[]>;

  /** Recent / suggested users for the share panel. When provided, share button opens
   * an inline searchable user list (kasder UX). Otherwise share fires `onShare(postId)`. */
  shareSuggestions?: PostLikeUser[];
  /** Optional async search for the share panel. Receives the query, returns matching users. */
  onShareSearch?: (query: string) => Promise<PostLikeUser[]>;
  /** Fired when the user picks a recipient from the share panel. */
  onShareTo?: (postId: string, recipient: PostLikeUser) => void;
  /** 0.7.0. Forwarded to the inline likers panel (`LikersStrip`). */
  likersStripProps?: PostLikersStripProps;
  /** 0.7.0. Forwarded to the inline share panel (`ShareMenu`). */
  shareMenuProps?: PostShareMenuProps;
  /** Max-height of the inline comments panel before scroll. Default `"24rem"` (~384px). */
  inlineCommentsMaxHeight?: string;
  /** Open one of the inline panels by default on mount (only when `engagementMode === "inline"`). */
  defaultInlinePanel?: "none" | "likes" | "comments";
  /** Auto-open the likers panel on like (matches kasder). Default true under inline mode. */
  openLikersOnLike?: boolean;

  /** Full takeover for the header. `helpers.kebab` is the default actions menu, so it can survive. */
  renderHeader?: (post: Post, helpers: PostHeaderRenderHelpers) => ReactNode;
  renderContent?: (post: Post) => ReactNode;
  renderMedia?: (
    media: MediaItem[],
    helpers: { onDoubleTap?: () => void },
  ) => ReactNode;
  /**
   * Replaces the default actions. In inline mode (0.7.0) the fourth argument is the inline
   * disclosure: pass it to `defaultPostEngagementActions` (or wire `expanded` / `controls` and the
   * openers yourself) so your actions report the open panel and return focus to the clicked button.
   */
  engagementActions?: (
    post: Post,
    handlers: PostHandlers,
    variant: PostCardVariant,
    inline?: PostInlineDisclosure,
  ) => EngagementAction[];
  renderEngagementBar?: (
    post: Post,
    defaults: { actions: EngagementAction[] },
  ) => ReactNode;
  kebabActions?: (post: Post) => CommentMenuItem[];
  /**
   * Supplier for the moderator section of the kebab. Items render only when
   * `canModerate` resolves to `true` (via `permissions.canModerate` or
   * `canPerformAction("moderate", post)`). The library inserts a divider
   * above the first returned item and positions the group between common
   * items (Bookmark / Share / Copy link / Translate) and viewer-destructive
   * items (Mute / Block / Report). Return `[]` to suppress.
   *
   * Bypassed entirely when {@link PostCardProps.kebabActions} is supplied
   * (full takeover wins).
   */
  moderatorActions?: (post: Post) => CommentMenuItem[];
  commentActions?: (
    comment: Comment,
    helpers: {
      currentUser?: CommentThreadCurrentUser;
      isOwn: boolean;
      depth: number;
    },
  ) => CommentMenuItem[];
  renderCommentSection?: (
    post: Post,
    handlers: {
      onAddComment?: PostCardProps["onAddComment"];
      onLikeComment?: PostCardProps["onLikeComment"];
      onDeleteComment?: PostCardProps["onDeleteComment"];
      onReportComment?: PostCardProps["onReportComment"];
      onLoadMoreComments?: PostCardProps["onLoadMoreComments"];
    },
  ) => ReactNode;

  // ─── v0.2.0 render slots for schema-expansion features ───

  /** Full takeover for the inline poll widget. Default renders `<PollWidget>` when `post.poll` is set. */
  renderPoll?: (
    post: Post,
    helpers: { onVote?: (optionId: string) => void; isOwnerView: boolean },
  ) => ReactNode;
  /** Full takeover for the OG link-preview card. Default renders `<LinkPreviewCard>` when `post.linkPreview` is set. */
  renderLinkPreview?: (post: Post) => ReactNode;
  /** Full takeover for the nested repost mini-card. Default renders `<RepostOfCard>` when `post.repostOf` is set. */
  renderRepostOf?: (
    post: Post,
    helpers: { onClick?: () => void },
  ) => ReactNode;
  /** Full takeover for the sensitive-media gate overlay. Default renders `<SensitiveGate>` when `post.isSensitive` is true. */
  renderSensitiveGate?: (
    post: Post,
    helpers: { onReveal: () => void },
  ) => ReactNode;

  // ─── v0.2.0 opt-outs (disable default renders without taking over via slot) ───

  /** When true, the default poll widget render is suppressed even if `post.poll` is set. */
  disablePollRender?: boolean;
  /** When true, the default link-preview card render is suppressed even if `post.linkPreview` is set. */
  disableLinkPreviewRender?: boolean;
  /** When true, the default repost mini-card render is suppressed even if `post.repostOf` is set. */
  disableRepostOfRender?: boolean;
  /** When true, the default sensitive-media gate is suppressed even if `post.isSensitive` is true. */
  disableSensitiveGate?: boolean;

  headingAs?: "h2" | "h3" | "h4";
  bodyMaxLines?: number;

  labels?: PostCardLabels;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  mediaClassName?: string;
  engagementClassName?: string;
  commentSectionClassName?: string;

  ref?: React.Ref<PostCardHandle>;
}

export interface PostCardHandle {
  openKebab: () => void;
  /** Card-level "canonical Instagram tap" — flips like via bar AND bumps burst counter (when wired). */
  triggerLike: () => void;
  /** Read the current local mirror state (post + engagement deltas applied). */
  getCurrentPost: () => Post;
  /** Replace the post (uncontrolled) and clear overlays, the poll vote and the sensitive reveal (both modes). */
  reset: (next: Post) => void;
  getEngagementHandle: () => EngagementBarHandle | null;
  getThreadHandle: () => CommentThreadHandle | null;

  // ─── v0.2.0 imperative triggers ───
  // The handle is an escape hatch — these methods fire the handler without
  // consulting the permissions matrix. The matrix gates UI affordances (which
  // kebab items render), not programmatic triggers. If the handler isn't wired,
  // the method is a no-op. Consumers using these triggers are presumed to know
  // what they're doing (e.g. moderator dashboards with custom UI bypassing the
  // default kebab).

  /** Fires `onEdit(post.id)` if wired. No-op otherwise. */
  triggerEdit: () => void;
  /** Fires `onDelete(post.id)` if wired. No-op otherwise. */
  triggerDelete: () => void;
  /** Fires `onPin(post.id, !post.isPinned)` if wired. No-op otherwise. */
  triggerPin: () => void;
  /** Sets local `sensitiveRevealed=true` (clears the gate) + fires `onRevealSensitive` if wired. */
  revealSensitive: () => void;
  /**
   * Optimistic poll vote — applies the vote to the shown post (`poll.hasVoted`,
   * `viewerVoteOptionId`, the totals) and fires `onVotePoll(post.id, optionId)` if wired. A
   * returned promise that rejects rolls it back; controlled mode reports it once accepted.
   */
  votePoll: (optionId: string) => void;
}
