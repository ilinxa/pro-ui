"use client";

import { createContext, useContext, type ElementType, type ReactNode } from "react";
import type { EngagementReactionKind } from "../../engagement-bar/types";
import type {
  Comment,
  CommentActionHelpers,
  CommentEngagementHelpers,
  CommentMenuItem,
  CommentModerationExtension,
  CommentNodeHelpers,
  CommentThreadCurrentUser,
  CommentThreadVariant,
  ResolvedCommentThreadLabels,
} from "../types";
import type { EngagementAction } from "../../engagement-bar/types";
import type { PendingKind } from "../hooks/use-comment-tree";
import type { ReplyLoad } from "../hooks/use-paging";

/** What every row reads from its thread (kept out of props so the recursion stays light). */
export interface CommentThreadContextValue {
  currentUser?: CommentThreadCurrentUser;
  labels: ResolvedCommentThreadLabels;
  variant: CommentThreadVariant;
  maxDepth: number;
  indentPx: number;
  bodyMaxLines: number;
  composerMinRows: number;
  composerMaxRows: number;
  submitOnEnter: boolean;
  composerClassName?: string;
  nodeClassName?: string;

  /** 0.5.0 */
  closed: boolean;
  renderContent?: (comment: Comment, context: { depth: number }) => ReactNode;
  getAuthorHref?: (author: Comment["author"], comment: Comment) => string | undefined;
  linkComponent: ElementType;

  locale: string;
  dir?: "ltr" | "rtl";
  formatCount?: (n: number) => string;
  /** Relative time of a date, or `null` while "now" is unknown (server, first client render). */
  formatTime: (date: Date) => string | null;

  pendingMap: ReadonlyMap<string, PendingKind>;

  replyParentId: string | null;
  openReply: (parentId: string, triggerEl: HTMLElement | null) => void;
  cancelReply: () => void;
  submitReply: (content: string, parentId: string) => Promise<void>;

  like: (commentId: string, nextLiked: boolean) => void;
  react: (commentId: string, reaction: string | null) => void;
  remove: (commentId: string) => void;
  edit: (commentId: string, content: string) => Promise<void>;
  report: (commentId: string) => void;
  hasReport: boolean;
  /** `onEditComment` is wired AND the moderation add-on is installed. */
  canEditAtAll: boolean;

  reactionKinds?: EngagementReactionKind[];
  hasReact: boolean;

  commentActions?: (comment: Comment, helpers: CommentActionHelpers) => CommentMenuItem[];
  extraActions?: (comment: Comment, helpers: CommentActionHelpers) => CommentMenuItem[];
  engagementActions?: (comment: Comment, helpers: CommentEngagementHelpers) => EngagementAction[];
  renderNode?: (comment: Comment, depth: number, helpers: CommentNodeHelpers) => ReactNode;
  renderViewReplies?: (parentId: string, count: number) => ReactNode;

  moderation: CommentModerationExtension | null;

  hasLoadReplies: boolean;
  replyLoads: Readonly<Record<string, ReplyLoad>>;
  loadReplies: (commentId: string) => void;
}

export const CommentThreadContext = createContext<CommentThreadContextValue | null>(null);

export function useThreadContext(): CommentThreadContextValue {
  const value = useContext(CommentThreadContext);
  if (!value) throw new Error("CommentNode must render inside a CommentThread");
  return value;
}
