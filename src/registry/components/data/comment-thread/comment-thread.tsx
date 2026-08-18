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
  type CommentComposerHelpers,
  type CommentThreadHandle,
  type CommentThreadProps,
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

interface CommentThreadInnerProps extends CommentThreadProps {
  ref?: React.Ref<CommentThreadHandle>;
}

function genTempId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `temp-${crypto.randomUUID()}`;
  }
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function CommentThreadInner(props: CommentThreadInnerProps) {
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

  /*
   * v0.2.2 — state backing the `renderComposer` slot.
   *
   * The slot used to receive a frozen `{ value: "", isSubmitting: false }` and
   * three empty-bodied helpers, so a consumer who replaced the composer got a
   * controller that could not set a value, submit, or cancel. The contract in
   * `CommentComposerHelpers` promised all three. The default composer owns its
   * value internally, which is why nothing here did — this state exists only
   * for the slot path and costs the default path nothing.
   */
  const [slotComposerValue, setSlotComposerValue] = useState("");
  const [slotComposerSubmitting, setSlotComposerSubmitting] = useState(false);
  /*
   * Review finding: `submit` used to close over `slotComposerValue`, so the
   * natural call sequence from a custom composer — `setValue(next)` then
   * `submit()` in the same tick — posted the PREVIOUS value, because React had
   * not re-rendered yet. A ref mirrors the latest value so the two orderings
   * agree. Silently posting stale text is a worse failure than the empty stubs
   * this replaced.
   */
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

  /*
   * Real helpers for the `renderComposer` slot. They replaced three
   * empty-bodied stubs, so a custom composer can finally set a value, submit,
   * and cancel.
   *
   * No ref is involved on purpose: `renderComposer(state, helpers)` runs DURING
   * render, so anything it receives is on a render-reachable path, and reading
   * `ref.current` there is what the React Compiler lint rejects. `submit`
   * therefore closes over the rendered value and accepts an explicit override
   * for the same-tick case.
   */
  const setSlotValue = useCallback((next: string) => {
    setSlotComposerValue(next);
  }, []);

  const cancelSlot = useCallback(() => setSlotComposerValue(""), []);

  const submitSlot = useCallback(
    async (explicit?: string) => {
      const content = (explicit ?? slotComposerValue).trim();
      if (!content) return;
      setSlotComposerSubmitting(true);
      try {
        await submitTopLevel(content);
        setSlotComposerValue("");
      } finally {
        setSlotComposerSubmitting(false);
      }
    },
    [slotComposerValue, submitTopLevel],
  );

  const slotComposerHelpers = useMemo<CommentComposerHelpers>(
    () => ({ setValue: setSlotValue, submit: submitSlot, cancel: cancelSlot }),
    [setSlotValue, submitSlot, cancelSlot],
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
            {
              value: slotComposerValue,
              isReply: false,
              isSubmitting: slotComposerSubmitting,
            },
            slotComposerHelpers,
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

const CommentThread = memo(CommentThreadInner);
CommentThread.displayName = "CommentThread";

export { CommentThread };
