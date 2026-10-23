import { useCallback, useRef } from "react";
import type { MouseEvent } from "react";

export interface UseDoubleTapOptions {
  /** Time window in ms within which a second tap counts as a double-tap. Default: 300. */
  windowMs?: number;
}

const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, [role="button"], [role="slider"]';

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
 * within `windowMs` of each other. Single-tap is silent. After firing, the
 * timestamp resets so a triple-tap doesn't fire again.
 *
 * Clicks whose target is inside an interactive control (button, a, input,
 * select, textarea, `[role="button"]`, `[role="slider"]`) are ignored: they
 * neither fire nor arm the double-tap window, so two quick taps on a control
 * never read as a "like".
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

  return useCallback(
    // `event` is optional so the handler can still be called manually (`tap()`).
    (event?: MouseEvent<HTMLElement>) => {
      if (!onDoubleTap) return;
      if (event && isFromInteractiveControl(event)) return;
      const now = performance.now();
      if (now - lastTapRef.current < windowMs) {
        onDoubleTap();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    },
    [onDoubleTap, windowMs],
  );
}
