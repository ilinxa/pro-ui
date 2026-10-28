import type { ComponentType, ElementType, ReactNode } from "react";
// F-S1 lock: same-category cross-procomp type import via a relative, specific-file path.
import type {
  EngagementAction,
  EngagementBarLabels,
  EngagementReactionKind,
} from "../engagement-bar/types";

export type CommentThreadVariant = "default" | "compact";

/**
 * Moderation state of a comment. `"visible"` (or omitted) renders normally. The other states
 * render as a labelled tombstone that keeps its replies **when `comment-thread-moderation` is
 * installed** (`moderation` prop); without it such a comment is left out, with its replies (one
 * development warning).
 */
export type CommentState = "visible" | "hidden" | "deleted" | "removed";

/** The non-visible states — what a tombstone label is written for. */
export type CommentTombstoneState = Exclude<CommentState, "visible">;

/**
 * Per-comment permissions. Each DEFINED key beats the thread's default for that action; an
 * omitted key keeps the default. Defaults: `canDelete` / `canEdit` = the viewer wrote it;
 * `canReply` = a viewer is signed in; `canReact` = `true`; `canReport` = the viewer did not
 * write it; `canPin` / `canHide` = `false`. `canReact: false` disables the row's action, whether it
 * is the like or the reaction picker.
 *
 * `canPin` / `canHide` gate nothing built in: the resolved values reach `extraActions`,
 * `commentActions` and `renderNode` helpers so your own pin / hide items can use them.
 */
export interface CommentPermissions {
  canEdit?: boolean;
  canDelete?: boolean;
  canPin?: boolean;
  canHide?: boolean;
  canReply?: boolean;
  canReact?: boolean;
  canReport?: boolean;
}

/** {@link CommentPermissions} with every key resolved. */
export type ResolvedCommentPermissions = Required<CommentPermissions>;

/**
 * Reaction data for one comment, read by the built-in reaction action (`reactionKinds` +
 * `onReactComment`). Ignored by the default like action.
 */
export interface CommentReactions {
  /** The viewer's reaction key (one of `reactionKinds[].key`), or `null`. */
  viewerReaction?: string | null;
  /** Per-kind tallies. A `null` / missing tally is withheld. */
  counts?: Record<string, number | null>;
  /** Total across kinds. `null` withholds it. */
  totalCount?: number | null;
}

export interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  content: string;
  createdAt: Date | string | number;
  /** Like count. `null` withholds it: no number renders, and no count reaches an accessible name. */
  likes: number | null;
  isLiked?: boolean;
  replies?: Comment[];
  /**
   * Server-known reply total. When it is larger than the loaded `replies`, a "view N replies"
   * link loads the rest through `onLoadReplies`.
   */
  replyCount?: number;
  /**
   * Cursor for this comment's next page of replies (`onLoadReplies(commentId, cursor)`). Omit it
   * (or pass `null`) to start from the first page.
   */
  repliesCursor?: string | null;
  /**
   * Server-marked edited flag. When `true`, the row renders an "(edited)" suffix after the
   * timestamp. A `{ kind: "edited" }` delta also sets it.
   */
  edited?: boolean;
  /**
   * Client-generated id sent with a new comment (`onAddComment(content, parentId, { clientId })`).
   * When your server echoes it, an `added` delta for your own comment reconciles with the pending
   * one instead of duplicating it. Matching uses the comment id first, then `clientId`.
   */
  clientId?: string;
  /** Moderation state. See {@link CommentState}. */
  state?: CommentState;
  /** Shows a "Pinned" marker when `comment-thread-moderation` is installed; ignored otherwise. */
  isPinned?: boolean;
  /** Per-comment permissions; see {@link CommentPermissions}. */
  permissions?: CommentPermissions;
  /** Reaction data for the built-in reaction action; see {@link CommentReactions}. */
  reactions?: CommentReactions;
}

export type CommentDelta =
  | { kind: "added"; comment: Comment; parentId?: string }
  | { kind: "edited"; commentId: string; content: string }
  /** Prunes the comment and its replies; with `removedMode="tombstone"` it becomes state `"removed"`. */
  | { kind: "removed"; commentId: string }
  | { kind: "liked"; commentId: string; liked: boolean; count: number | null }
  /** Sets a comment's moderation state. */
  | { kind: "state"; commentId: string; state: CommentState }
  /** Server-authoritative reaction data for one comment. */
  | { kind: "reacted"; commentId: string; reactions: CommentReactions };

