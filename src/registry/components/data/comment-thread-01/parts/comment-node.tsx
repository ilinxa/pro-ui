"use client";

import {
  memo,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExpandableText01 } from "@/registry/components/data/expandable-text-01";
import { EngagementBar01 } from "@/registry/components/data/engagement-bar-01";
import { CommentKebab } from "./comment-kebab";
import { CommentComposer } from "./comment-composer";
import { ViewRepliesLink } from "./view-replies-link";
import { toDate } from "../lib/format-time";
import type {
  Comment,
  CommentMenuItem,
  CommentNodeHelpers,
  CommentThreadCurrentUser,
  CommentThreadLabels,
} from "../types";

export interface CommentNodeProps {
  comment: Comment;
  depth: number;
  maxDepth: number;
  indentPx: number;
  variant: "default" | "compact";
  bodyMaxLines: number;
  currentUser?: CommentThreadCurrentUser;
  labels: Required<Omit<CommentThreadLabels, "formatRelativeTime">>;
  format: (date: Date, now: Date) => string;
  isReplyOpen: boolean;
  onOpenReply: (parentId: string, triggerEl: HTMLElement | null) => void;
  onCancelReply: () => void;
  onSubmitReply: (content: string, parentId: string) => Promise<void>;
  onLike: (commentId: string, nextLiked: boolean) => void;
  onDelete: (commentId: string) => void;
  onReport: (commentId: string) => void;
  onReportPresent: boolean;
  commentActions?: (
    comment: Comment,
    helpers: {
      currentUser?: CommentThreadCurrentUser;
      isOwn: boolean;
      depth: number;
    },
  ) => CommentMenuItem[];
  renderNode?: (
    comment: Comment,
    depth: number,
    helpers: CommentNodeHelpers,
  ) => ReactNode;
  renderViewReplies?: (parentId: string, count: number) => ReactNode;
  composerMinRows: number;
  composerMaxRows: number;
  submitOnEnter: boolean;
  composerClassName?: string;
  nodeClassName?: string;
  /** Whether this branch's "view N replies" link should be hidden (because the parent already expanded it). */
  forceShowAllReplies?: boolean;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";
}

