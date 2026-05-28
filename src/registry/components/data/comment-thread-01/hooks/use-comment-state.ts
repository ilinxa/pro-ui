"use client";

import { useEffect, useReducer, useRef } from "react";
import type {
  Comment,
  CommentDelta,
  CommentLocalAction,
  Subscribe,
} from "../types";

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
        next.push({ ...c, replies });
        continue;
      }
    }
    next.push(c);
  }
  return mutated ? next : tree;
}

function insertReply(
  tree: Comment[],
  parentId: string,
  comment: Comment,
): Comment[] {
  return findAndPatch(
    tree,
    (c) => c.id === parentId,
    (c) => ({ ...c, replies: [...(c.replies ?? []), comment] }),
  );
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

/** Pure reducer — exported for hosts driving their own state. */
export function commentReducer(
  state: Comment[],
  action: CommentLocalAction,
): Comment[] {
  switch (action.kind) {
    case "add":
      if (action.parentId) {
        return insertReply(state, action.parentId, action.comment);
      }
      // Head insertion for top-level (newest first; pairs with load-older at bottom).
      return [action.comment, ...state];

    case "swap-temp":
      return findAndPatch(
        state,
        (c) => c.id === action.tempId,
        () => action.real,
      );

    case "remove":
      return pruneById(state, action.commentId);

    case "like-toggle":
      return findAndPatch(
        state,
        (c) => c.id === action.commentId,
        (c) => {
          if (c.isLiked === action.nextLiked) return c; // idempotent
          return {
            ...c,
            isLiked: action.nextLiked,
            likes: action.nextLiked
              ? c.likes + 1
              : Math.max(0, c.likes - 1),
          };
        },
      );

    case "patch-content":
      return findAndPatch(
        state,
        (c) => c.id === action.commentId,
        (c) => ({ ...c, content: action.content }),
      );

    case "subscribe-delta": {
      const d = action.delta;
      switch (d.kind) {
        case "added":
          return d.parentId
            ? insertReply(state, d.parentId, d.comment)
            : [d.comment, ...state];
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
      }
      return state;
    }

    case "append-page":
      return [...state, ...action.comments];

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
 * ONLY on `subscribe` identity change — same shape as engagement-bar-01.
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
