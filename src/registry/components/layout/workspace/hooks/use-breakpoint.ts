"use client";

import { useEffect, useRef, useState } from "react";
import type { Breakpoint } from "../types";

export function useBreakpoint(
  rootRef: React.RefObject<HTMLElement | null>,
  breakpoints: { mobile: number; tablet: number },
  debounceMs = 100,
): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const compute = (width: number): Breakpoint => {
      if (width < breakpoints.mobile) return "mobile";
      if (width < breakpoints.tablet) return "tablet";
      return "desktop";
    };

    const measure = () => {
      const width = el.clientWidth;
      setBreakpoint(compute(width));
    };

    measure();

    const observer = new ResizeObserver(() => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(measure, debounceMs);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [rootRef, breakpoints.mobile, breakpoints.tablet, debounceMs]);

  return breakpoint;
}