export type Unsubscribe = () => void;
export type Subscribe<T> = (handler: (delta: T) => void) => Unsubscribe;

export interface CommentMenuItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  /** Leaves the item out of the menu. A menu whose items are all hidden is not rendered. */
  hidden?: boolean;
  /**
   * Render a divider line above this item. Used by host components that group
   * items into visual sections (e.g. post-card's moderator section sits
   * above viewer-destructive items). comment-thread's own menu draws no divider
   * automatically; post-card's menu also draws one before its first destructive item.
   */
  separatorBefore?: boolean;
}

export interface CommentThreadCurrentUser {
  id: string;
  name: string;
  avatar?: string;
}

/** What `commentActions`, `extraActions` and `engagementActions` receive beside the comment. */
export interface CommentActionHelpers {
  currentUser?: CommentThreadCurrentUser;
  isOwn: boolean;
  depth: number;
  /** The comment's resolved permissions (its own `permissions` over the defaults). */
  permissions: ResolvedCommentPermissions;
  /**
   * `true` while the comment is not yet confirmed by the server (a temporary id). Actions on a
   * pending comment must not call your server: the built-in ones are disabled.
   */
  isPending: boolean;
}

/** What `engagementActions` receives beside the comment. */
export interface CommentEngagementHelpers extends CommentActionHelpers {
  /** The row's default action (the like, or the reaction when `reactionKinds` is set). Spread or extend it. */
  defaultActions: EngagementAction[];
}

export interface CommentNodeHelpers {
  currentUser?: CommentThreadCurrentUser;
  isOwn: boolean;
  depth: number;
  /** The comment's resolved permissions. */
  permissions: ResolvedCommentPermissions;
  /** `true` while the comment awaits the server; `onLike` / `onReply` / `onDelete` do nothing then. */
  isPending: boolean;
  onLike: (nextLiked: boolean) => void;
  onReply: () => void;
  onDelete: () => void;
  onReport: () => void;
}

export interface CommentComposerState {
  value: string;
  isReply: boolean;
  parentId?: string;
  isSubmitting: boolean;
  /** `true` after the last submit failed, until the value changes or a submit succeeds. */
  hasError: boolean;
}

export interface CommentComposerHelpers {
  setValue: (next: string) => void;
  /**
   * Submit the composer. Never rejects: a failed post sets `state.hasError` and keeps the value.
   *
   * With no argument it posts the value from the current render — the normal
   * flow, where `setValue` runs on input change and `submit` on a later click.
   *
   * Pass the text explicitly when both happen in the SAME tick (a form handler
   * that reads its own input, calls `setValue`, then submits): React has not
   * re-rendered yet, so the no-argument form would still hold the previous
   * value. The component deliberately does not solve this with a ref — these
   * helpers are handed to `renderComposer` DURING render, so a ref read on that
   * path is exactly what the React Compiler forbids.
   */
  submit: (value?: string) => Promise<void>;
  cancel: () => void;
}

/**
 * Localized strings. Every key is optional on input; an omitted (or `undefined`) key keeps the
 * English default in {@link defaultCommentThreadLabels}. A string that carries a value is a
 * function, so plurals and word order live inside it.
 */
export interface CommentThreadLabels {
  composerPlaceholder?: string;
  composerSend?: string;
  composerCancel?: string;
  like?: string;
  unlike?: string;
  reply?: string;
  delete?: string;
  report?: string;
  /** Function so consumers pluralize / localize without our help. */
  viewReplies?: (count: number) => string;
  /** "Load more" button. Default "Load older comments". */
  loadMore?: string;
  emptyState?: string;
  /**
   * @deprecated @notImplemented Not rendered by the thread (it never was): pass `composerEmptyState`
   * for the signed-out composer area. Passing it logs one development warning.
   */
  signInPrompt?: string;
  /** Suffix appended after the timestamp when `comment.edited === true`. Default `"(edited)"`. */
  editedSuffix?: string;
  /**
   * @deprecated Use the thread's `formatRelativeTime` prop. Still honoured when the prop is not set.
   */
  formatRelativeTime?: (date: Date, now: Date) => string;