function CommentNodeInner(props: CommentNodeProps) {
  const {
    comment,
    depth,
    maxDepth,
    indentPx,
    bodyMaxLines,
    currentUser,
    labels,
    format,
    isReplyOpen,
    onOpenReply,
    onCancelReply,
    onSubmitReply,
    onLike,
    onDelete,
    onReport,
    onReportPresent,
    commentActions,
    renderNode,
    renderViewReplies,
    composerMinRows,
    composerMaxRows,
    submitOnEnter,
    composerClassName,
    nodeClassName,
    forceShowAllReplies = false,
  } = props;

  const baseId = useId();
  const authorId = `${baseId}-author`;
  const repliesId = `${baseId}-replies`;

  const [expandedToDepth, setExpandedToDepth] = useState(0);

  const isOwn = !!currentUser && currentUser.id === comment.author.id;

  // helpers passed to renderNode slot — onReply receives null trigger
  // (slot owners do their own focus-restoration if they care).
  const helpers: CommentNodeHelpers = useMemo(
    () => ({
      currentUser,
      isOwn,
      depth,
      onLike: (nextLiked: boolean) => onLike(comment.id, nextLiked),
      onReply: () => onOpenReply(comment.id, null),
      onDelete: () => onDelete(comment.id),
      onReport: () => onReport(comment.id),
    }),
    [
      currentUser,
      isOwn,
      depth,
      comment.id,
      onLike,
      onOpenReply,
      onDelete,
      onReport,
    ],
  );

  // ─── Render takeover ──────────────────────────────────────────────────────
  if (renderNode) {
    return (
      <>
        {renderNode(comment, depth, helpers)}
        {isReplyOpen && currentUser ? (
          <div className="ml-10 mt-2">
            <CommentComposer
              currentUser={currentUser}
              placeholder={labels.composerPlaceholder}
              onSubmit={(content) => onSubmitReply(content, comment.id)}
              onCancel={onCancelReply}
              submitOnEnter={submitOnEnter}
              minRows={composerMinRows}
              maxRows={composerMaxRows}
              className={composerClassName}
              labels={labels}
              ariaLabel={`Reply to ${comment.author.name}`}
              autoFocus
            />
          </div>
        ) : null}
      </>
    );
  }

  // ─── Reply visibility logic ───────────────────────────────────────────────
  const totalReplies = comment.replies?.length ?? 0;
  const renderableDepth = forceShowAllReplies
    ? Number.POSITIVE_INFINITY
    : maxDepth + expandedToDepth;
  const showReplies = totalReplies > 0 && depth + 1 <= renderableDepth;
  const hiddenAtBoundary = !showReplies && totalReplies > 0;
  const hiddenCountLabel = comment.replyCount ?? totalReplies;

  // ─── Default render ───────────────────────────────────────────────────────
  return (
    <article
      role="article"
      aria-labelledby={authorId}
      style={depth > 0 ? { paddingLeft: depth * indentPx } : undefined}
      className={cn("group flex items-start gap-2", nodeClassName)}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {comment.author.avatar ? (
          <AvatarImage src={comment.author.avatar} alt="" />
        ) : null}
        <AvatarFallback>{initials(comment.author.name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-1">
            <span id={authorId} className="text-sm font-semibold">
              {comment.author.name}
            </span>
            {comment.author.username ? (
              <span className="text-xs text-muted-foreground">
                @{comment.author.username}
              </span>
            ) : null}
          </div>
          <ExpandableText01
            content={comment.content}
            maxLines={bodyMaxLines}
            contentClassName="text-sm mt-0.5"
          />
        </div>

        <div className="mt-1 flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground">
            {format(toDate(comment.createdAt), new Date())}
            {comment.edited ? (
              <>
                {" "}
                <span className="text-muted-foreground/80">
                  {labels.editedSuffix}
                </span>
              </>
            ) : null}
          </span>
          <EngagementBar01
            variant="compact"
            actions={[
              {
                kind: "like",
                count: comment.likes,
                liked: comment.isLiked ?? false,
                onToggle: helpers.onLike,
              },
            ]}
          />
          {currentUser ? (
            <button
              type="button"
              onClick={(e) => onOpenReply(comment.id, e.currentTarget)}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {labels.reply}
            </button>
          ) : null}
        </div>

        {/* Recursive replies */}
        {showReplies && comment.replies ? (
          <ul id={repliesId} className="mt-2 flex flex-col gap-3">
            {comment.replies.map((reply) => (
              <li key={reply.id}>
                <CommentNode
                  {...props}
                  comment={reply}
                  depth={depth + 1}
                  forceShowAllReplies={forceShowAllReplies}
                />
              </li>
            ))}
          </ul>
        ) : null}

        {/* Past maxDepth — view-N-replies link (default inline-expand) */}
        {hiddenAtBoundary
          ? renderViewReplies
            ? renderViewReplies(comment.id, hiddenCountLabel)
            : (
                <ViewRepliesLink
                  count={hiddenCountLabel}
                  label={labels.viewReplies(hiddenCountLabel)}
                  controlsId={repliesId}
                  onExpand={() => setExpandedToDepth((d) => d + 1)}
                />
              )
          : null}

        {/* Inline reply composer */}
        {isReplyOpen && currentUser ? (
          <div className="mt-2">
            <CommentComposer
              currentUser={currentUser}
              placeholder={labels.composerPlaceholder}
              onSubmit={(content) => onSubmitReply(content, comment.id)}
              onCancel={onCancelReply}
              submitOnEnter={submitOnEnter}
              minRows={composerMinRows}
              maxRows={composerMaxRows}
              className={composerClassName}
              labels={labels}
              ariaLabel={`Reply to ${comment.author.name}`}
              autoFocus
            />
          </div>
        ) : null}
      </div>

      <CommentKebab
        comment={comment}
        currentUser={currentUser}
        isOwn={isOwn}
        depth={depth}
        labels={labels}
        onDelete={helpers.onDelete}
        onReport={helpers.onReport}
        onReportPresent={onReportPresent}
        commentActions={commentActions}
      />
    </article>
  );
}

export const CommentNode = memo(CommentNodeInner);
CommentNode.displayName = "CommentNode";
