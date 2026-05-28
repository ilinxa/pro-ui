import type { ElementType, ReactNode } from "react";
import type { MediaItem } from "@/registry/components/media/media-carousel-01";
import type {
  Comment,
  CommentDelta,
  CommentMenuItem,
  CommentThreadCurrentUser,
  CommentThreadLabels,
  CommentThread01Handle,
  Subscribe,
} from "@/registry/components/data/comment-thread-01";
import type {
  EngagementAction,
  EngagementBar01Handle,
  EngagementBarLabels,
  EngagementDelta,
  EngagementLikerProfile,
} from "@/registry/components/data/engagement-bar-01";

export type PostCard01Variant = "feed" | "compact" | "list" | "detail";

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
 * {@link PostCard01Props.moderatorActions} slot which supplies the menu items.
 * The moderator section renders as its own group in the kebab with a divider
 * above it, sitting between common items and viewer-destructive items. Full
 * kebab takeover via {@link PostCard01Props.kebabActions} still bypasses everything.
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
   * AND {@link PostCard01Props.moderatorActions} returns ≥1 item, the kebab
   * renders a moderator section between common items and viewer-destructive
   * items with a divider above it. Defaults to `false` in both viewer modes —
   * moderators must be opted in explicitly by the host's permission resolver.
   */
  canModerate?: boolean;
}

/**
 * Owner / viewer mutation handlers. Separate from {@link PostHandlers} (which
 * stays "engagement-action handlers only" — `onLike` / `onComment` / `onShare`
 * / `onBookmark`). Flattened onto `PostCard01Props` — consumers pass handlers
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
  // viewer-side (onReport already exists on PostCard01Props from v0.1 — preserved)
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
 * results. Optimistic vote flow per Q-D5 lock — host calls `onVotePoll`,
 * library flips local-mirror immediately, host reverts via `ref.current.reset()`
 * on failure.
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
 *    comment toggles an inline `<CommentThread01>` (with composer) below the engagement bar.
 *    Card owns the panel state. Matches the kasder PostEngagementPanel UX.
 *  - `"navigate"`: comment-icon click fires `onComment(postId)` (host navigates / scrolls);
 *    like is a single button (heart + count bundled, fires `onLike(postId, next)`). No inline panels.
 *
 * Default is `"inline"` so the canonical social UX works without opt-in. Pass `"navigate"` to
 * deactivate the inline panels for a host that wants page navigation instead.
 */
export type EngagementMode = "navigate" | "inline";

/**
 * @deprecated Use `EngagementLikerProfile` from `@ilinxa/engagement-bar-01` instead.
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

/** Engagement-action handlers only — comment handlers stay separate. */
export interface PostHandlers {
  onLike?: (postId: string, nextLiked: boolean) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string, nextBookmarked: boolean) => void;
}

export interface PostCard01Labels {
  verifiedBadgeLabel?: string;
  bookmark?: string;
  unbookmark?: string;
  share?: string;
  copyLink?: string;
  report?: string;
  commentsHeading?: string;
  /** Inline likers panel heading. Default "Likes". */
  likersHeading?: string;
  /** Likers panel "+N" pill aria-label template; `{count}` is replaced. Default "+{count} more". */
  likersMoreLabel?: string;
  /** Inline panel "Hide" button label. Default "Hide". */
  hidePanelLabel?: string;
  /** Share panel heading. Default "Share with…". */
  shareHeading?: string;
  /** Share panel search placeholder. Default "Search people…". */
  shareSearchPlaceholder?: string;
  /** Share panel empty-state. Default "No matches." */
  shareEmptyLabel?: string;
  formatRelativeTime?: (date: Date, now: Date) => string;
  engagementLabels?: EngagementBarLabels;
  commentLabels?: CommentThreadLabels;

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
  /** Poll "X votes" pluralization template; `{count}` is replaced. Default "{count} votes". */
  pollTotalVotesLabel?: string;
  /** Poll countdown text when active; `{time}` is replaced with relative time. Default "Closes {time}". */
  pollClosesAtLabel?: string;
  /** Poll countdown text when closed. Default "Poll closed". */
  pollClosedLabel?: string;
}