  // ─── 0.4.0 ───
  /** Name of a row's actions menu. Default `` `Comment actions for ${name}` ``. */
  kebabAriaLabel?: (authorName: string) => string;
  /** Name of the inline reply composer. Default `` `Reply to ${name}` ``. */
  replyTo?: (authorName: string) => string;
  /** "Load more" while a page loads. Default "Load older comments…". */
  loadingMore?: string;
  /** Shown in place of the time on a comment awaiting the server. Default "Sending…". */
  sending?: string;
  /** Alert under the composer after a failed post. Default "Couldn't post your comment. Try again.". */
  postFailed?: string;
  /** Retry button after a failed load. Default "Retry". */
  retry?: string;
  /** Alert after a failed "load more". Default "Couldn't load comments.". */
  loadFailed?: string;
  /** Link after the first page of replies, while more exist. Default "View more replies". */
  moreReplies?: string;
  /** While replies load. Default "Loading replies…". */
  loadingReplies?: string;
  /** Alert after replies failed to load. Default "Couldn't load replies.". */
  loadRepliesFailed?: string;
  /** Tombstone text per state (`comment-thread-moderation`). Default "This comment was deleted" / "…hidden" / "…removed". */
  tombstone?: (state: CommentTombstoneState) => string;
  /** Pinned marker (`comment-thread-moderation`). Default "Pinned". */
  pinned?: string;
  /** Edit menu item (`comment-thread-moderation`). Default "Edit". */
  edit?: string;
  /** Save button of the edit composer (`comment-thread-moderation`). Default "Save". */
  save?: string;
  /** Alert after a failed edit (`comment-thread-moderation`). Default "Couldn't save your edit.". */
  editFailed?: string;

  // ─── 0.5.0 ───
  /** Expand control of a clamped comment body (forwarded to expandable-text). Default "Show more". */
  showMore?: string;
  /** Collapse control of an expanded comment body. Default "Show less". */
  showLess?: string;
  /** Shown in place of the bottom composer when the thread is `closed`. Default "Comments are turned off.". */
  closed?: string;
  /**
   * Labels forwarded to every row's engagement-bar: the names of host actions added with
   * `engagementActions` (comment, share, bookmark, view count, likers panel) and of the reaction
   * picker. An explicitly set thread `like` / `unlike` wins over `engagement.like` /
   * `engagement.unlike`; either one localizes the heart.
   */
  engagement?: EngagementBarLabels;
}

/** Fully-resolved labels (what parts receive). `engagement` stays optional. */
export type ResolvedCommentThreadLabels = Required<
  Omit<CommentThreadLabels, "formatRelativeTime" | "engagement">
> &
  Pick<CommentThreadLabels, "engagement">;

export const defaultCommentThreadLabels: ResolvedCommentThreadLabels = {
  composerPlaceholder: "Write a comment…",
  composerSend: "Send",
  composerCancel: "Cancel",
  like: "Like",
  unlike: "Unlike",
  reply: "Reply",
  delete: "Delete",
  report: "Report",
  viewReplies: (count) =>
    `View ${count} ${count === 1 ? "reply" : "replies"}`,
  loadMore: "Load older comments",
  emptyState: "No comments yet — be the first.",
  signInPrompt: "Sign in to comment",
  editedSuffix: "(edited)",
  kebabAriaLabel: (name) => `Comment actions for ${name}`,
  replyTo: (name) => `Reply to ${name}`,
  loadingMore: "Load older comments…",
  sending: "Sending…",
  postFailed: "Couldn't post your comment. Try again.",
  retry: "Retry",
  loadFailed: "Couldn't load comments.",
  moreReplies: "View more replies",
  loadingReplies: "Loading replies…",
  loadRepliesFailed: "Couldn't load replies.",
  tombstone: (state) =>
    state === "deleted"
      ? "This comment was deleted"
      : state === "hidden"
        ? "This comment was hidden"
        : "This comment was removed",
  pinned: "Pinned",
  edit: "Edit",
  save: "Save",
  editFailed: "Couldn't save your edit.",
  showMore: "Show more",
  showLess: "Show less",
  closed: "Comments are turned off.",
};

/** @deprecated Use {@link defaultCommentThreadLabels}. */
export const DEFAULT_COMMENT_THREAD_LABELS = defaultCommentThreadLabels;

