"use client";

import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_COMMENT_THREAD_LABELS,
  type Comment,
  type CommentThread01Handle,
  type CommentThread01Props,
  type CommentThreadLabels,
} from "./types";
import { useCommentState } from "./hooks/use-comment-state";
import { CommentNode } from "./parts/comment-node";
import {
  CommentComposer,
  type CommentComposerHandle,
} from "./parts/comment-composer";
import { CommentEmptyState } from "./parts/comment-empty-state";
import { defaultRelativeTime } from "./lib/format-time";

interface CommentThread01InnerProps extends CommentThread01Props {
  ref?: React.Ref<CommentThread01Handle>;
}

function genTempId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `temp-${crypto.randomUUID()}`;
  }
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function CommentThread01Inner(props: CommentThread01InnerProps) {
  const {
    comments: initialComments,
    variant = "default",
    currentUser,
    maxDepth = 2,
    indentPx = 24,
    bodyMaxLines: bodyMaxLinesProp,
    composerMinRows = 1,
    composerMaxRows = 6,
    submitOnEnter = true,
    pageSize = 10,
    subscribe,
    onSubscribeDelta,
    onAddComment,
    onLikeComment,
    onDeleteComment,
    onReportComment,
    onLoadMore,
    commentActions,
    renderNode,
    renderViewReplies,
    renderComposer,
    composerEmptyState,
    emptyState,
    labels: labelsProp,
    className,
    composerClassName,
    nodeClassName,
    ref,
  } = props;

  const bodyMaxLines = bodyMaxLinesProp ?? (variant === "compact" ? 2 : 4);

  const labels = useMemo<
    Required<Omit<CommentThreadLabels, "formatRelativeTime">>
  >(
    () => ({ ...DEFAULT_COMMENT_THREAD_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const format = useMemo(
    () => labelsProp?.formatRelativeTime ?? defaultRelativeTime,
    [labelsProp?.formatRelativeTime],
  );

  const { comments, dispatch } = useCommentState({
    initialComments,
    subscribe,
    onSubscribeDelta,
  });

  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const replyTriggerRef = useRef<HTMLElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialComments.length === pageSize);
  const composerRef = useRef<CommentComposerHandle | null>(null);

  // Stable refs for the imperative handle.
  const commentsRef = useRef<Comment[]>(comments);
  useEffect(() => {
    commentsRef.current = comments;
  });

  useImperativeHandle(
    ref,
    () => ({
      focusComposer: () => composerRef.current?.focus(),
      openReply: (parentId: string) => setReplyParentId(parentId),
      getCurrentComments: () => commentsRef.current,
      reset: (next: Comment[]) => dispatch({ kind: "reset", next }),
      dispatch,
    }),
    // dispatch is stable; setReplyParentId is stable; refs handle the rest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleLike = useCallback(
    (commentId: string, nextLiked: boolean) => {
      dispatch({ kind: "like-toggle", commentId, nextLiked });
      onLikeComment?.(commentId, nextLiked);
    },
    [dispatch, onLikeComment],
  );

  const handleDelete = useCallback(
    (commentId: string) => {
      dispatch({ kind: "remove", commentId });
      onDeleteComment?.(commentId);
    },
    [dispatch, onDeleteComment],
  );

  const handleReport = useCallback(
    (commentId: string) => {
      onReportComment?.(commentId);
    },
    [onReportComment],
  );

  const submitTopLevel = useCallback(
    async (content: string) => {
      if (!currentUser) return;
      const tempId = genTempId();
      const tempComment: Comment = {
        id: tempId,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
        content,
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
        replies: [],
      };
      dispatch({ kind: "add", comment: tempComment });
      const result = await onAddComment?.(content);
      if (result && typeof result === "object") {
        dispatch({ kind: "swap-temp", tempId, real: result });
      }
    },
    [currentUser, dispatch, onAddComment],
  );

  const submitReply = useCallback(
    async (content: string, parentId: string) => {
      if (!currentUser) return;
      const tempId = genTempId();
      const tempComment: Comment = {
        id: tempId,
        author: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
        content,
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
        replies: [],
      };
      dispatch({ kind: "add", comment: tempComment, parentId });
      const result = await onAddComment?.(content, parentId);
      if (result && typeof result === "object") {
        dispatch({ kind: "swap-temp", tempId, real: result });
      }
      // Close inline composer + restore focus to the trigger (a11y).
      setReplyParentId(null);
      const trigger = replyTriggerRef.current;
      if (trigger) {
        requestAnimationFrame(() => trigger.focus());
      }
    },
    [currentUser, dispatch, onAddComment],
  );

  const cancelReply = useCallback(() => {
    setReplyParentId(null);
    const trigger = replyTriggerRef.current;
    if (trigger) {
      requestAnimationFrame(() => trigger.focus());
    }
  }, []);

  const openReply = useCallback(
    (parentId: string, triggerEl: HTMLElement | null) => {
      replyTriggerRef.current = triggerEl;
      setReplyParentId(parentId);
    },
    [],
  );

  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await onLoadMore(nextPage);
      dispatch({ kind: "append-page", comments: result });
      setCurrentPage(nextPage);
      setHasMore(result.length === pageSize);
    } finally {
      setIsLoadingMore(false);
    }
  }, [onLoadMore, isLoadingMore, currentPage, pageSize, dispatch]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const showEmpty = comments.length === 0 && !subscribe;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {showEmpty ? (
        emptyState ?? <CommentEmptyState message={labels.emptyState} />
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id}>
              <CommentNode
                comment={c}
                depth={0}
                maxDepth={maxDepth}
                indentPx={indentPx}
                variant={variant}
                bodyMaxLines={bodyMaxLines}
                currentUser={currentUser}
                labels={labels}
                format={format}
                isReplyOpen={replyParentId === c.id}
                onOpenReply={openReply}
                onCancelReply={cancelReply}
                onSubmitReply={submitReply}
                onLike={handleLike}
                onDelete={handleDelete}
                onReport={handleReport}
                onReportPresent={!!onReportComment}
                commentActions={commentActions}
                renderNode={renderNode}
                renderViewReplies={renderViewReplies}
                composerMinRows={composerMinRows}
                composerMaxRows={composerMaxRows}
                submitOnEnter={submitOnEnter}
                composerClassName={composerClassName}
                nodeClassName={nodeClassName}
              />
            </li>
          ))}
        </ul>
      )}

      {hasMore && onLoadMore ? (
        <button
          type="button"
          onClick={() => {
            void handleLoadMore();
          }}
          disabled={isLoadingMore}
          className="self-center rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {isLoadingMore ? `${labels.loadMore}…` : labels.loadMore}
        </button>
      ) : null}

      {currentUser ? (
        renderComposer ? (
          renderComposer(
            { value: "", isReply: false, isSubmitting: false },
            {
              setValue: () => {},
              submit: async () => {},
              cancel: () => {},
            },
          )
        ) : (
          <CommentComposer
            ref={composerRef}
            currentUser={currentUser}
            placeholder={labels.composerPlaceholder}
            onSubmit={submitTopLevel}
            submitOnEnter={submitOnEnter}
            minRows={composerMinRows}
            maxRows={composerMaxRows}
            className={composerClassName}
            labels={labels}
          />
        )
      ) : (
        composerEmptyState
      )}
    </div>
  );
}

const CommentThread01 = memo(CommentThread01Inner);
CommentThread01.displayName = "CommentThread01";

export { CommentThread01 };