export const DEFAULT_POST_CARD_LABELS: Required<
  Omit<
    PostCard01Labels,
    "formatRelativeTime" | "engagementLabels" | "commentLabels"
  >
> = {
  verifiedBadgeLabel: "Verified account",
  bookmark: "Bookmark",
  unbookmark: "Remove bookmark",
  share: "Share",
  copyLink: "Copy link",
  report: "Report",
  commentsHeading: "Comments",
  likersHeading: "Likes",
  likersMoreLabel: "+{count} more",
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
  pollTotalVotesLabel: "{count} votes",
  pollClosesAtLabel: "Closes {time}",
  pollClosedLabel: "Poll closed",
};

export interface PostCard01Props extends PostHandlers, PostMutationHandlers {
  variant: PostCard01Variant;
  post: Post;
  currentUser?: CommentThreadCurrentUser;

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

  /** Fired when the viewer taps a poll option (optimistic flow). */
  onVotePoll?: (postId: string, optionId: string) => void;
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

  commentThread?: Comment[];
  commentPageSize?: number;

  onAddComment?: (
    content: string,
    parentId?: string,
  ) => Promise<Comment | void> | Comment | void;
  onLikeComment?: (commentId: string, nextLiked: boolean) => void;
  onDeleteComment?: (commentId: string) => void;
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
   * `"inline"`: comment click toggles `<CommentThread01>` panel; like opens inline likers strip.
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
  /** Max-height of the inline comments panel before scroll. Default `"24rem"` (~384px). */
  inlineCommentsMaxHeight?: string;
  /** Open one of the inline panels by default on mount (only when `engagementMode === "inline"`). */
  defaultInlinePanel?: "none" | "likes" | "comments";
  /** Auto-open the likers panel on like (matches kasder). Default true under inline mode. */
  openLikersOnLike?: boolean;

  renderHeader?: (
    post: Post,
    helpers: { currentUser?: CommentThreadCurrentUser },
  ) => ReactNode;
  renderContent?: (post: Post) => ReactNode;
  renderMedia?: (
    media: MediaItem[],
    helpers: { onDoubleTap?: () => void },
  ) => ReactNode;
  engagementActions?: (
    post: Post,
    handlers: PostHandlers,
    variant: PostCard01Variant,
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
   * Bypassed entirely when {@link PostCard01Props.kebabActions} is supplied
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
      onAddComment?: PostCard01Props["onAddComment"];
      onLikeComment?: PostCard01Props["onLikeComment"];
      onDeleteComment?: PostCard01Props["onDeleteComment"];
      onReportComment?: PostCard01Props["onReportComment"];
      onLoadMoreComments?: PostCard01Props["onLoadMoreComments"];
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

  labels?: PostCard01Labels;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  mediaClassName?: string;
  engagementClassName?: string;
  commentSectionClassName?: string;

  ref?: React.Ref<PostCard01Handle>;
}

export interface PostCard01Handle {
  openKebab: () => void;
  /** Card-level "canonical Instagram tap" — flips like via bar AND bumps burst counter (when wired). */
  triggerLike: () => void;
  /** Read the current local mirror state (post + engagement deltas applied). */
  getCurrentPost: () => Post;
  /** Replace the post (re-derives local engagement mirror; clears pollVote + sensitiveRevealed). */
  reset: (next: Post) => void;
  getEngagementHandle: () => EngagementBar01Handle | null;
  getThreadHandle: () => CommentThread01Handle | null;

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
   * Optimistic poll vote — sets local `pollVote = { optionId, votedAt }` + fires
   * `onVotePoll(post.id, optionId)` if wired. Host can reject by calling `reset(originalPost)`,
   * which clears the local pollVote alongside the rest of the mirror.
   */
  votePoll: (optionId: string) => void;
}
