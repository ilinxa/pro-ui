"use client";

import { useCallback, useEffect, useRef } from "react";

export interface UseLongPressPauseOptions {
  isOpen: boolean;
  /**
   * Hold duration in ms before pause kicks in. Default 200 — matches the
   * Instagram-feel mobile gesture. Tunable via
   * {@link StoryViewer01Props.longPressThresholdMs}.
   */
  longPressThresholdMs?: number;
  onPause: () => void;
  onResume: () => void;
}

/**
 * v0.2.0 — additive long-press-to-pause gesture (Instagram-canonical mobile
 * pattern). Coexists with v0.1 middle-tap-pause (TapZones middle column) —
 * long-press is the primary mobile gesture; tap-to-pause stays as desktop
 * fallback (Q-V8 lock).
 *
 * Behavior: pointerdown starts a timer; if held past
 * `longPressThresholdMs`, `onPause()` fires + the press is marked active.
 * On pointerup (or pointercancel), if the press WAS active, `onResume()`
 * fires; if not yet active (released early), the timer is cleared without
 * pausing — so short taps continue to flow through TapZones normally.
 *
 * Wire onto the outer wrapping `<div>` of the viewer. Returns three handlers
 * to be spread as `onPointerDown` / `onPointerUp` / `onPointerCancel`. The
 * hook does NOT call `preventDefault` — TapZones' click handlers still fire
 * for short taps, preserving v0.1 single-tap-pause behavior.
 */
export function useLongPressPause(opts: UseLongPressPauseOptions) {
  const { isOpen, longPressThresholdMs = 200, onPause, onResume } = opts;
  const timerRef = useRef<number | null>(null);
  const isPressingRef = useRef(false);

  // Refs-mirror so the handlers are stable identity across renders.
  const onPauseRef = useRef(onPause);
  const onResumeRef = useRef(onResume);
  useEffect(() => {
    onPauseRef.current = onPause;
    onResumeRef.current = onResume;
  });

  const handlePointerDown = useCallback(() => {
    if (!isOpen) return;
    if (timerRef.current != null) return;
    timerRef.current = window.setTimeout(() => {
      isPressingRef.current = true;
      onPauseRef.current();
    }, longPressThresholdMs);
  }, [isOpen, longPressThresholdMs]);

  const handlePointerUp = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isPressingRef.current) {
      isPressingRef.current = false;
      onResumeRef.current();
    }
  }, []);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
    },
    [],
  );

  return {
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel: handlePointerUp,
  };
}
