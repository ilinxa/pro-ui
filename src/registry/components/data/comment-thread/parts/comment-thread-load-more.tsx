"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CommentThreadLoadMoreProps } from "../types";
import { useThreadRoot } from "./thread-root-context";
import { useScrollAreaElement } from "./comment-thread-scroll-area";

/** "Load older comments": a button, optionally also loading when it nears the scroll container. */
export function CommentThreadLoadMore({
  mode = "button",
  rootMargin = "0px 0px 200px 0px",
  scrollRoot,
  className,
}: CommentThreadLoadMoreProps) {
  const { size, registerLoadMoreButton, beginLoadMoreFocus, state } = useThreadRoot("CommentThreadLoadMore");
  const { hasMore, loadingMore, loadMoreFailed, loadMore, labels, comments } = state;
  const shownCount = comments.length;
  const scrollArea = useScrollAreaElement();
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  // Re-created when a load ends, so a page that leaves the sentinel visible loads the next one.
  // A failed page is never retried here: the Retry button is.
  const watchRoot = scrollArea ? scrollArea.el : (scrollRoot ?? null);
  const waitingForScrollArea = !!scrollArea && !scrollArea.el;
  const auto = mode === "auto";
  // Auto-loading fires once per shown-comment count: a page the host has not applied yet (the
  // sentinel is still visible) or one that adds no visible rows must not be requested again. The
  // button (which also records its press here) is the way past that.
  const firedAtCount = useRef<number | null>(null);
  useEffect(() => {
    if (!hasMore) firedAtCount.current = null;
  }, [hasMore]);
  useEffect(() => {
    if (!auto || !el || waitingForScrollArea || !hasMore || loadingMore || loadMoreFailed) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || firedAtCount.current === shownCount) return;
        firedAtCount.current = shownCount;
        loadMore();
      },
      { root: watchRoot, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [auto, el, waitingForScrollArea, hasMore, loadingMore, loadMoreFailed, loadMore, watchRoot, rootMargin, shownCount]);

  if (!hasMore) return null;
  return (
    <div ref={setEl} className={cn("flex flex-col items-center gap-1 self-center", className)}>
      {auto ? (
        <span role="status" aria-live="polite" className="sr-only">
          {loadingMore ? labels.loadingMore : null}
        </span>
      ) : null}
      {loadMoreFailed ? (
        <p role="alert" className="text-xs text-destructive">
          {labels.loadFailed}
        </p>
      ) : null}
      <button
        ref={registerLoadMoreButton}
        type="button"
        onClick={() => {
          firedAtCount.current = shownCount;
          beginLoadMoreFocus();
          loadMore();
        }}
        // aria-disabled, not disabled: a focused button that turns disabled drops focus to <body>.
        aria-disabled={loadingMore || undefined}
        aria-busy={loadingMore || undefined}
        className={cn(
          "rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground aria-disabled:opacity-50",
          size === "touch" && "inline-flex min-h-11 min-w-11 items-center justify-center",
        )}
      >
        {loadingMore ? labels.loadingMore : loadMoreFailed ? labels.retry : labels.loadMore}
      </button>
    </div>
  );
}