export type CommentLocalAction =
  | { kind: "add"; comment: Comment; parentId?: string }
  /**
   * Replace a pending comment with the server's. Keeps the pending comment's replies; when the
   * real id is already in the tree (an echo won the race), the pending comment is removed instead.
   */
  | { kind: "swap-temp"; tempId: string; real: Comment }
  | { kind: "remove"; commentId: string }
  | { kind: "like-toggle"; commentId: string; nextLiked: boolean }
  /** Set `isLiked` and `likes` exactly (a rollback). */
  | { kind: "like-set"; commentId: string; liked: boolean; likes: number | null }
  /** Replace the content. Does not set `edited` (an edit you apply yourself decides that). */
  | { kind: "patch-content"; commentId: string; content: string }
  /** Patch any fields of one comment (an edit, a rollback). `id` and `replies` are kept. */
  | { kind: "patch"; commentId: string; patch: Partial<Omit<Comment, "id" | "replies">> }
  /** Re-insert a removed subtree at its old position (a delete rollback). */
  | { kind: "restore"; comment: Comment; parentId?: string; index: number }
  /** Append a page of replies under a comment; ids already in the tree are skipped. */
  | { kind: "append-replies"; parentId: string; comments: Comment[] }
  | { kind: "subscribe-delta"; delta: CommentDelta }
  /** Append a page of top-level comments; ids already in the tree are skipped. */
  | { kind: "append-page"; comments: Comment[] }
  | { kind: "reset"; next: Comment[] };

/**
 * What changed, reported with the next tree to `onCommentsChange` (controlled mode). Reported
 * once a change is accepted: after the handler's promise resolves, at once for a handler that
 * returns nothing, and at once for deltas, loaded pages and handle calls.
 */
export type CommentsChange =
  | { kind: "added"; comment: Comment; parentId?: string }
  | { kind: "liked"; commentId: string; liked: boolean }
  | { kind: "reacted"; commentId: string; reaction: string | null }
  | { kind: "deleted"; commentId: string }
  | { kind: "edited"; commentId: string; content: string }
  | { kind: "page"; comments: Comment[] }
  | { kind: "replies"; parentId: string; comments: Comment[] }
  | { kind: "delta"; delta: CommentDelta }
  | { kind: "dispatch"; action: CommentLocalAction };

/** Which operation failed, passed to `onError`. */
export interface CommentErrorContext {
  kind: "add" | "like" | "react" | "delete" | "edit" | "load-more" | "load-replies";
  /** The comment acted on (for `add`: the pending comment's temporary id). */
  commentId?: string;
  /** For `add` and `load-replies`: the parent comment. */
  parentId?: string;
}

/** One page from a cursor loader (`onLoadMoreCursor` / `onLoadReplies`). */
export interface CommentPage {
  items: Comment[];
  /** Cursor for the next page; `null` (or omitted with `hasMore` false) = no more. */
  nextCursor?: string | null;
  /** Explicit "more exist". Default: `nextCursor != null`. */
  hasMore?: boolean;
}

/** Extra arguments `onAddComment` receives. */
export interface CommentAddOptions {
  /** Client id of the pending comment — send it to your server and echo it in the `added` broadcast. */
  clientId: string;
}

/**
 * Moderation add-on. Pass `commentModeration` (registry item `@ilinxa/comment-thread-moderation`, imported from
 * `@/components/comment-thread/features/moderation`) — or your
 * own implementation of this shape) as the `moderation` prop. The base never imports the add-on;
 * its components travel inside this value.
 */
export interface CommentModerationExtension {
  /** Renders in place of a comment's body while it is being edited. */
  EditComposer: ComponentType<CommentEditComposerProps>;
  /** Renders in place of a non-visible comment's row; its replies render below as usual. */
  Tombstone: ComponentType<CommentTombstoneProps>;
  /** Renders beside the author's name of a pinned comment. */
  PinnedMarker: ComponentType<CommentPinnedMarkerProps>;
}

export interface CommentEditComposerProps {
  comment: Comment;
  labels: ResolvedCommentThreadLabels;
  /** Resolves on success; rejects after rolling back (the composer then shows `labels.editFailed`). */
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
  submitOnEnter: boolean;
  minRows: number;
  maxRows: number;
  className?: string;
}

export interface CommentTombstoneProps {
  comment: Comment;
  state: CommentTombstoneState;
  labels: ResolvedCommentThreadLabels;
  depth: number;
  className?: string;
}

export interface CommentPinnedMarkerProps {
  comment: Comment;
  labels: ResolvedCommentThreadLabels;
  className?: string;
}

export interface CommentThreadProps {
  /**
   * The comments tree. Without `onCommentsChange` it is read once, at mount (use the handle's
   * `reset(next)` to push updates). With `onCommentsChange` it is controlled: it wins on every
   * render, pending operations show over it, and accepted changes are reported, not applied.
   */
  comments: Comment[];
  /**
   * Makes `comments` controlled. Called with the next tree and what changed, once a change is
   * accepted (see {@link CommentsChange}).
   */
  onCommentsChange?: (next: Comment[], change: CommentsChange) => void;

