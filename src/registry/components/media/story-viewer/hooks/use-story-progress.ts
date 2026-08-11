"use client";

import { useEffect, useRef, useState } from "react";

export interface UseStoryProgressOptions {
  /** Viewer is mounted-and-open. When false, timer is fully stopped. */
  isOpen: boolean;
  /** When true, the timer pauses but accumulator is preserved (resume continues from same %). */
  isPaused: boolean;
  /** Compound key — typically `${storyId}:${itemId}`. Any change resets the accumulator. */
  itemKey: string;
  /** Total item duration in milliseconds. */
  itemDurationMs: number;
  /** Fires once when progress reaches 100. */
  onComplete: () => void;
  /** Tick interval. Default 50ms. */
  tickMs?: number;
}

/**
 * Accumulator-based story progress timer.
 *
 * Tracks an `accumulatedMs` accumulator across pause/resume cycles so users
 * can pause for arbitrary durations without losing playback position.
 * Naive `Date.now() - startTime` recomputes (kasder's original pattern) silently
 * advance ~50ms per pause/resume cycle. Switched to `performance.now()` here
 * for monotonic clock + immunity to NTP / DST jumps.
 */
export function useStoryProgress({
  isOpen,
  isPaused,
  itemKey,
  itemDurationMs,
  onComplete,
  tickMs = 50,
}: UseStoryProgressOptions) {
  const [progress, setProgress] = useState(0);
  const [renderedItemKey, setRenderedItemKey] = useState(itemKey);
  const accumulatedRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // Reset on item change — React 19 pattern: setState during render when
  // a derivable prop changes. Refs get reset in the effect below.
  if (renderedItemKey !== itemKey) {
    setRenderedItemKey(itemKey);
    setProgress(0);
  }

  // Refs reset on item change — runs before the timer effect (declaration order).
  useEffect(() => {
    accumulatedRef.current = 0;
    completedRef.current = false;
  }, [itemKey]);

  useEffect(() => {
    if (!isOpen) {
      // Fully stop on close.
      accumulatedRef.current = 0;
      startTimeRef.current = null;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (isPaused) {
      // Snapshot elapsed into accumulator + clear interval.
      if (startTimeRef.current !== null) {
        accumulatedRef.current += performance.now() - startTimeRef.current;
        startTimeRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Run.
    startTimeRef.current = performance.now();
    intervalRef.current = setInterval(() => {
      const startedAt = startTimeRef.current;
      if (startedAt === null) return;
      const elapsed = performance.now() - startedAt + accumulatedRef.current;
      const pct = Math.min((elapsed / itemDurationMs) * 100, 100);
      setProgress(pct);
      if (pct >= 100 && !completedRef.current) {
        completedRef.current = true;
        accumulatedRef.current = 0;
        startTimeRef.current = null;
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onCompleteRef.current();
      }
    }, tickMs);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen, isPaused, itemKey, itemDurationMs, tickMs]);

  return progress;
}
