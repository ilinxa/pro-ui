"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Comment,
  CommentDelta,
  CommentErrorContext,
  CommentLocalAction,
  CommentThreadCurrentUser,
  CommentThreadProps,
  CommentsChange,
  Subscribe,
} from "../types";
import { commentReducer, useCommentState } from "./use-comment-state";
import { containsId, findComment, hasClientId } from "../lib/tree";
import { nextReactions } from "../lib/reactions";

// ─── Pending operations (the optimistic overlay) ─────────────────────────────

type PendingBody =
  | { type: "add"; comment: Comment; parentId?: string }
  | { type: "like"; commentId: string; liked: boolean }
  | { type: "react"; commentId: string; reaction: string | null }
  | { type: "delete"; commentId: string; tombstone: boolean }
  | { type: "edit"; commentId: string; content: string };
type PendingOp = PendingBody & { id: number };

/** The tree as it looks while `pending` operations are in flight. Same array when none are. */
function applyPending(base: Comment[], pending: PendingOp[]): Comment[] {
  let tree = base;
  for (const op of pending) {
    switch (op.type) {
      case "add":
        // The server's copy already arrived (an echo): the pending row has nothing left to show.
        if (op.comment.clientId !== undefined && hasClientId(tree, op.comment.clientId)) break;
        tree = commentReducer(tree, { kind: "add", comment: op.comment, parentId: op.parentId });
        break;
      case "like":
        tree = commentReducer(tree, { kind: "like-toggle", commentId: op.commentId, nextLiked: op.liked });
        break;
      case "react": {
        const target = findComment(tree, op.commentId);
        if (target) {
          tree = commentReducer(tree, {
            kind: "patch",
            commentId: op.commentId,
            patch: { reactions: nextReactions(target.reactions, op.reaction) },
          });
        }
        break;
      }
      case "delete":
        tree = commentReducer(
          tree,
          op.tombstone
            ? { kind: "patch", commentId: op.commentId, patch: { state: "deleted" } }
            : { kind: "remove", commentId: op.commentId },
        );
        break;
      case "edit":
        tree = commentReducer(tree, {
          kind: "patch",
          commentId: op.commentId,
          patch: { content: op.content, edited: true },
        });
        break;
    }
  }
  return tree;
}

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  !!value && typeof (value as { then?: unknown }).then === "function";

const isComment = (value: unknown): value is Comment =>
  !!value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string";

/** Always-current value for handlers: assigned at commit, so an event handler never sees a stale render. */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

export type PendingKind = "sending" | "unconfirmed";

export interface UseCommentTreeOptions {
  comments: Comment[];
  onCommentsChange?: CommentThreadProps["onCommentsChange"];
  currentUser?: CommentThreadCurrentUser;
  subscribe?: Subscribe<CommentDelta>;
  onSubscribeDelta?: (delta: CommentDelta) => void;
  onAddComment?: CommentThreadProps["onAddComment"];
  onLikeComment?: CommentThreadProps["onLikeComment"];
  onDeleteComment?: CommentThreadProps["onDeleteComment"];
  onEditComment?: CommentThreadProps["onEditComment"];
  onReactComment?: CommentThreadProps["onReactComment"];
  onError?: CommentThreadProps["onError"];
  optimistic: boolean;
  /** `removedMode="tombstone"` with the add-on installed. */
  tombstoneOnRemove: boolean;
  warnOnce: (key: string, message: string) => void;
}

/**
 * The thread's state engine.
 *
 *  - Uncontrolled (no `onCommentsChange`): `comments` seeds a reducer once; accepted changes apply to it.
 *  - Controlled: `comments` is the tree on every render; accepted changes are REPORTED, never applied.
 *
 * Either way a change that has a promise in flight is an overlay over that tree, so a rejection just
 * drops the overlay (the like, the reaction, the deleted subtree at its position, the old content
 * all come back) and a refetch replaces stale optimism. Only the latest request per target decides.
 */