  /** Visual variant. Default "default". */
  variant?: CommentThreadVariant;

  /** Viewer identity. Drives composer avatar + isOwn check on default kebab. Absent → composer hidden, composerEmptyState rendered. */
  currentUser?: CommentThreadCurrentUser;

  /** Initial render depth cap. Past this, "view N replies" inline-expands. Default 2. */
  maxDepth?: number;

  /** Pixels of indent per depth level (inline-start, so it mirrors in RTL). Default 24. */
  indentPx?: number;

  /** Body line clamp via expandable-text. Default 4 (default variant) / 2 (compact). */
  bodyMaxLines?: number;

  /** Composer autosize bounds. Defaults: 1 / 6. */
  composerMinRows?: number;
  composerMaxRows?: number;

  /** Default true — Enter submits, Shift+Enter newline. */
  submitOnEnter?: boolean;

  /**
   * Page size for the legacy `onLoadMore(page)` heuristic: "Load more" shows while the thread
   * holds at least `pageSize` top-level comments and the last page was full. Default 10.
   */
  pageSize?: number;
  /** Explicit "more top-level comments exist". Wins over every heuristic, on every render (the button still needs a loader). */
  hasMore?: boolean;
  /** Cursor for the next top-level page. Used with `onLoadMoreCursor` (ignored by `onLoadMore(page)`); wins on every render when defined. */
  nextCursor?: string | null;

  /** Realtime delta stream. Identity-stable required. */
  subscribe?: Subscribe<CommentDelta>;
  /** Fires for every delta the subscription emits. */
  onSubscribeDelta?: (delta: CommentDelta) => void;

  /**
   * Post a comment. A pending comment shows at once (`optimistic`). Return the created Comment to
   * swap it in; return a promise that rejects to remove it (the composer keeps the text and shows
   * `labels.postFailed`). Returning nothing keeps the pending comment until a delta or the
   * `comments` prop brings the real one (controlled mode: it is removed when the call returns).
   */
  onAddComment?: (
    content: string,
    parentId?: string,
    options?: CommentAddOptions,
  ) => Promise<Comment | void> | Comment | void;
  /** Like / unlike. Return a promise to roll the change back when it rejects. */
  onLikeComment?: (commentId: string, nextLiked: boolean) => void | Promise<unknown>;
  /** Delete. Return a promise to restore the comment (at its position) when it rejects. */
  onDeleteComment?: (commentId: string) => void | Promise<unknown>;
  /** Fired on Report kebab click. If omitted, Report item is hidden. */
  onReportComment?: (commentId: string) => void;
  /**
   * Edit a comment — **requires `comment-thread-moderation`** (`moderation` prop): without it this
   * logs one development warning and no Edit item appears. Return a promise to roll back on reject.
   */
  onEditComment?: (
    commentId: string,
    content: string,
  ) => Promise<Comment | void> | Comment | void;
  /** Fetch next page of older top-level comments by page number. Component appends results. */
  onLoadMore?: (page: number) => Promise<Comment[]>;
  /** Fetch the next top-level page by cursor. Wins over `onLoadMore` when both are passed. */
  onLoadMoreCursor?: (cursor: string | null) => Promise<CommentPage>;
  /** Fetch a page of a comment's replies (when `replyCount` is larger than what is loaded). */
  onLoadReplies?: (commentId: string, cursor: string | null) => Promise<CommentPage>;
  /** Called when an operation fails (the change is rolled back first). */
  onError?: (error: unknown, context: CommentErrorContext) => void;
  /**
   * Show changes at once while their promise is in flight (default `true`). `false`: a new
   * comment appears only once the server returns it, and likes / deletes wait for their promise.
   */
  optimistic?: boolean;

  /** Reaction catalog. With `onReactComment`, each row's default action becomes a reaction picker. */
  reactionKinds?: EngagementReactionKind[];
  /** Pick (or clear, `null`) the viewer's reaction on a comment. Return a promise to roll back on reject. */
  onReactComment?: (
    commentId: string,
    reaction: string | null,
  ) => void | Promise<unknown>;

  /** Override the default kebab items. Return [] to hide kebab entirely. */
  commentActions?: (
    comment: Comment,
    helpers: CommentActionHelpers,
  ) => CommentMenuItem[];
  /** Items appended after the default kebab items (ignored when `commentActions` takes over). */
  extraActions?: (
    comment: Comment,
    helpers: CommentActionHelpers,
  ) => CommentMenuItem[];
  /** Build each row's engagement-bar actions. Default: `helpers.defaultActions`. */
  engagementActions?: (
    comment: Comment,
    helpers: CommentEngagementHelpers,
  ) => EngagementAction[];

