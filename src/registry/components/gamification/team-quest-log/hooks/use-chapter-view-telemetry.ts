"use client";

import * as React from "react";

import type { GamificationEvent } from "../types";

/**
 * Visibility-based `narrative.chapter-viewed` telemetry (LOCK — D-A3). ONE
 * IntersectionObserver over all beat nodes (not one per beat), threshold 0.5;
 * **fire-once per `chapterId` per mount** via a ref Set (re-render / re-entry /
 * scroll-back never re-emit). SSR/jsdom-safe (observer built in an effect,
 * guarded on `typeof IntersectionObserver`). No `onEvent` → no observer.
 *
 * Returns a `containerRef` to place on the rail wrapper (beat nodes are found by
 * `[data-chapter-id]` within it) + a `fireForChapter(id)` fallback the click
 * path calls when IO is unavailable (still fire-once via the same Set).
 */
export function useChapterViewTelemetry(args: {
  teamId: string;
  /** A stable key of the current chapter ids — re-observes when the beat set changes. */
  chapterKey: string;
  onEvent?: (event: GamificationEvent) => void;
}): {
  containerRef: React.RefObject<HTMLDivElement | null>;
  fireForChapter: (chapterId: string) => void;
} {
  const { teamId, chapterKey, onEvent } = args;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const firedRef = React.useRef<Set<string>>(new Set());
  const onEventRef = React.useRef(onEvent);
  React.useEffect(() => {
    onEventRef.current = onEvent;
  });

  const emit = React.useCallback(
    (chapterId: string) => {
      if (firedRef.current.has(chapterId)) return;
      firedRef.current.add(chapterId);
      onEventRef.current?.({
        type: "narrative.chapter-viewed",
        teamId,
        chapterId,
      });
    },
    [teamId],
  );

  const hasHandler = Boolean(onEvent);

  React.useEffect(() => {
    if (!hasHandler) return;
    const container = containerRef.current;
    if (!container) return;
    // IO unavailable (SSR snapshot / jsdom / ancient) → the click fallback covers it.
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.chapterId;
          if (id) emit(id);
        }
      },
      { threshold: 0.5 },
    );

    const nodes = container.querySelectorAll<HTMLElement>("[data-chapter-id]");
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
    // `chapterKey` re-runs the effect when beats are added/removed.
  }, [hasHandler, emit, chapterKey]);

  return { containerRef, fireForChapter: emit };
}
