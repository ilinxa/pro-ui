import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";

const MINUTE_MS = 60_000;

/**
 * "Now" for relative times, safe for server rendering.
 * - `nowProp` given: returned as is, no timer.
 * - Otherwise `null` while rendering on the server and on the first client render (the caller
 *   prints no relative text, so the two agree), then the clock read right after mount and again
 *   every 60 s. Re-rendering never reads the clock: the value only moves on the tick.
 */
export function useNow(nowProp: Date | undefined): Date | null {
  const hasNowProp = nowProp !== undefined;
  const clock = useRef<number | null>(null);
  const subscribe = useCallback(
    (notify: () => void) => {
      if (hasNowProp) return () => {};
      clock.current = Date.now();
      const id = setInterval(() => {
        clock.current = Date.now();
        notify();
      }, MINUTE_MS);
      return () => clearInterval(id);
    },
    [hasNowProp],
  );
  const read = useCallback((): number | null => clock.current, []);
  const readServer = useCallback((): number | null => null, []);
  const ms = useSyncExternalStore(subscribe, read, readServer);
  return useMemo(() => nowProp ?? (ms === null ? null : new Date(ms)), [nowProp, ms]);
}
