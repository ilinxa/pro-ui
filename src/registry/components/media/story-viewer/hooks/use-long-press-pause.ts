"use client";

import { useCallback, useEffect, useRef } from "react";

export interface UseLongPressPauseOptions {
  isOpen: boolean;
  /**
   * Hold duration in ms before pause kicks in. Default 200 — matches the
   * Instagram-feel mobile gesture. Tunable via
   * {@link StoryViewerProps.longPressThresholdMs}.
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

  // 0.6.2 - while a press is in flight, a release / cancel / blur ANYWHERE ends it, so a hold
  // released outside the card (or lost to an alt-tab) can never leave the story paused.
  const detachRef = useRef<(() => void) | null>(null);
  const endPressRef = useRef<() => boolean>(() => false);

  /**
   * Ends the press. Returns `true` when the release ended an ACTIVE long
   * press (the pause had fired) — the caller swallows the click that the
   * browser fires after that pointerup, so releasing never also taps a zone.
   */
  const handlePointerUp = useCallback((): boolean => {
    detachRef.current?.();
    detachRef.current = null;
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isPressingRef.current) {
      isPressingRef.current = false;
      onResumeRef.current();
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    endPressRef.current = handlePointerUp;
  }, [handlePointerUp]);

  const handlePointerDown = useCallback(() => {
    if (!isOpen) return;
    if (timerRef.current != null) return;
    timerRef.current = window.setTimeout(() => {
      isPressingRef.current = true;
      onPauseRef.current();
    }, longPressThresholdMs);
    const end = () => {
      endPressRef.current();
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", end);
    detachRef.current = () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", end);
    };
  }, [isOpen, longPressThresholdMs]);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
      detachRef.current?.();
      detachRef.current = null;
    },
    [],
  );

  return {
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel: handlePointerUp,
  };
}
