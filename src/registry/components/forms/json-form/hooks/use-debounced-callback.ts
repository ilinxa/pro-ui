"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Returns a debounced version of `fn` that delays invocation by `delay` ms.
 * Hand-rolled — avoiding `use-debounce` npm dep for ~15 lines of logic.
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number,
): (...args: TArgs) => void {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest fn reference without re-creating the debounced wrapper.
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  // Clear on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useMemo(() => {
    return (...args: TArgs) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (delay <= 0) {
        fnRef.current(...args);
        return;
      }
      timerRef.current = setTimeout(() => {
        fnRef.current(...args);
      }, delay);
    };
  }, [delay]);
}
