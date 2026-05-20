import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable-identity debounced wrapper around `fn`. The wrapper
 * collapses bursts of calls into one trailing-edge invocation after `ms`
 * milliseconds of silence. Cancels any pending invocation on unmount.
 *
 * Used by the search input (200ms per Q-P4).
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  ms: number,
): (...args: TArgs) => void {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: TArgs) => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current(...args);
      }, ms);
    },
    [ms],
  );
}
