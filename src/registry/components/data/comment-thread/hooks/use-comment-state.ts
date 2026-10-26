"use client";

import { useEffect, useReducer, useRef } from "react";
import type {
  Comment,
  CommentDelta,
  CommentLocalAction,
  Subscribe,
} from "../types";
import { containsId, hasClientId } from "../lib/tree";

// ─── Pure tree-walk helpers ──────────────────────────────────────────────────

function findAndPatch(
  tree: Comment[],
  predicate: (c: Comment) => boolean,
  patch: (c: Comment) => Comment,
): Comment[] {
  let mutated = false;
  const next = tree.map((c) => {
    if (predicate(c)) {
      const patched = patch(c);
      if (patched !== c) mutated = true;
      return patched;
    }
    if (c.replies && c.replies.length > 0) {
      const replies = findAndPatch(c.replies, predicate, patch);
      if (replies !== c.replies) {
        mutated = true;
        return { ...c, replies };
      }
    }
    return c;
  });
  return mutated ? next : tree;
}

function pruneById(tree: Comment[], id: string): Comment[] {
  let mutated = false;
  const next: Comment[] = [];
  for (const c of tree) {
    if (c.id === id) {
      mutated = true;
      continue;
    }
    if (c.replies && c.replies.length > 0) {
      const replies = pruneById(c.replies, id);
      if (replies !== c.replies) {
        mutated = true;
        const removed = c.replies.length - replies.length;
        next.push({
          ...c,
          replies,
          ...(c.replyCount !== undefined && removed > 0
            ? { replyCount: Math.max(replies.length, c.replyCount - removed) }
            : {}),
        });
        continue;
      }
    }
    next.push(c);
  }
  return mutated ? next : tree;
}

/** A parent's `replyCount` (when it has one) after its replies grew by `added`: never below what is loaded. */
function withReplyCount(c: Comment, replies: Comment[], added: number): Comment {
  return {
    ...c,
    replies,
    ...(c.replyCount !== undefined
      ? { replyCount: Math.max(replies.length, c.replyCount + added) }
      : {}),
  };
}

function insertReply(
  tree: Comment[],
  parentId: string,
  comment: Comment,
): Comment[] {
  return findAndPatch(
    tree,
    (c) => c.id === parentId,
    (c) => withReplyCount(c, [...(c.replies ?? []), comment], 1),
  );
}

