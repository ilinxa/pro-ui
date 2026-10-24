"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Auto-hide for the control overlay (VP6). Always visible while paused, with auto-hide disabled
 * (`autoHideMs <= 0`), under reduced motion, or while `pinned` (keyboard focus inside the
 * controls, an open menu) — a keyboard user never ends up acting on an invisible control.
 * While playing, `wake()` (pointer movement, a tap, focus or a key anywhere in the player) shows
 * the controls and re-arms the timer. Every play / pause transition shows them again.
 *
 * The timer lives in a ref: `wake()` at pointer-event rate re-renders only when the controls
 * were actually hidden.
 */
export function useControlsVisibility(
  isPlaying: boolean,
  autoHideMs: number,
  reducedMotion: boolean,
  pinned: boolean,
) {
  const alwaysVisible = !isPlaying || autoHideMs <= 0 || reducedMotion || pinned;
  const [hidden, setHidden] = useState(false);
  const [lastPlaying, setLastPlaying] = useState(isPlaying);
  if (lastPlaying !== isPlaying) {
    setLastPlaying(isPlaying);
    setHidden(false);
  }

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armRef = useRef<() => void>(() => {});

  useEffect(() => {
    const clear = () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
    armRef.current = alwaysVisible
      ? clear
      : () => {
          clear();
          timerRef.current = setTimeout(() => setHidden(true), autoHideMs);
        };
    armRef.current();
    return clear;
  }, [alwaysVisible, autoHideMs, isPlaying]);

  const wake = useCallback(() => {
    setHidden(false);
    armRef.current();
  }, []);

  return { visible: alwaysVisible || !hidden, wake };
}