export function useCommentTree(opts: UseCommentTreeOptions) {
  const controlled = opts.onCommentsChange !== undefined;
  const { comments: localBase, dispatch: dispatchLocal } = useCommentState({
    initialComments: opts.comments,
  });
  const base = controlled ? opts.comments : localBase;

  const [pending, setPending] = useState<PendingOp[]>([]);
  const [unconfirmed, setUnconfirmed] = useState<string[]>([]);
  /** Client ids of comments this viewer posted in this session (not server-delivered pages). */
  const [localPosted, setLocalPosted] = useState<string[]>([]);
  const shown = useMemo(() => applyPending(base, pending), [base, pending]);

  const pendingMap = useMemo(() => {
    const map = new Map<string, PendingKind>();
    for (const id of unconfirmed) map.set(id, "unconfirmed");
    for (const op of pending) if (op.type === "add") map.set(op.comment.id, "sending");
    return map;
  }, [pending, unconfirmed]);

  const latest = useLatest({ ...opts, controlled, base, shown, pendingMap });

  const seq = useRef(0);
  const [settled] = useState(() => new Map<string, number>());
  const instanceId = useId();
  const clientCounter = useRef(0);

  const reportError = useCallback((error: unknown, context: CommentErrorContext) => {
    try {
      latest.current.onError?.(error, context);
    } catch (thrown) {
      // A throwing onError must not turn a handled failure into an unhandled one.
      if (process.env.NODE_ENV !== "production") console.error("CommentThread: onError threw", thrown);
    }
  }, [latest]);

  /** Run a host callback; a throw is logged, never allowed to turn a success into a failure. */
  const callHost = useCallback((name: string, fn: () => void) => {
    try {
      fn();
    } catch (thrown) {
      if (process.env.NODE_ENV !== "production") console.error(`CommentThread: ${name} threw`, thrown);
    }
  }, []);

  /**
   * The working tree: the base as every accepted change so far has left it, advanced
   * synchronously so two changes in one tick build on each other (the rendered base only
   * catches up on the next commit). Re-synced to the rendered base on every commit and, when
   * the host ignores a report, one task later.
   */
  const work = useRef<Comment[]>(base);
  const resyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useLayoutEffect(() => {
    work.current = base;
  });
  useEffect(
    () => () => {
      if (resyncTimer.current) clearTimeout(resyncTimer.current);
    },
    [],
  );

  /** An accepted change: applied (uncontrolled) or reported with the tree it produces (controlled). */
  const accept = useCallback(
    (action: CommentLocalAction, change: CommentsChange) => {
      const l = latest.current;
      const current = work.current;
      const next = commentReducer(current, action);
      if (next === current) return;
      work.current = next;
      if (!l.controlled) {
        dispatchLocal(action);
        return;
      }
      if (!resyncTimer.current) {
        resyncTimer.current = setTimeout(() => {
          resyncTimer.current = null;
          work.current = latest.current.base;
        }, 0);
      }
      callHost("onCommentsChange", () => l.onCommentsChange?.(next, change));
    },
    [latest, dispatchLocal, callHost],
  );

  const removeOp = useCallback((id: number) => {
    setPending((list) => (list.some((op) => op.id === id) ? list.filter((op) => op.id !== id) : list));
  }, []);

  /** Apply `commit` unless a newer request on the same target was already applied (latest wins). */
  const settle = useCallback(
    (key: string, id: number, commit: () => void) => {
      if (id <= (settled.get(key) ?? 0)) return;
      settled.set(key, id);
      commit();
    },
    [settled],
  );

  /** Run one handler call: overlay while a promise is in flight, accept when it settles. */
  const run = useCallback(
    (m: {
      key: string;
      overlay: PendingBody;
      invoke: () => unknown;
      commit: () => void;
      context: CommentErrorContext;
    }) => {
      const id = ++seq.current;
      let result: unknown;
      try {
        result = m.invoke();
      } catch (error) {
        reportError(error, m.context);
        return;
      }
      if (!isThenable(result)) {
        settle(m.key, id, m.commit);
        return;
      }
      if (latest.current.optimistic) setPending((list) => [...list, { ...m.overlay, id } as PendingOp]);
      result.then(
        () => {
          removeOp(id);
          settle(m.key, id, m.commit);
        },
        (error: unknown) => {
          removeOp(id);
          reportError(error, m.context);
        },
      );
    },
    [latest, reportError, removeOp, settle],
  );

  const isPendingId = useCallback((id: string) => latest.current.pendingMap.has(id), [latest]);

  const like = useCallback(
    (commentId: string, nextLiked: boolean) => {
      if (isPendingId(commentId)) return;
      run({
        key: `like:${commentId}`,
        overlay: { type: "like", commentId, liked: nextLiked },
        invoke: () => latest.current.onLikeComment?.(commentId, nextLiked),
        commit: () =>
          accept({ kind: "like-toggle", commentId, nextLiked }, { kind: "liked", commentId, liked: nextLiked }),
        context: { kind: "like", commentId },
      });
    },
    [accept, isPendingId, latest, run],
  );

  const react = useCallback(
    (commentId: string, reaction: string | null) => {
      if (isPendingId(commentId)) return;
      run({
        key: `react:${commentId}`,
        overlay: { type: "react", commentId, reaction },
        invoke: () => latest.current.onReactComment?.(commentId, reaction),
        commit: () => {
          const target = findComment(work.current, commentId);
          if (!target) return;
          accept(
            { kind: "patch", commentId, patch: { reactions: nextReactions(target.reactions, reaction) } },
            { kind: "reacted", commentId, reaction },
          );
        },
        context: { kind: "react", commentId },
      });
    },
    [accept, isPendingId, latest, run, work],
  );

  const remove = useCallback(
    (commentId: string) => {
      if (isPendingId(commentId)) return;
      const tombstone = latest.current.tombstoneOnRemove;
      run({
        key: `delete:${commentId}`,
        overlay: { type: "delete", commentId, tombstone },
        invoke: () => latest.current.onDeleteComment?.(commentId),
        commit: () =>
          accept(
            tombstone
              ? { kind: "patch", commentId, patch: { state: "deleted" } }
              : { kind: "remove", commentId },
            { kind: "deleted", commentId },
          ),
        context: { kind: "delete", commentId },
      });
    },
    [accept, isPendingId, latest, run],
  );

  /** Save an edit. Resolves on success; rejects (after the rollback and `onError`) so the editor can say so. */
  const edit = useCallback(
    async (commentId: string, content: string): Promise<void> => {
      const l = latest.current;
      if (!l.onEditComment || isPendingId(commentId)) return;
      const id = ++seq.current;
      const key = `edit:${commentId}`;
      const context: CommentErrorContext = { kind: "edit", commentId };
      const commit = (result: unknown) => {
        const server = isComment(result) ? result : undefined;
        accept(
          {
            kind: "patch",
            commentId,
            patch: server
              ? { ...server, content: server.content, edited: server.edited ?? true }
              : { content, edited: true },
          },
          { kind: "edited", commentId, content: server?.content ?? content },
        );
      };
      let result: unknown;
      try {
        result = l.onEditComment(commentId, content);
        if (!isThenable(result)) {
          settle(key, id, () => commit(result));
          return;
        }
        if (l.optimistic) {
          setPending((list) => [...list, { id, type: "edit", commentId, content }]);
        }
        const value = await result;
        removeOp(id);
        settle(key, id, () => commit(value));
      } catch (error) {
        removeOp(id);
        reportError(error, context);
        throw error;
      }
    },
    [accept, isPendingId, latest, removeOp, reportError, settle],
  );

  /**
   * Post a comment (or a reply under `parentId`). Resolves when it is accepted; rejects (after the
   * rollback and `onError`) so the composer keeps the text and shows the failure.
   */
  const post = useCallback(
    async (content: string, parentId?: string): Promise<void> => {
      const l = latest.current;
      const user = l.currentUser;
      if (!user) return;
      const clientId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${instanceId}-${++clientCounter.current}`;
      const tempId = `temp-${clientId}`;
      const temp: Comment = {
        id: tempId,
        clientId,
        author: { id: user.id, name: user.name, avatar: user.avatar },
        content,
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
        replies: [],
      };
      const id = ++seq.current;
      if (l.optimistic) setPending((list) => [...list, { id, type: "add", comment: temp, parentId }]);
      let result: Comment | void | undefined;
      try {
        result = await l.onAddComment?.(content, parentId, { clientId });
      } catch (error) {
        removeOp(id);
        reportError(error, { kind: "add", commentId: tempId, parentId });
        throw error;
      }
      removeOp(id);
      setLocalPosted((list) => [...list, clientId, ...(isComment(result) ? [result.id] : [])]);
      if (isComment(result)) {
        accept({ kind: "add", comment: result, parentId }, { kind: "added", comment: result, parentId });
      } else if (!latest.current.onAddComment) {
        // No handler: a local-only thread. The posted comment is a normal comment.
        accept({ kind: "add", comment: temp, parentId }, { kind: "added", comment: temp, parentId });
      } else if (!latest.current.controlled && latest.current.optimistic) {
        // Nothing came back: the pending comment stays (its actions off) until a delta or reset
        // brings the real one. Controlled, the prop is the truth, so nothing stays. If the
        // server's echo already landed (same client id), there is nothing left to keep.
        if (!hasClientId(work.current, clientId) && !containsId(work.current, tempId)) {
          accept({ kind: "add", comment: temp, parentId }, { kind: "added", comment: temp, parentId });
          setUnconfirmed((list) => [...list, tempId]);
        }
      }
    },
    [accept, instanceId, latest, removeOp, reportError, work],
  );

  // ─── Realtime ──────────────────────────────────────────────────────────────

  const applyDelta = useCallback(
    (delta: CommentDelta) => {
      const l = latest.current;
      let d = delta;
      if (d.kind === "removed" && l.tombstoneOnRemove) {
        d = { kind: "state", commentId: d.commentId, state: "removed" };
      }
      if (d.kind === "added" && d.parentId && !containsId(work.current, d.parentId)) {
        l.warnOnce(
          "unknown-parent",
          `CommentThread: an "added" delta names parentId "${d.parentId}", which is not in the thread. The comment was dropped.`,
        );
        return;
      }
      accept({ kind: "subscribe-delta", delta: d }, { kind: "delta", delta: d });
    },
    [accept, latest, work],
  );

  const subscribe = opts.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    return subscribe((delta) => {
      callHost("onSubscribeDelta", () => latest.current.onSubscribeDelta?.(delta));
      applyDelta(delta);
    });
  }, [subscribe, applyDelta, latest, callHost]);

  /** Handle `dispatch` / `reset`: applied (uncontrolled) or reported (controlled). */
  const dispatch = useCallback(
    (action: CommentLocalAction) => accept(action, { kind: "dispatch", action }),
    [accept],
  );

  return {
    controlled,
    comments: shown,
    pendingMap,
    like,
    react,
    remove,
    edit,
    post,
    accept,
    dispatch,
    reportError,
    localPosted,
    work,
    isPending: isPendingId,
  };
}
