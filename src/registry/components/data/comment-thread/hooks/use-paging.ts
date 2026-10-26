"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type {
  Comment,
  CommentErrorContext,
  CommentLocalAction,
  CommentPage,
  CommentsChange,
} from "../types";
import { findComment } from "../lib/tree";

/** Loading state of one comment's replies. Absent = nothing requested yet. */
export interface ReplyLoad {
  loading: boolean;
  failed: boolean;
  /** Cursor for the next page. */
  cursor: string | null;
  /** Are more replies waiting on the server? */
  hasMore: boolean;
  /** The comment's `repliesCursor` when this was recorded; a different one makes it stale. */
  seed: string | null;
}

export interface UsePagingOptions {
  /** The shown tree (for the top-level count and reply lookups). */
  comments: Comment[];
  /** Accept loaded items: applied (uncontrolled) or reported (controlled). */
  accept: (action: CommentLocalAction, change: CommentsChange) => void;
  reportError: (error: unknown, context: CommentErrorContext) => void;
  onLoadMore?: (page: number) => Promise<Comment[]>;
  onLoadMoreCursor?: (cursor: string | null) => Promise<CommentPage>;
  onLoadReplies?: (commentId: string, cursor: string | null) => Promise<CommentPage>;
  pageSize: number;
  hasMore?: boolean;
  nextCursor?: string | null;
  /** Comments the viewer posted in this session (or still pending): not counted by the legacy heuristic. */
  isLocal: (comment: Comment) => boolean;
}

/** Top-level paging ("Load more") and per-comment reply loading. All state lives in the thread instance. */
export function usePaging(opts: UsePagingOptions) {
  const latest = useRef(opts);
  useLayoutEffect(() => {
    latest.current = opts;
  });

  // ─── Top level ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const epoch = useRef(0);
  const loadingRef = useRef(false);
  const loadedRef = useRef<{ cursor: string | null; hasMore: boolean } | null>(null);
  const lastPageRef = useRef(1);
  const [lastPageFull, setLastPageFull] = useState(true);
  const [loaded, setLoaded] = useState<{ cursor: string | null; hasMore: boolean } | null>(null);

  const topCount = opts.comments.filter((c) => !opts.isLocal(c)).length;
  const loader = opts.onLoadMoreCursor ?? opts.onLoadMore;

  let hasMore: boolean;
  if (opts.hasMore !== undefined) hasMore = opts.hasMore;
  else if (opts.onLoadMoreCursor) {
    if (opts.nextCursor !== undefined) hasMore = opts.nextCursor !== null;
    else if (loaded) hasMore = loaded.hasMore;
    else hasMore = topCount >= opts.pageSize;
  } else hasMore = topCount >= opts.pageSize && lastPageFull;

  const loadMore = useCallback(async () => {
    const l = latest.current;
    if (loadingRef.current || !(l.onLoadMoreCursor ?? l.onLoadMore)) return;
    loadingRef.current = true;
    const started = epoch.current;
    setLoading(true);
    setFailed(false);
    try {
      if (l.onLoadMoreCursor) {
        const cursor = l.nextCursor !== undefined ? l.nextCursor : (loadedRef.current?.cursor ?? null);
        const page = await l.onLoadMoreCursor(cursor);
        if (started !== epoch.current) return; // a reset happened meanwhile: stale
        const items = page.items ?? [];
        l.accept({ kind: "append-page", comments: items }, { kind: "page", comments: items });
        const next = page.nextCursor ?? null;
        const state = { cursor: next, hasMore: page.hasMore ?? next !== null };
        loadedRef.current = state;
        setLoaded(state);
      } else if (l.onLoadMore) {
        const nextPage = lastPageRef.current + 1;
        const items = (await l.onLoadMore(nextPage)) ?? [];
        if (started !== epoch.current) return;
        l.accept({ kind: "append-page", comments: items }, { kind: "page", comments: items });
        lastPageRef.current = nextPage;
        setLastPageFull(items.length >= l.pageSize);
      }
    } catch (error) {
      if (started !== epoch.current) return;
      setFailed(true);
      l.reportError(error, { kind: "load-more" });
    } finally {
      if (started === epoch.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  // ─── Replies ────────────────────────────────────────────────────────────────
  const [replyLoads, setReplyLoads] = useState<Record<string, ReplyLoad>>({});
  const replyLoadsRef = useRef<Record<string, ReplyLoad>>({});
  const [inflight] = useState(() => new Set<string>());

  const loadReplies = useCallback(async (commentId: string) => {
    const l = latest.current;
    const fetchPage = l.onLoadReplies;
    if (!fetchPage || inflight.has(commentId)) return;
    inflight.add(commentId);
    const started = epoch.current;
    const comment = findComment(l.comments, commentId);
    const seed = comment?.repliesCursor ?? null;
    const found = replyLoadsRef.current[commentId];
    const previous = found && found.seed === seed ? found : undefined;
    const cursor = previous ? previous.cursor : seed;
    const set = (value: ReplyLoad) => {
      if (started !== epoch.current) return;
      replyLoadsRef.current = { ...replyLoadsRef.current, [commentId]: value };
      setReplyLoads(replyLoadsRef.current);
    };
    set({ loading: true, failed: false, cursor, hasMore: previous?.hasMore ?? true, seed });
    try {
      const page = await fetchPage(commentId, cursor);
      if (started !== epoch.current) return;
      const items = page.items ?? [];
      l.accept(
        { kind: "append-replies", parentId: commentId, comments: items },
        { kind: "replies", parentId: commentId, comments: items },
      );
      const next = page.nextCursor ?? null;
      set({ loading: false, failed: false, cursor: next, hasMore: page.hasMore ?? next !== null, seed });
    } catch (error) {
      set({ loading: false, failed: true, cursor, hasMore: previous?.hasMore ?? true, seed });
      if (started === epoch.current) l.reportError(error, { kind: "load-replies", commentId, parentId: commentId });
    } finally {
      if (started === epoch.current) inflight.delete(commentId);
    }
  }, [inflight]);

  /** The tree was replaced (handle.reset): forget paging and reply state, drop loads still in flight. */
  const reset = useCallback(() => {
    epoch.current++;
    loadingRef.current = false;
    loadedRef.current = null;
    lastPageRef.current = 1;
    inflight.clear();
    replyLoadsRef.current = {};
    setLoading(false);
    setFailed(false);
    setLastPageFull(true);
    setLoaded(null);
    setReplyLoads({});
  }, [inflight]);

  return {
    reset,
    hasMore: !!loader && hasMore,
    loadingMore: loading,
    loadMoreFailed: failed,
    loadMore,
    replyLoads,
    loadReplies,
  };
}