/** The comments of `incoming` that are not in `tree` yet (also drops duplicates inside `incoming`). */
function fresh(tree: Comment[], incoming: Comment[]): Comment[] {
  const seen = new Set<string>();
  const out: Comment[] = [];
  for (const c of incoming) {
    if (seen.has(c.id) || containsId(tree, c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

/** `real` takes the place of `previous`, keeping the replies `previous` collected. */
function takePlace(previous: Comment, real: Comment): Comment {
  const replies =
    real.replies && real.replies.length > 0 ? real.replies : previous.replies ?? real.replies;
  return replies === real.replies ? real : { ...real, replies };
}

function insertAt<T>(list: T[], item: T, index: number): T[] {
  const at = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, at), item, ...list.slice(at)];
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

/**
 * Pure reducer — exported for hosts driving their own state. Idempotent: adding, appending or
 * delivering a comment whose id is already in the tree changes nothing (the same array comes
 * back), so a server echo of your own post can never produce a second copy.
 */
export function commentReducer(
  state: Comment[],
  action: CommentLocalAction,
): Comment[] {
  switch (action.kind) {
    case "add":
      if (containsId(state, action.comment.id)) return state;
      if (action.parentId) {
        return insertReply(state, action.parentId, action.comment);
      }
      // Head insertion for top-level (newest first; pairs with load-older at bottom).
      return [action.comment, ...state];

    case "swap-temp": {
      // The echo of your own post won the race: the real comment is already here.
      if (action.real.id !== action.tempId && containsId(state, action.real.id)) {
        return pruneById(state, action.tempId);
      }
      return findAndPatch(
        state,
        (c) => c.id === action.tempId,
        (c) => takePlace(c, action.real),
      );
    }

    case "remove":
      return pruneById(state, action.commentId);

    case "like-toggle":
      return findAndPatch(
        state,
        (c) => c.id === action.commentId,
        (c) => {
          if ((c.isLiked ?? false) === action.nextLiked) return c; // idempotent
          return {
            ...c,
            isLiked: action.nextLiked,
            likes:
              c.likes === null
                ? null
                : action.nextLiked
                  ? c.likes + 1
                  : Math.max(0, c.likes - 1),
          };
        },
      );

    case "like-set":
      return findAndPatch(
        state,
        (c) => c.id === action.commentId,
        (c) =>
          c.isLiked === action.liked && c.likes === action.likes
            ? c
            : { ...c, isLiked: action.liked, likes: action.likes },
      );

    case "patch-content":
      return findAndPatch(
        state,
        (c) => c.id === action.commentId,
        (c) => ({ ...c, content: action.content }),
      );

    case "patch":
      return findAndPatch(
        state,
        (c) => c.id === action.commentId,
        (c) => ({ ...c, ...action.patch, id: c.id, replies: c.replies }),
      );

    case "restore": {
      if (containsId(state, action.comment.id)) return state;
      if (!action.parentId) return insertAt(state, action.comment, action.index);
      return findAndPatch(
        state,
        (c) => c.id === action.parentId,
        (c) => withReplyCount(c, insertAt(c.replies ?? [], action.comment, action.index), 1),
      );
    }

    case "append-replies": {
      const incoming = fresh(state, action.comments);
      if (incoming.length === 0) return state;
      return findAndPatch(
        state,
        (c) => c.id === action.parentId,
        (c) => withReplyCount(c, [...(c.replies ?? []), ...incoming], 0),
      );
    }

    case "subscribe-delta": {
      const d = action.delta;
      switch (d.kind) {
        case "added": {
          if (containsId(state, d.comment.id)) return state;
          // Your own post echoed back before `onAddComment` resolved: it replaces the pending
          // comment that carries the same client id instead of becoming a second copy.
          const clientId = d.comment.clientId;
          if (clientId !== undefined && hasClientId(state, clientId)) {
            return findAndPatch(
              state,
              (c) => c.clientId === clientId,
              (c) => takePlace(c, d.comment),
            );
          }
          return d.parentId
            ? insertReply(state, d.parentId, d.comment)
            : [d.comment, ...state];
        }
        case "edited":
          return findAndPatch(
            state,
            (c) => c.id === d.commentId,
            (c) => ({ ...c, content: d.content, edited: true }),
          );
        case "removed":
          return pruneById(state, d.commentId);
        case "liked":
          return findAndPatch(
            state,
            (c) => c.id === d.commentId,
            (c) => ({ ...c, isLiked: d.liked, likes: d.count }),
          );
        case "state":
          return findAndPatch(
            state,
            (c) => c.id === d.commentId,
            (c) => (c.state === d.state ? c : { ...c, state: d.state }),
          );
        case "reacted":
          return findAndPatch(
            state,
            (c) => c.id === d.commentId,
            (c) => ({ ...c, reactions: d.reactions }),
          );
      }
      return state;
    }

    case "append-page": {
      const incoming = fresh(state, action.comments);
      return incoming.length === 0 ? state : [...state, ...incoming];
    }

    case "reset":
      return action.next;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseCommentStateOptions {
  /** Captured ON MOUNT only — subsequent prop changes are ignored. */
  initialComments: Comment[];
  subscribe?: Subscribe<CommentDelta>;
  onSubscribeDelta?: (delta: CommentDelta) => void;
}

export interface UseCommentStateResult {
  comments: Comment[];
  dispatch: React.Dispatch<CommentLocalAction>;
}

/**
 * Wires:
 *  - useReducer over commentReducer
 *  - subscription effect that fires onSubscribeDelta and patches state
 *
 * onSubscribeDelta is mirrored to a ref so the subscription effect re-runs
 * ONLY on `subscribe` identity change — same shape as engagement-bar.
 */
export function useCommentState(
  opts: UseCommentStateOptions,
): UseCommentStateResult {
  const [comments, dispatch] = useReducer(
    commentReducer,
    opts.initialComments,
  );

  const onSubscribeDeltaRef = useRef(opts.onSubscribeDelta);
  useEffect(() => {
    onSubscribeDeltaRef.current = opts.onSubscribeDelta;
  });

  const subscribe = opts.subscribe;
  useEffect(() => {
    if (!subscribe) return;
    const unsub = subscribe((delta) => {
      onSubscribeDeltaRef.current?.(delta);
      dispatch({ kind: "subscribe-delta", delta });
    });
    return unsub;
  }, [subscribe]);

  return { comments, dispatch };
}
