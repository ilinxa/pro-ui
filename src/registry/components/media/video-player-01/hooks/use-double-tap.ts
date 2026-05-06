import { useCallback, useRef } from "react";

export interface UseDoubleTapOptions {
  /** Time window in ms within which a second tap counts as a double-tap. Default: 300. */
  windowMs?: number;
}

/**
 * Returns a click handler that fires `onDoubleTap` only when invoked twice
 * within `windowMs` of each other. Single-tap is silent. After firing, the
 * timestamp resets so a triple-tap doesn't fire again.
 *
 * Reusable outside `<video>` contexts — image double-tap-to-like, card
 * double-tap-to-favorite, etc.
 */
export function useDoubleTap(
  onDoubleTap: (() => void) | undefined,
  options?: UseDoubleTapOptions,
): React.MouseEventHandler<HTMLElement> {
  const lastTapRef = useRef(0);
  const windowMs = options?.windowMs ?? 300;

  return useCallback(() => {
    if (!onDoubleTap) return;
    const now = Date.now();
    if (now - lastTapRef.current < windowMs) {
      onDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onDoubleTap, windowMs]);
}