  /** Full-takeover for the per-row render. Composer below each row (reply mode) is still owned by the thread. */
  renderNode?: (
    comment: Comment,
    depth: number,
    helpers: CommentNodeHelpers,
  ) => ReactNode;

  /** Override the inline-expand "view N replies" link shown at `maxDepth` (the on-demand `onLoadReplies` link stays built in). */
  renderViewReplies?: (parentId: string, count: number) => ReactNode;

  /** Override the bottom composer entirely. Not called while `closed` (the `labels.closed` notice renders instead). */
  renderComposer?: (
    state: CommentComposerState,
    helpers: CommentComposerHelpers,
  ) => ReactNode;

  /** Rendered in place of the bottom composer when currentUser is absent. Pass null to suppress. */
  composerEmptyState?: ReactNode;

  /** Rendered when comments.length === 0 and no realtime is wired. */
  emptyState?: ReactNode;

  /** The `comment-thread-moderation` add-on (inline edit, tombstones, pin marker). */
  moderation?: CommentModerationExtension;
  /**
   * What a removal does. `"prune"` (default) drops the comment and its replies.
   * `"tombstone"` — **requires `comment-thread-moderation`** — keeps it: a `removed` delta sets
   * state `"removed"` and the viewer's own delete sets `"deleted"`, so replies stay. Without the
   * add-on it logs one development warning and prunes.
   */
  removedMode?: "prune" | "tombstone";

  // ─── 0.5.0 ───
  /**
   * Render a comment's body yourself (links, mentions, hashtags) while keeping the line clamp and
   * "Show more": the result is rendered inside the row's expandable-text, which re-measures when it
   * changes. Default: the plain `content` text. The moderation add-on's edit composer still edits
   * the raw `content`. Return safe markup — the thread renders it as given.
   */
  renderContent?: (comment: Comment, context: { depth: number }) => ReactNode;
  /**
   * Link for a row's author. Returns `undefined` for no link. The avatar and the name each become a
   * link (rendered with `linkComponent`); the avatar link is hidden from assistive technology and
   * the keyboard, so the name link is the one that is announced.
   */
  getAuthorHref?: (author: Comment["author"], comment: Comment) => string | undefined;
  /** Component for author links (a router `Link`, for example). Receives `href`. Default `"a"`. */
  linkComponent?: ElementType;
  /**
   * Closes the thread: no bottom composer (a notice, `labels.closed`, renders in its place), no
   * Reply for anyone, any open reply composer closes, and `handle.openReply` / `focusComposer` do
   * nothing (one development warning). Likes and menus are unchanged. Default `false`.
   */
  closed?: boolean;

  labels?: CommentThreadLabels;
  /** BCP 47 locale for times and counts. Default `"en"`. */
  locale?: string;
  /** Time zone for absolute dates. Default: the runtime's. */
  timeZone?: string;
  /**
   * "Now" for relative times. Without it the thread reads the clock after mount (no relative
   * text renders on the server or the first client render) and again every minute.
   */
  now?: Date;
  /**
   * Relative-time formatter. Default: English "5m" / "2h" for `"en"`, `Intl.RelativeTimeFormat`
   * otherwise. The thread never passes a future date (a timestamp ahead of `now` is passed as `now`).
   */
  formatRelativeTime?: (date: Date, now: Date) => string;
  /** Count formatter for like / reaction counts. Default `Intl.NumberFormat(locale, { notation: "compact" })`. */
  formatCount?: (n: number) => string;
  /** Text direction for the rows' reaction pickers and the portaled actions menus. Default: read after mount. */
  dir?: "ltr" | "rtl";

  className?: string;
  composerClassName?: string;
  nodeClassName?: string;
}

export interface CommentThreadHandle {
  /** Programmatically focus the bottom composer textarea. */
  focusComposer: () => void;
  /** Programmatically open the inline reply composer for a parent comment. */
  openReply: (parentId: string) => void;
  /** Read the current optimistic comments tree. */
  getCurrentComments: () => Comment[];
  /** Replace the entire tree (controlled mode: reported through `onCommentsChange`). */
  reset: (next: Comment[]) => void;
  /** Drive the reducer directly (controlled mode: reported through `onCommentsChange`). */
  dispatch: (action: CommentLocalAction) => void;
}
