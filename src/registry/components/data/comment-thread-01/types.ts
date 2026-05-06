import type { ReactNode } from "react";

export type CommentThread01Variant = "default" | "compact";

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
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
  /** Server-known total. Used as label hint when `replies.length` undercounts. */
  replyCount?: number;
}

export type CommentDelta =
  | { kind: "added"; comment: Comment; parentId?: string }
  | { kind: "edited"; commentId: string; content: string }
  | { kind: "removed"; commentId: string }
  | { kind: "liked"; commentId: string; liked: boolean; count: number };

export type Unsubscribe = () => void;
export type Subscribe<T> = (handler: (delta: T) => void) => Unsubscribe;

export interface CommentMenuItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

export interface CommentThreadCurrentUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface CommentNodeHelpers {
  currentUser?: CommentThreadCurrentUser;
  isOwn: boolean;
  depth: number;
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
}

export interface CommentComposerHelpers {
  setValue: (next: string) => void;
  submit: () => Promise<void>;
  cancel: () => void;
}

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
  loadMore?: string;
  emptyState?: string;
  signInPrompt?: string;
  /** Override the default English relative-time formatter. */
  formatRelativeTime?: (date: Date, now: Date) => string;
}

export const DEFAULT_COMMENT_THREAD_LABELS: Required<
  Omit<CommentThreadLabels, "formatRelativeTime">
> = {
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
};

export type CommentLocalAction =
  | { kind: "add"; comment: Comment; parentId?: string }
  | { kind: "swap-temp"; tempId: string; real: Comment }
  | { kind: "remove"; commentId: string }
  | { kind: "like-toggle"; commentId: string; nextLiked: boolean }
  | { kind: "patch-content"; commentId: string; content: string }
  | { kind: "subscribe-delta"; delta: CommentDelta }
  | { kind: "append-page"; comments: Comment[] }
  | { kind: "reset"; next: Comment[] };

export interface CommentThread01Props {
  /** Initial comments tree. Component owns it from mount; subsequent prop reference changes are IGNORED. Use the imperative handle's reset() to push updates. */
  comments: Comment[];

  /** Visual variant. Default "default". */
  variant?: CommentThread01Variant;

  /** Viewer identity. Drives composer avatar + isOwn check on default kebab. Absent → composer hidden, composerEmptyState rendered. */
  currentUser?: CommentThreadCurrentUser;

  /** Initial render depth cap. Past this, "view N replies" inline-expands. Default 2. */
  maxDepth?: number;

  /** Pixels of indent per depth level. Default 24. */
  indentPx?: number;

  /** Body line clamp via expandable-text-01. Default 4 (default variant) / 2 (compact). */
  bodyMaxLines?: number;

  /** Composer autosize bounds. Defaults: 1 / 6. */
  composerMinRows?: number;
  composerMaxRows?: number;

  /** Default true — Enter submits, Shift+Enter newline. */
  submitOnEnter?: boolean;

  /** First page size (controls when "Load older comments" button appears). Default 10. */
  pageSize?: number;

  /** Realtime delta stream. Identity-stable required. */
  subscribe?: Subscribe<CommentDelta>;
  /** Fires for every delta the subscription emits. */
  onSubscribeDelta?: (delta: CommentDelta) => void;

  /** Fired after optimistic add. If returned a Comment, the temp comment is swapped for the real one. */
  onAddComment?: (
    content: string,
    parentId?: string,
  ) => Promise<Comment | void> | Comment | void;
  /** Fired after optimistic like flip. */
  onLikeComment?: (commentId: string, nextLiked: boolean) => void;
  /** Fired after optimistic delete. */
  onDeleteComment?: (commentId: string) => void;
  /** Fired on Report kebab click. If omitted, Report item is hidden. */
  onReportComment?: (commentId: string) => void;
  /** Fetch next page of older top-level comments. Component appends results. */
  onLoadMore?: (page: number) => Promise<Comment[]>;

  /** Override the default kebab items. Return [] to hide kebab entirely. */
  commentActions?: (
    comment: Comment,
    helpers: {
      currentUser?: CommentThreadCurrentUser;
      isOwn: boolean;
      depth: number;
    },
  ) => CommentMenuItem[];

  /** Full-takeover for the per-row render. Composer below each row (reply mode) is still owned by the thread. */
  renderNode?: (
    comment: Comment,
    depth: number,
    helpers: CommentNodeHelpers,
  ) => ReactNode;

  /** Override the inline-expand "view N replies" link. */
  renderViewReplies?: (parentId: string, count: number) => ReactNode;

  /** Override the bottom composer entirely. */
  renderComposer?: (
    state: CommentComposerState,
    helpers: CommentComposerHelpers,
  ) => ReactNode;

  /** Rendered in place of the bottom composer when currentUser is absent. Pass null to suppress. */
  composerEmptyState?: ReactNode;

  /** Rendered when comments.length === 0 and no realtime is wired. */
  emptyState?: ReactNode;

  labels?: CommentThreadLabels;

  className?: string;
  composerClassName?: string;
  nodeClassName?: string;
}

export interface CommentThread01Handle {
  /** Programmatically focus the bottom composer textarea. */
  focusComposer: () => void;
  /** Programmatically open the inline reply composer for a parent comment. */
  openReply: (parentId: string) => void;
  /** Read the current optimistic comments tree. */
  getCurrentComments: () => Comment[];
  /** Replace the entire tree (controlled-mode escape hatch). */
  reset: (next: Comment[]) => void;
  /** Drive the reducer directly (advanced controlled-mode escape hatch). */
  dispatch: (action: CommentLocalAction) => void;
}
