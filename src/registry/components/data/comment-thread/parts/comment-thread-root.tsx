"use client";

import {
  type ComponentType,
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
  Comment,
  CommentDeleteRequest,
  CommentLocalAction,
  CommentThreadHandle,
  CommentThreadRootProps,
  CommentThreadState,
} from "../types";
import { useCommentTree } from "../hooks/use-comment-tree";
import { usePaging } from "../hooks/use-paging";
import { useWarnOnce } from "../hooks/use-warn-once";
import { CommentModerationContext } from "../hooks/use-moderation-extension";
import type { CommentComposerHandle, CommentComposerProps } from "./comment-composer";
import {
  CommentThreadContext,
  type CommentThreadContextValue,
} from "./thread-context";
import { ThreadRootContext, type ThreadRootContextValue } from "./thread-root-context";
import { createRelativeTimeFormatter } from "../lib/format-time";
import { resolveLabels } from "../lib/labels";
import { findComment, hasNonVisible, isVisibleState } from "../lib/tree";

interface CommentThreadRootInnerProps extends CommentThreadRootProps {
  ref?: React.Ref<CommentThreadHandle>;
}

/** Headless provider of the compound: all state, handlers, context and the imperative handle. */
function CommentThreadRoot(props: CommentThreadRootInnerProps) {
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
    confirmDelete,
    size,
    children,
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
  const { comments, post, dispatch, isPending, localPosted, pendingMap, remove } = tree;
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
        if (!composerRef.current) {
          warnOnce(
            "no-composer-handle",
            "CommentThread: focusComposer() found no mounted CommentThreadComposer part (or it shows a renderComposer slot / empty state), so it does nothing.",
          );
          return;
        }
        composerRef.current.focus();
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
      deleteComment: (commentId: string) => {
        if (isPending(commentId) || !findComment(commentsRef.current, commentId)) return;
        remove(commentId);
      },
    }),
    [dispatchAndForget, isPending, remove, warnOnce],
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

  // Remembers where keyboard focus sat inside the thread. When that row is removed (a delete, a
  // host action) focus would fall to <body>; hand it to a neighbour instead — only if it really did.
  const rootRef = useRef<HTMLDivElement>(null);
  const focusTrack = useRef<{ el: HTMLElement; id: string; next: string | null; prev: string | null } | null>(null);

  // ─── Confirmed delete ─────────────────────────────────────────────────────
  // A request waiting on the add-on's dialog; the function form never shows it.
  const [deleteRequest, setDeleteRequest] = useState<CommentDeleteRequest | null>(null);
  const deleteResolver = useRef<((confirmed: boolean) => void) | null>(null);
  // The pending request; a request for another comment supersedes it (its answer is then ignored).
  const deleteBusy = useRef<{ id: string; seq: number } | null>(null);
  const deleteSeq = useRef(0);
  const mountedRef = useRef(true);
  const handoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Unmount: a late answer must neither remove nor arm a hand-off.
  const stopDeletes = useCallback(() => {
    mountedRef.current = false;
    deleteSeq.current++;
    deleteBusy.current = null;
    if (handoffTimer.current) clearTimeout(handoffTimer.current);
  }, []);
  useEffect(() => {
    mountedRef.current = true;
    return stopDeletes;
  }, [stopDeletes]);
  const confirmDeleteRef = useRef(confirmDelete);
  useLayoutEffect(() => {
    confirmDeleteRef.current = confirmDelete;
  });

  // The host's dialog returns focus to <body> (it has no trigger) on its own schedule: wait for it
  // to close, then focus the target — unless focus went somewhere else meanwhile.
  const handOffFocus = useCallback((resolveTarget: () => HTMLElement | null) => {
    if (handoffTimer.current) clearTimeout(handoffTimer.current);
    let tries = 0;
    let goneOnce = false;
    const tick = () => {
      if (!mountedRef.current) return;
      tries++;
      // A dialog that does not host the thread itself is still in the way until it has left the
      // DOM — including while it animates closed (`data-state="closed"`): on unmount its focus scope
      // moves focus once more (on a 0 ms timer), so the hand-off waits one more tick after that.
      // A thread inside a Dialog / bottom sheet never waits for its own container.
      const root = rootRef.current;
      const dialogPresent = Array.from(
        document.querySelectorAll<HTMLElement>('[role="dialog"],[role="alertdialog"]'),
      ).some(
        (d) => !(root && d.contains(root)) && !d.hidden && d.getAttribute("aria-hidden") !== "true",
      );
      if (!dialogPresent && goneOnce) {
        const active = document.activeElement;
        if (!active || active === document.body || active === document.documentElement) {
          resolveTarget()?.focus();
        }
        return;
      }
      goneOnce = !dialogPresent;
      if (tries < 40) handoffTimer.current = setTimeout(tick, 50);
    };
    handoffTimer.current = setTimeout(tick, 50);
  }, []);

  const requestDelete = useCallback(
    (commentId: string) => {
      if (isPending(commentId) || deleteBusy.current?.id === commentId) return;
      const comment = findComment(commentsRef.current, commentId);
      if (!comment) return;
      const confirm = confirmDeleteRef.current;
      if (!confirm) {
        remove(commentId);
        return;
      }
      // A pending request for another comment is superseded: its answer will be ignored.
      const pendingResolver = deleteResolver.current;
      deleteResolver.current = null;
      const token = { id: commentId, seq: ++deleteSeq.current };
      deleteBusy.current = token;
      pendingResolver?.(false);
      const request: CommentDeleteRequest = {
        comment,
        hasReplies: (comment.replies?.length ?? 0) > 0 || (comment.replyCount ?? 0) > 0,
      };
      const answer: Promise<boolean> =
        typeof confirm === "function"
          ? (async () => confirm(request))()
          : new Promise<boolean>((resolve) => {
              deleteResolver.current = resolve;
              setDeleteRequest(request);
            });
      void answer
        .catch(() => false)
        .then((confirmed) => {
          if (deleteBusy.current === token) deleteBusy.current = null;
          if (!mountedRef.current || deleteSeq.current !== token.seq) return; // unmounted, or superseded
          const root = rootRef.current;
          const row = root?.querySelector<HTMLElement>(`[data-comment-id="${CSS.escape(commentId)}"]`);
          const item = row?.closest("li");
          const idOf = (el: Element | null | undefined) =>
            el?.querySelector("[data-comment-id]")?.getAttribute("data-comment-id") ?? null;
          const next = idOf(item?.nextElementSibling);
          const prev = idOf(item?.previousElementSibling);
          const find = (id: string | null) =>
            id && rootRef.current
              ? rootRef.current.querySelector<HTMLElement>(`[data-comment-id="${CSS.escape(id)}"]`)
              : null;
          if (!confirmed) {
            handOffFocus(() => {
              const target = find(commentId);
              // Loaded replies render inside the row before its own kebab: take the row's own.
              const own = target
                ? Array.from(target.querySelectorAll<HTMLElement>("[data-comment-kebab]")).find(
                    (k) => k.closest("[data-comment-id]") === target,
                  )
                : undefined;
              return own ?? target ?? rootRef.current;
            });
            return;
          }
          // Gone meanwhile (a realtime delete): nothing left to remove.
          if (isPending(commentId) || !findComment(commentsRef.current, commentId)) return;
          focusTrack.current = null; // this hand-off replaces the generic one
          remove(commentId);
          handOffFocus(
            () =>
              find(next) ??
              find(prev) ??
              rootRef.current?.querySelector<HTMLElement>("textarea") ??
              rootRef.current,
          );
        });
    },
    [handOffFocus, isPending, remove],
  );
  // The comment a pending request is about vanished (a realtime delete): drop the request.
  useEffect(() => {
    const busy = deleteBusy.current;
    if (!busy || findComment(comments, busy.id)) return;
    deleteBusy.current = null;
    deleteSeq.current++;
    const resolve = deleteResolver.current;
    deleteResolver.current = null;
    if (resolve) {
      resolve(false);
      queueMicrotask(() => {
        if (mountedRef.current) setDeleteRequest(null);
      });
    }
  }, [comments]);
  const resolveDelete = useCallback((confirmed: boolean) => {
    const resolve = deleteResolver.current;
    if (!resolve) return;
    deleteResolver.current = null;
    setDeleteRequest(null);
    resolve(confirmed);
  }, []);

  // ─── Context ──────────────────────────────────────────────────────────────
  const { loadReplies } = paging;
  // CT-7: the composer part hands its (statically imported) composer to the rows' reply boxes.
  const [replyComposer, setReplyComposer] = useState<ComponentType<CommentComposerProps> | null>(null);
  // Two mounted composer parts register twice: the box stays available until the last one leaves.
  const replyComposerParts = useRef(0);
  const registerReplyComposer = useCallback(
    (component: ComponentType<CommentComposerProps> | null) => {
      if (component) {
        replyComposerParts.current++;
        setReplyComposer(() => component);
      } else {
        replyComposerParts.current = Math.max(0, replyComposerParts.current - 1);
        if (replyComposerParts.current === 0) setReplyComposer(null);
      }
    },
    [],
  );

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
      requestDelete,
      replyComposer,
      size: size ?? "default",
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
      requestDelete,
      replyComposer,
      size,
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

  // ─── Visible tree, focus hand-offs ────────────────────────────────────────

  // Without the add-on a non-visible comment is left out, with its replies.
  const visible = useMemo(
    () => (moderation ? comments : comments.filter(isVisibleState)),
    [comments, moderation],
  );
  const showEmpty = visible.length === 0 && !subscribe;

  // "Load older comments" unmounts when the last page arrives; keyboard focus would fall to <body>.
  const listRef = useRef<HTMLUListElement | null>(null);
  const loadMoreButtonRef = useRef<HTMLButtonElement | null>(null);
  const registerList = useCallback((el: HTMLUListElement | null) => {
    listRef.current = el;
  }, []);
  const registerLoadMoreButton = useCallback((el: HTMLButtonElement | null) => {
    loadMoreButtonRef.current = el;
  }, []);
  // Every mounted composer part's handle; the latest mounted one is the target. A part leaving
  // removes only its own handle.
  const composerHandles = useRef<CommentComposerHandle[]>([]);
  const registerComposer = useCallback(
    (handle: CommentComposerHandle | null, previous?: CommentComposerHandle | null) => {
      const list = composerHandles.current;
      if (previous) {
        const at = list.indexOf(previous);
        if (at >= 0) list.splice(at, 1);
      }
      if (handle) list.push(handle);
      composerRef.current = list[list.length - 1] ?? null;
    },
    [],
  );

  // Focus, a press or a key inside a row all count: a mouse press on the actions trigger opens the
  // menu without ever focusing the trigger.
  const focusFrom = useRef<{ ids: Set<string>; count: number } | null>(null);
  const trackFocus = useCallback((event: React.SyntheticEvent) => {
    const target = event.target as HTMLElement;
    // Focus moving off the load-more button cancels a hand-off still waiting for its page.
    if (focusFrom.current !== null && target !== loadMoreButtonRef.current) focusFrom.current = null;
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

  // After "Load older comments": focus the first new row once the page is IN THE TREE. A controlled
  // host may apply the page after the load settles, so `loadingMore` ending is not the signal.
  const { loadingMore, hasMore: moreToLoad, loadMoreFailed } = paging;
  const visibleCount = visible.length;
  const visibleRef = useRef(visible);
  useLayoutEffect(() => {
    visibleRef.current = visible;
  });
  const beginLoadMoreFocus = useCallback(() => {
    // Remember the rows by id: a realtime insert during the load shifts indexes, not ids.
    const shown = visibleRef.current;
    focusFrom.current = { ids: new Set(shown.map((c) => c.id)), count: shown.length };
  }, []);
  useEffect(() => {
    const from = focusFrom.current;
    if (from === null) return;
    if (visibleCount < from.count || loadMoreFailed) {
      focusFrom.current = null; // the list was reset, or the page failed
      return;
    }
    const firstNew = visible.findIndex((c) => !from.ids.has(c.id));
    if (firstNew >= 0) {
      if (loadingMore) return;
      focusFrom.current = null;
      if (moreToLoad) return;
      // The user may have moved on to something outside the thread: never pull focus back.
      const active = document.activeElement;
      const parked =
        !active ||
        active === document.body ||
        active === document.documentElement ||
        active === loadMoreButtonRef.current ||
        !!rootRef.current?.contains(active);
      if (!parked) return;
      listRef.current?.children[firstNew]?.querySelector<HTMLElement>("article")?.focus();
      return;
    }
    // Nothing was added and nothing more is coming: give a controlled host a moment to apply the
    // page, then drop the hand-off so a later realtime comment cannot take focus.
    if (!loadingMore && !moreToLoad) {
      const timer = setTimeout(() => {
        focusFrom.current = null;
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [loadingMore, moreToLoad, visibleCount, visible, loadMoreFailed]);

  // ─── Root context for the parts ───────────────────────────────────────────
  const loadMore = paging.loadMore;
  const loadMoreVoid = useCallback(() => {
    void loadMore();
  }, [loadMore]);
  const state = useMemo<CommentThreadState>(
    () => ({
      comments: visible,
      hasMore: paging.hasMore,
      loadingMore: paging.loadingMore,
      loadMoreFailed: paging.loadMoreFailed,
      loadMore: loadMoreVoid,
      closed,
      currentUser,
      labels,
    }),
    [visible, paging.hasMore, paging.loadingMore, paging.loadMoreFailed, loadMoreVoid, closed, currentUser, labels],
  );
  const rootCtx = useMemo<ThreadRootContextValue>(
    () => ({
      state,
      size: size ?? "default",
      composerClassName,
      composerMinRows,
      composerMaxRows,
      submitOnEnter,
      renderComposer,
      composerEmptyState,
      emptyState,
      showEmpty,
      submitTopLevel,
      registerList,
      registerLoadMoreButton,
      registerComposer,
      registerReplyComposer,
      beginLoadMoreFocus,
    }),
    [
      state,
      size,
      composerClassName,
      composerMinRows,
      composerMaxRows,
      submitOnEnter,
      renderComposer,
      composerEmptyState,
      emptyState,
      showEmpty,
      submitTopLevel,
      registerList,
      registerLoadMoreButton,
      registerComposer,
      registerReplyComposer,
      beginLoadMoreFocus,
    ],
  );

  return (
    <CommentModerationContext.Provider value={moderation ?? null}>
      <CommentThreadContext.Provider value={ctx}>
        <ThreadRootContext.Provider value={rootCtx}>
          <div
            ref={rootRef}
            tabIndex={-1}
            onFocus={trackFocus}
            onPointerDownCapture={trackFocus}
            onKeyDownCapture={trackFocus}
            className={cn("flex flex-col gap-3 outline-none", className)}
          >
            {children}
            {confirmDelete && typeof confirmDelete !== "function" ? (
              <confirmDelete.Dialog request={deleteRequest} labels={labels} onResolve={resolveDelete} />
            ) : null}
          </div>
        </ThreadRootContext.Provider>
      </CommentThreadContext.Provider>
    </CommentModerationContext.Provider>
  );
}


export { CommentThreadRoot };
