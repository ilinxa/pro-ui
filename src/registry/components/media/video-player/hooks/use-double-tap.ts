import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent } from "react";

export interface UseDoubleTapOptions {
  /** Time window in ms within which a second tap counts as a double-tap. Default: 300. */
  windowMs?: number;
  /**
   * Called for a tap that turned out NOT to be a double tap — `windowMs` after it, once no second
   * tap came. Without it, a single tap is silent (the pre-0.3 behaviour, unchanged).
   */
  onSingleTap?: () => void;
}

const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, [role="button"], [role="slider"], [role="menuitemradio"]';

/**
 * True when the event target sits inside an interactive control that lives
 * between the handler's element (`currentTarget`) and the target itself.
 */
function isFromInteractiveControl(event: MouseEvent<HTMLElement>): boolean {
  const target = event.target;
  const boundary = event.currentTarget;
  if (!(target instanceof Element) || !boundary) return false;
  const control = target.closest(INTERACTIVE_SELECTOR);
  return control !== null && control !== boundary && boundary.contains(control);
}

/**
 * Returns a click handler that fires `onDoubleTap` only when invoked twice
 * within `windowMs` of each other. Single-tap is silent unless `onSingleTap` is
 * given, in which case it fires once the window passes without a second tap.
 * After firing, the timestamp resets so a triple-tap doesn't fire again.
 *
 * Clicks whose target is inside an interactive control (button, a, input,
 * select, textarea, `[role="button"]`, `[role="slider"]`, `[role="menuitemradio"]`)
 * are ignored: they neither fire nor arm the double-tap window, so two quick
 * taps on a control never read as a "like".
 *
 * Reusable outside `<video>` contexts — image double-tap-to-like, card
 * double-tap-to-favorite, etc.
 */
export function useDoubleTap(
  onDoubleTap: (() => void) | undefined,
  options?: UseDoubleTapOptions,
): React.MouseEventHandler<HTMLElement> {
  // -Infinity, not 0: `performance.now()` starts at 0, so a first tap within `windowMs` of page
  // load would otherwise read as the second half of a double tap.
  const lastTapRef = useRef(Number.NEGATIVE_INFINITY);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowMs = options?.windowMs ?? 300;
  const onSingleTapRef = useRef(options?.onSingleTap);
  useEffect(() => {
    onSingleTapRef.current = options?.onSingleTap;
  });
  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback(
    // `event` is optional so the handler can still be called manually (`tap()`).
    (event?: MouseEvent<HTMLElement>) => {
      if (!onDoubleTap) return;
      if (event && isFromInteractiveControl(event)) return;
      const now = performance.now();
      if (now - lastTapRef.current < windowMs) {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        onDoubleTap();
        lastTapRef.current = Number.NEGATIVE_INFINITY;
      } else {
        lastTapRef.current = now;
        if (onSingleTapRef.current) {
          if (timerRef.current !== null) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            onSingleTapRef.current?.();
          }, windowMs);
        }
      }
    },
    [onDoubleTap, windowMs],
  );
}
