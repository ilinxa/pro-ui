"use client";

import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/utils";
import type {
  CommentComposerHelpers,
  CommentLocalAction,
  CommentThreadHandle,
  CommentThreadProps,
} from "./types";
import { useCommentTree } from "./hooks/use-comment-tree";
import { usePaging } from "./hooks/use-paging";
import { useWarnOnce } from "./hooks/use-warn-once";
import { CommentModerationContext } from "./hooks/use-moderation-extension";
import { CommentNode } from "./parts/comment-node";
import {
  CommentComposer,
  type CommentComposerHandle,
} from "./parts/comment-composer";
import { CommentEmptyState } from "./parts/comment-empty-state";
import {
  CommentThreadContext,
  type CommentThreadContextValue,
} from "./parts/thread-context";
import { createRelativeTimeFormatter } from "./lib/format-time";
import { resolveLabels } from "./lib/labels";
import { hasNonVisible, isVisibleState } from "./lib/tree";
import type { Comment } from "./types";

interface CommentThreadInnerProps extends CommentThreadProps {
  ref?: React.Ref<CommentThreadHandle>;
}

function CommentThreadInner(props: CommentThreadInnerProps) {
  const {
    comments: commentsProp,
    onCommentsChange,
    variant = "default",
    currentUser,
    maxDepth = 2,
    indentPx = 24,
    bodyMaxLines: bodyMaxLinesProp,
    composerMinRows = 1,
    composerMaxRows = 6,
    submitOnEnter = true,
    pageSize = 10,
    hasMore: hasMoreProp,
    nextCursor,
    subscribe,
    onSubscribeDelta,
    onAddComment,
    onLikeComment,
    onDeleteComment,
    onReportComment,
    onEditComment,
    onLoadMore,
    onLoadMoreCursor,
    onLoadReplies,
    onError,
    optimistic = true,
    reactionKinds,
    onReactComment,
    commentActions,
    extraActions,
    engagementActions,
    renderNode,
    renderViewReplies,
    renderComposer,
    composerEmptyState,
    emptyState,
    moderation,
    removedMode = "prune",
    renderContent,
    getAuthorHref,
    linkComponent = "a",
    closed = false,
    labels: labelsProp,
    locale = "en",
    timeZone,
    now: nowProp,
    formatRelativeTime,
    formatCount,
    dir,
    className,
    composerClassName,
    nodeClassName,
    ref,
  } = props;

  const bodyMaxLines = bodyMaxLinesProp ?? (variant === "compact" ? 2 : 4);
  const controlled = onCommentsChange !== undefined;
  const warnOnce = useWarnOnce();

  const labels = useMemo(() => resolveLabels(labelsProp), [labelsProp]);

  // ─── Time ─────────────────────────────────────────────────────────────────
  // Relative text needs "now". The `now` prop wins; otherwise the clock is read through an
  // external store whose server snapshot is `null`: the server render and the first client
  // render (hydration) print no relative text, and the real minute arrives right after mount
  // and again every 60 s.
  const legacyFormat = labelsProp?.formatRelativeTime;
  const formatter = useMemo(
    () => formatRelativeTime ?? legacyFormat ?? createRelativeTimeFormatter(locale, timeZone),
    [formatRelativeTime, legacyFormat, locale, timeZone],
  );
  const hasNowProp = nowProp !== undefined;
  const subscribeClock = useCallback(
    (notify: () => void) => {
      if (hasNowProp) return () => {};
      const id = setInterval(notify, 60_000);
      return () => clearInterval(id);
    },
    [hasNowProp],
  );
  const readClock = useCallback((): number | null => Math.floor(Date.now() / 60_000), []);
  const readServerClock = useCallback((): number | null => null, []);
  const minute = useSyncExternalStore(subscribeClock, readClock, readServerClock);
  const now = useMemo(
    () => nowProp ?? (minute === null ? null : new Date(minute * 60_000)),
    [nowProp, minute],
  );
  // A comment stamped slightly in the future (a server clock ahead of the viewer's) reads as
  // "now", never "in 1 min" — the formatter itself is future-aware for other callers (polls).
  const formatTime = useCallback(
    (date: Date) =>
      now ? formatter(date.getTime() > now.getTime() ? now : date, now) : null,
    [formatter, now],
  );

  // ─── State ────────────────────────────────────────────────────────────────
  const tree = useCommentTree({
    comments: commentsProp,
    onCommentsChange,
    currentUser,
    subscribe,
    onSubscribeDelta,
    onAddComment,
    onLikeComment,
    onDeleteComment,
    onEditComment,
    onReactComment,
    onError,
    optimistic,
    tombstoneOnRemove: removedMode === "tombstone" && !!moderation,
    warnOnce,
  });
  const { comments, post, dispatch, isPending, localPosted, pendingMap } = tree;
  // The legacy "Load more" heuristic counts what the server delivered, not what the viewer posted.
  const isLocal = useCallback(
    (c: Comment) =>
      pendingMap.has(c.id) ||
      localPosted.includes(c.id) ||
      (c.clientId !== undefined && localPosted.includes(c.clientId)),
    [pendingMap, localPosted],
  );

  const paging = usePaging({
    comments,
    accept: tree.accept,
    reportError: tree.reportError,
    onLoadMore,
    onLoadMoreCursor,
    onLoadReplies,
    pageSize,
    hasMore: hasMoreProp,
    nextCursor,
    isLocal,
  });
  const resetPaging = paging.reset;
  // Replacing the tree forgets paging and reply-loading state and drops loads still in flight.
  const dispatchAndForget = useCallback(
    (action: CommentLocalAction) => {
      if (action.kind === "reset") resetPaging();
      dispatch(action);
    },
    [dispatch, resetPaging],
  );

  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const replyTriggerRef = useRef<HTMLElement | null>(null);
  const replyOpenRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    replyOpenRef.current = replyParentId;
  });
  const composerRef = useRef<CommentComposerHandle | null>(null);
  const closedRef = useRef(closed);
  useLayoutEffect(() => {
    closedRef.current = closed;
  });
  // A thread that closes drops any open reply composer (state adjusted during render).
  if (closed && replyParentId !== null) setReplyParentId(null);

  // Stable refs for the imperative handle.
  const commentsRef = useRef<Comment[]>(comments);
  useLayoutEffect(() => {
    commentsRef.current = comments;
  });

  useImperativeHandle(
    ref,
    () => ({
      focusComposer: () => {
        if (closedRef.current) {
          warnOnce("closed-handle", "CommentThread: the thread is `closed`; focusComposer() does nothing.");
          return;
        }
        composerRef.current?.focus();
      },
      openReply: (parentId: string) => {
        if (closedRef.current) {
          warnOnce("closed-handle", "CommentThread: the thread is `closed`; openReply() does nothing.");
          return;
        }
        if (isPending(parentId)) return;
        replyTriggerRef.current = null; // never leave an earlier row's Reply button as the focus target
        setReplyParentId(parentId);
      },
      getCurrentComments: () => commentsRef.current,
      reset: (next: Comment[]) => dispatchAndForget({ kind: "reset", next }),
      dispatch: dispatchAndForget,
    }),
    [dispatchAndForget, isPending, warnOnce],
  );

  // ─── Development warnings (effects: render may run twice) ─────────────────
  useEffect(() => {
    if (onEditComment && !moderation) {
      warnOnce(
        "edit-needs-moderation",
        "CommentThread: onEditComment needs the comment-thread-moderation add-on (the `moderation` prop). No Edit item is shown.",
      );
    }
    if (removedMode === "tombstone" && !moderation) {
      warnOnce(
        "tombstone-needs-moderation",
        'CommentThread: removedMode="tombstone" needs the comment-thread-moderation add-on (the `moderation` prop). Removed comments are pruned.',
      );
    }
  }, [onEditComment, removedMode, moderation, warnOnce]);

  useEffect(() => {
    if (!moderation && hasNonVisible(comments)) {
      warnOnce(
        "state-needs-moderation",
        'CommentThread: a comment has a `state` other than "visible" but the comment-thread-moderation add-on is not installed (the `moderation` prop). Such comments are left out, with their replies.',
      );
    }
  }, [moderation, comments, warnOnce]);

  useEffect(() => {
    if (labelsProp?.signInPrompt !== undefined) {
      warnOnce(
        "sign-in-prompt",
        "CommentThread: labels.signInPrompt is not rendered. Pass composerEmptyState to show a sign-in prompt.",
      );
    }
  }, [labelsProp?.signInPrompt, warnOnce]);

  const firstComments = useRef(commentsProp);
  useEffect(() => {
    if (!controlled && firstComments.current !== commentsProp) {
      warnOnce(
        "uncontrolled-comments-changed",
        "CommentThread: `comments` changed after mount, but it is read once unless `onCommentsChange` is passed. Pass `onCommentsChange` to control it, or use the handle's reset().",
      );
    }
  }, [controlled, commentsProp, warnOnce]);

  const wasControlled = useRef(controlled);
  useEffect(() => {
    if (wasControlled.current !== controlled) {
      wasControlled.current = controlled;
      warnOnce(
        "mode-switch",
        "CommentThread: switched between controlled and uncontrolled (`onCommentsChange` was added or removed). Pick one at mount.",
      );
    }
  }, [controlled, warnOnce]);

  // ─── Replies / composers ──────────────────────────────────────────────────
  const submitTopLevel = useCallback((content: string) => post(content), [post]);

  const restoreReplyFocus = useCallback(() => {
    const trigger = replyTriggerRef.current;
    if (trigger) {
      requestAnimationFrame(() => trigger.focus());
    }
  }, []);

  const submitReply = useCallback(
    async (content: string, parentId: string) => {
      await post(content, parentId); // a rejection keeps the inline composer open, with its alert
      // Close this composer + restore focus to its trigger (a11y) — unless another one opened meanwhile.
      if (replyOpenRef.current === parentId) {
        setReplyParentId(null);
        restoreReplyFocus();
      }
    },
    [post, restoreReplyFocus],
  );

  const cancelReply = useCallback(() => {
    setReplyParentId(null);
    restoreReplyFocus();
  }, [restoreReplyFocus]);

  const openReply = useCallback(
    (parentId: string, triggerEl: HTMLElement | null) => {
      if (isPending(parentId)) return;
      // A closed thread opens no reply box — for the handle and the `renderNode` helpers alike.
      if (closedRef.current) return;
      replyTriggerRef.current = triggerEl;
      setReplyParentId(parentId);
    },
    [isPending],
  );

  const report = useCallback(
    (commentId: string) => {
      if (isPending(commentId)) return;
      onReportComment?.(commentId);
    },
    [isPending, onReportComment],
  );

  /*
   * State backing the `renderComposer` slot. The default composer owns its value
   * internally, so this state exists only for the slot path and costs the default
   * path nothing. `submit` never rejects: a failed post sets `hasError` and keeps
   * the value (the failure was already reported through `onError`).
   *
   * No ref is involved on purpose: `renderComposer(state, helpers)` runs DURING
   * render, so anything it receives is on a render-reachable path, and reading
   * `ref.current` there is what the React Compiler lint rejects. `submit`
   * therefore closes over the rendered value and accepts an explicit override
   * for the same-tick case.
   */
  const [slotValue, setSlotValueState] = useState("");
  const [slotSubmitting, setSlotSubmitting] = useState(false);
  const [slotError, setSlotError] = useState(false);

  const setSlotValue = useCallback((next: string) => {
    setSlotValueState(next);
    setSlotError(false);
  }, []);
  const cancelSlot = useCallback(() => {
    setSlotValueState("");
    setSlotError(false);
  }, []);
  const submitSlot = useCallback(
    async (explicit?: string) => {
      const content = (explicit ?? slotValue).trim();
      if (!content) return;
      setSlotSubmitting(true);
      try {
        await submitTopLevel(content);
        setSlotValueState("");
        setSlotError(false);
      } catch {
        setSlotError(true);
      } finally {
        setSlotSubmitting(false);
      }
    },
    [slotValue, submitTopLevel],
  );
  const slotHelpers = useMemo<CommentComposerHelpers>(
    () => ({ setValue: setSlotValue, submit: submitSlot, cancel: cancelSlot }),
    [setSlotValue, submitSlot, cancelSlot],
  );

  // ─── Context ──────────────────────────────────────────────────────────────
  const { loadReplies } = paging;
  const ctx = useMemo<CommentThreadContextValue>(
    () => ({
      currentUser,
      labels,
      variant,
      maxDepth,
      indentPx,
      bodyMaxLines,
      composerMinRows,
      composerMaxRows,
      submitOnEnter,
      composerClassName,
      nodeClassName,
      closed,
      renderContent,
      getAuthorHref,
      linkComponent,
      locale,
      dir,
      formatCount,
      formatTime,
      pendingMap: tree.pendingMap,
      replyParentId: closed ? null : replyParentId,
      openReply,
      cancelReply,
      submitReply,
      like: tree.like,
      react: tree.react,
      remove: tree.remove,
      edit: tree.edit,
      report,
      hasReport: !!onReportComment,
      canEditAtAll: !!onEditComment && !!moderation,
      reactionKinds,
      hasReact: !!onReactComment,
      commentActions,
      extraActions,
      engagementActions,
      renderNode,
      renderViewReplies,
      moderation: moderation ?? null,
      hasLoadReplies: !!onLoadReplies,
      replyLoads: paging.replyLoads,
      loadReplies: (commentId: string) => {
        void loadReplies(commentId);
      },
    }),
    [
      currentUser,
      labels,
      variant,
      maxDepth,
      indentPx,
      bodyMaxLines,
      composerMinRows,
      composerMaxRows,
      submitOnEnter,
      composerClassName,
      nodeClassName,
      closed,
      renderContent,
      getAuthorHref,
      linkComponent,
      locale,
      dir,
      formatCount,
      formatTime,
      tree.pendingMap,
      replyParentId,
      openReply,
      cancelReply,
      submitReply,
      tree.like,
      tree.react,
      tree.remove,
      tree.edit,
      report,
      onReportComment,
      onEditComment,
      moderation,
      reactionKinds,
      onReactComment,
      commentActions,
      extraActions,
      engagementActions,
      renderNode,
      renderViewReplies,
      onLoadReplies,
      paging.replyLoads,
      loadReplies,
    ],
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  // Without the add-on a non-visible comment is left out, with its replies.
  const visible = useMemo(
    () => (moderation ? comments : comments.filter(isVisibleState)),
    [comments, moderation],
  );
  const showEmpty = visible.length === 0 && !subscribe;

  // "Load older comments" unmounts when the last page arrives; keyboard focus would fall to <body>.
  const listRef = useRef<HTMLUListElement>(null);

  // Remembers where keyboard focus sat inside the thread. When that row is removed (a delete, a
  // host action) focus would fall to <body>; hand it to a neighbour instead — only if it really did.
  const rootRef = useRef<HTMLDivElement>(null);
  const focusTrack = useRef<{ el: HTMLElement; id: string; next: string | null; prev: string | null } | null>(null);
  // Focus, a press or a key inside a row all count: a mouse press on the actions trigger opens the
  // menu without ever focusing the trigger.
  const trackFocus = useCallback((event: React.SyntheticEvent) => {
    const target = event.target as HTMLElement;
    const row = target.closest?.("[data-comment-id]");
    if (!row || !rootRef.current?.contains(target)) return; // e.g. the portaled menu
    const idOf = (el: Element | null | undefined) =>
      el?.querySelector("[data-comment-id]")?.getAttribute("data-comment-id") ?? null;
    const item = row.closest("li");
    focusTrack.current = {
      el: target,
      id: row.getAttribute("data-comment-id") ?? "",
      next: idOf(item?.nextElementSibling),
      prev: idOf(item?.previousElementSibling),
    };
  }, []);
  useEffect(() => {
    const tracked = focusTrack.current;
    if (!tracked || tracked.el.isConnected) return;
    const timer = setTimeout(() => {
      focusTrack.current = null;
      const active = document.activeElement;
      if (active && active !== document.body && active !== document.documentElement) return;
      const root = rootRef.current;
      if (!root) return;
      const find = (id: string | null) =>
        id ? root.querySelector<HTMLElement>(`[data-comment-id="${CSS.escape(id)}"]`) : null;
      (find(tracked.id) ?? find(tracked.next) ?? find(tracked.prev) ?? root.querySelector<HTMLElement>("textarea") ?? root).focus();
    }, 30);
    return () => clearTimeout(timer);
  }, [comments]);
  const focusFrom = useRef<number | null>(null);
  const { loadingMore, hasMore: moreToLoad } = paging;
  useEffect(() => {
    const from = focusFrom.current;
    if (from === null || loadingMore) return;
    focusFrom.current = null;
    if (!moreToLoad && visible.length > from) {
      listRef.current?.children[from]?.querySelector<HTMLElement>("article")?.focus();
    }
  }, [loadingMore, moreToLoad, visible.length]);

  return (
    <CommentModerationContext.Provider value={moderation ?? null}>
      <CommentThreadContext.Provider value={ctx}>
        <div
          ref={rootRef}
          tabIndex={-1}
          onFocus={trackFocus}
          onPointerDownCapture={trackFocus}
          onKeyDownCapture={trackFocus}
          className={cn("flex flex-col gap-3 outline-none", className)}
        >
          {showEmpty ? (
            emptyState ?? <CommentEmptyState message={labels.emptyState} />
          ) : (
            <ul ref={listRef} className="flex flex-col gap-3">
              {visible.map((c) => (
                <li key={c.id}>
                  <CommentNode comment={c} depth={0} />
                </li>
              ))}
            </ul>
          )}

          {paging.hasMore ? (
            <div className="flex flex-col items-center gap-1 self-center">
              {paging.loadMoreFailed ? (
                <p role="alert" className="text-xs text-destructive">
                  {labels.loadFailed}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  focusFrom.current = visible.length;
                  void paging.loadMore();
                }}
                // aria-disabled, not disabled: a focused button that turns disabled drops focus to <body>.
                aria-disabled={paging.loadingMore || undefined}
                aria-busy={paging.loadingMore || undefined}
                className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground aria-disabled:opacity-50"
              >
                {paging.loadingMore
                  ? labels.loadingMore
                  : paging.loadMoreFailed
                    ? labels.retry
                    : labels.loadMore}
              </button>
            </div>
          ) : null}

          {closed ? (
            <p className="text-center text-sm text-muted-foreground">{labels.closed}</p>
          ) : currentUser ? (
            renderComposer ? (
              renderComposer(
                {
                  value: slotValue,
                  isReply: false,
                  isSubmitting: slotSubmitting,
                  hasError: slotError,
                },
                slotHelpers,
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
      </CommentThreadContext.Provider>
    </CommentModerationContext.Provider>
  );
}

const CommentThread = memo(CommentThreadInner);
CommentThread.displayName = "CommentThread";

export { CommentThread };
