"use client";

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// F-S1 lock: same-category cross-procomp via relative + specific-file paths.
import { ExpandableText } from "../../expandable-text/expandable-text";
import { EngagementBar } from "../../engagement-bar/engagement-bar";
import type {
  EngagementAction,
  EngagementBarLabels,
} from "../../engagement-bar/types";
import { CommentKebab } from "./comment-kebab";
import { CommentComposer } from "./comment-composer";
import { ViewRepliesLink } from "./view-replies-link";
import { useThreadContext } from "./thread-context";
import { toDate } from "../lib/format-time";
import { buildMenuItems } from "../lib/menu-items";
import { resolvePermissions } from "../lib/permissions";
import { isVisibleState } from "../lib/tree";
import type {
  Comment,
  CommentActionHelpers,
  CommentNodeHelpers,
  CommentTombstoneState,
} from "../types";

export interface CommentNodeProps {
  comment: Comment;
  depth: number;
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

function CommentNodeInner({
  comment,
  depth,
  forceShowAllReplies = false,
}: CommentNodeProps) {
  const ctx = useThreadContext();
  const {
    currentUser,
    labels,
    maxDepth,
    indentPx,
    bodyMaxLines,
    moderation,
    renderNode,
    renderViewReplies,
  } = ctx;

  const baseId = useId();
  const authorId = `${baseId}-author`;
  const repliesId = `${baseId}-replies`;

  const [expandedToDepth, setExpandedToDepth] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const kebabRef = useRef<HTMLButtonElement | null>(null);
  const setKebab = useCallback((el: HTMLButtonElement | null) => {
    kebabRef.current = el;
  }, []);
  const repliesListRef = useRef<HTMLUListElement>(null);
  const focusNewFrom = useRef<number | null>(null);

  // Replies: what is loaded, and whether a "view / more replies" link is still on offer.
  const loadedReplies = comment.replies ?? [];
  const loadedCount = loadedReplies.length;
  const storedLoad = ctx.replyLoads[comment.id];
  // A different `repliesCursor` than the one the load started from makes it stale.
  const replyLoad =
    storedLoad && storedLoad.seed === (comment.repliesCursor ?? null) ? storedLoad : undefined;
  const moreToLoad =
    ctx.hasLoadReplies &&
    (replyLoad
      ? replyLoad.hasMore
      : (comment.replyCount ?? 0) > loadedCount ||
        (comment.repliesCursor !== undefined && comment.repliesCursor !== null));

  // The link that started a load unmounts when the last page lands; focus would fall to <body>.
  const replyLoading = replyLoad?.loading;
  useEffect(() => {
    const from = focusNewFrom.current;
    if (from === null || replyLoading) return;
    focusNewFrom.current = null;
    if (!moreToLoad && loadedCount > from) {
      repliesListRef.current?.children[from]?.querySelector<HTMLElement>("article")?.focus();
    }
  }, [replyLoading, moreToLoad, loadedCount]);

  // Closing the editor unmounts the focused Save / Cancel: send focus to the row's actions menu.
  const closeEditor = () => {
    setIsEditing(false);
    requestAnimationFrame(() => kebabRef.current?.focus());
  };

  const pendingKind = ctx.pendingMap.get(comment.id);
  const isPending = pendingKind !== undefined;
  const isOwn = !!currentUser && currentUser.id === comment.author.id;
  const permissions = useMemo(
    () => resolvePermissions(comment, currentUser),
    [comment, currentUser],
  );
  const isReplyOpen = ctx.replyParentId === comment.id;

  const actionHelpers = useMemo<CommentActionHelpers>(
    () => ({ currentUser, isOwn, depth, permissions, isPending }),
    [currentUser, isOwn, depth, permissions, isPending],
  );

  const { like, remove, report, openReply } = ctx;
  const commentId = comment.id;
  // Handlers handed to the `renderNode` slot — `onReply` receives a null trigger
  // (slot owners do their own focus-restoration if they care).
  const helpers = useMemo<CommentNodeHelpers>(
    () => ({
      ...actionHelpers,
      onLike: (nextLiked: boolean) => like(commentId, nextLiked),
      onReply: () => openReply(commentId, null),
      onDelete: () => remove(commentId),
      onReport: () => report(commentId),
    }),
    [actionHelpers, like, openReply, remove, report, commentId],
  );

  const barLabels = useMemo<EngagementBarLabels>(
    () => ({ like: labels.like, unlike: labels.unlike }),
    [labels.like, labels.unlike],
  );

  const replyComposer =
    isReplyOpen && currentUser ? (
      <CommentComposer
        currentUser={currentUser}
        placeholder={labels.composerPlaceholder}
        onSubmit={(content) => ctx.submitReply(content, comment.id)}
        onCancel={ctx.cancelReply}
        submitOnEnter={ctx.submitOnEnter}
        minRows={ctx.composerMinRows}
        maxRows={ctx.composerMaxRows}
        className={ctx.composerClassName}
        labels={labels}
        ariaLabel={labels.replyTo(comment.author.name)}
        autoFocus
      />
    ) : null;

  // ─── Reply visibility logic ───────────────────────────────────────────────
  // Without the add-on a non-visible reply is left out (with its own replies).
  const replies = moderation ? loadedReplies : loadedReplies.filter(isVisibleState);
  const totalReplies = replies.length;
  const renderableDepth = forceShowAllReplies
    ? Number.POSITIVE_INFINITY
    : maxDepth + expandedToDepth;
  const showReplies = totalReplies > 0 && depth + 1 <= renderableDepth;
  const hiddenAtBoundary = !showReplies && totalReplies > 0;
  const hiddenCountLabel = comment.replyCount ?? totalReplies;

  let repliesLink: ReactNode = null;
  if (hiddenAtBoundary) {
    // Past maxDepth — view-N-replies link (default inline-expand).
    repliesLink = renderViewReplies ? (
      renderViewReplies(comment.id, hiddenCountLabel)
    ) : (
      <ViewRepliesLink
        count={hiddenCountLabel}
        label={labels.viewReplies(hiddenCountLabel)}
        controlsId={repliesId}
        onExpand={() => setExpandedToDepth((d) => d + 1)}
      />
    );
  } else if (moreToLoad) {
    const first = loadedReplies.length === 0;
    const count = first ? Math.max(1, comment.replyCount ?? 1) : 1;
    const label = replyLoad?.failed
      ? labels.retry
      : first
        ? labels.viewReplies(count)
        : labels.moreReplies;
    repliesLink = (
      <div className="flex flex-wrap items-center gap-x-2">
        {replyLoad?.failed ? (
          <span role="alert" className="mt-2 text-xs text-destructive">
            {labels.loadRepliesFailed}
          </span>
        ) : null}
        <ViewRepliesLink
          count={count}
          label={label}
          controlsId={repliesId}
          loading={replyLoad?.loading}
          loadingLabel={labels.loadingReplies}
          onExpand={() => {
            // Replies that would land past maxDepth open with the load.
            if (depth + 1 > renderableDepth) setExpandedToDepth((d) => d + 1);
            focusNewFrom.current = loadedCount;
            ctx.loadReplies(comment.id);
          }}
        />
      </div>
    );
  }

  const repliesBlock = (
    <>
      {showReplies ? (
        <ul ref={repliesListRef} id={repliesId} className="mt-2 flex flex-col gap-3">
          {replies.map((reply) => (
            <li key={reply.id}>
              <CommentNode
                comment={reply}
                depth={depth + 1}
                forceShowAllReplies={forceShowAllReplies}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {repliesLink}
    </>
  );

  // ─── Render takeover ──────────────────────────────────────────────────────
  // `renderNode` replaces the row (its menu included — build one from `helpers`); the thread keeps
  // the tree below it: the reply composer, the replies (each rendered through `renderNode` too) and
  // the "view / more replies" links. (Before 0.4.0 the replies under a `renderNode` row were lost.)
  if (renderNode) {
    return (
      <>
        {renderNode(comment, depth, helpers)}
        {replyComposer ? <div className="ms-10 mt-2">{replyComposer}</div> : null}
        {repliesBlock}
      </>
    );
  }

  const indentStyle = depth > 0 ? { paddingInlineStart: depth * indentPx } : undefined;

  // ─── Tombstone (moderation add-on): the row is replaced, replies stay ─────
  if (!isVisibleState(comment) && moderation) {
    const Tombstone = moderation.Tombstone;
    return (
      <div
        style={indentStyle}
        data-comment-id={comment.id}
        tabIndex={-1}
        className={cn("flex flex-col outline-none", ctx.nodeClassName)}
      >
        <Tombstone
          comment={comment}
          state={comment.state as CommentTombstoneState}
          labels={labels}
          depth={depth}
        />
        {repliesBlock}
      </div>
    );
  }

  // ─── Default render ───────────────────────────────────────────────────────
  const canEditNow = ctx.canEditAtAll && permissions.canEdit && !isPending;
  const EditComposer = moderation?.EditComposer;
  const PinnedMarker = moderation?.PinnedMarker;
  const showEditor = isEditing && canEditNow && !!EditComposer;

  const createdAt = toDate(comment.createdAt);
  const validDate = !Number.isNaN(createdAt.getTime());
  const timeText =
    pendingKind === "sending"
      ? labels.sending
      : validDate
        ? ctx.formatTime(createdAt)
        : null;

  const menuItems = buildMenuItems({
    comment,
    helpers: actionHelpers,
    labels,
    hasReport: ctx.hasReport,
    canEditAtAll: ctx.canEditAtAll,
    onEdit: () => setIsEditing(true),
    onDelete: () => remove(comment.id),
    onReport: () => report(comment.id),
    commentActions: ctx.commentActions,
    extraActions: ctx.extraActions,
  });

  const blocked = isPending || !permissions.canReact;
  let defaultActions: EngagementAction[];
  if (ctx.reactionKinds && ctx.reactionKinds.length > 0 && ctx.hasReact) {
    const counts = comment.reactions?.counts;
    defaultActions = [
      {
        kind: "reaction",
        kinds: ctx.reactionKinds.map((kind) => ({
          ...kind,
          // The catalog's own `count` is not this row's tally: a missing one stays withheld.
          count: counts && kind.key in counts ? counts[kind.key] : null,
        })),
        totalCount: comment.reactions?.totalCount ?? null,
        viewerReaction: comment.reactions?.viewerReaction ?? null,
        onSelect: (next) => {
          ctx.react(comment.id, next);
        },
        disabled: blocked,
      },
    ];
  } else {
    defaultActions = [
      {
        kind: "like",
        count: comment.likes,
        liked: comment.isLiked ?? false,
        onToggle: helpers.onLike,
        disabled: blocked,
      },
    ];
  }
  const actions = ctx.engagementActions
    ? ctx.engagementActions(comment, { ...actionHelpers, defaultActions })
    : defaultActions;

  return (
    <article
      role="article"
      aria-labelledby={authorId}
      data-comment-id={comment.id}
      aria-busy={pendingKind === "sending" || undefined}
      style={indentStyle}
      // Programmatic focus target only (tabIndex -1), so a removed control can hand focus here.
      tabIndex={-1}
      className={cn("group flex items-start gap-2 outline-none", ctx.nodeClassName)}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {comment.author.avatar ? (
          <AvatarImage src={comment.author.avatar} alt="" />
        ) : null}
        <AvatarFallback>{initials(comment.author.name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-muted/50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-1">
            <span id={authorId} className="text-sm font-semibold">
              {comment.author.name}
            </span>
            {comment.author.username ? (
              <span className="text-xs text-muted-foreground">
                @{comment.author.username}
              </span>
            ) : null}
            {comment.isPinned && PinnedMarker ? (
              <PinnedMarker comment={comment} labels={labels} className="ms-1" />
            ) : null}
          </div>
          {showEditor ? (
            <EditComposer
              comment={comment}
              labels={labels}
              onSave={async (content) => {
                if (content.trim() === comment.content.trim()) {
                  closeEditor();
                  return;
                }
                await ctx.edit(comment.id, content);
                closeEditor();
              }}
              onCancel={closeEditor}
              submitOnEnter={ctx.submitOnEnter}
              minRows={ctx.composerMinRows}
              maxRows={ctx.composerMaxRows}
              className="mt-1"
            />
          ) : (
            <ExpandableText
              content={comment.content}
              maxLines={bodyMaxLines}
              contentClassName="text-sm mt-0.5"
            />
          )}
        </div>

        <div className="mt-1 flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground">
            <time dateTime={validDate ? createdAt.toISOString() : undefined}>
              {timeText}
            </time>
            {comment.edited ? (
              <>
                {" "}
                <span className="text-muted-foreground/80">
                  {labels.editedSuffix}
                </span>
              </>
            ) : null}
          </span>
          <EngagementBar
            variant="compact"
            actions={actions}
            labels={barLabels}
            locale={ctx.locale}
            formatCount={ctx.formatCount}
            dir={ctx.dir}
          />
          {currentUser && permissions.canReply ? (
            <button
              type="button"
              onClick={(e) => openReply(comment.id, e.currentTarget)}
              disabled={isPending}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              {labels.reply}
            </button>
          ) : null}
        </div>

        {repliesBlock}

        {/* Inline reply composer */}
        {replyComposer ? <div className="mt-2">{replyComposer}</div> : null}
      </div>

      <CommentKebab
        items={menuItems}
        ariaLabel={labels.kebabAriaLabel(comment.author.name)}
        triggerRef={setKebab}
        dir={ctx.dir}
      />
    </article>
  );
}

export const CommentNode = memo(CommentNodeInner);
CommentNode.displayName = "CommentNode";
