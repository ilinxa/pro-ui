"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type Direction = "ltr" | "rtl";

/**
 * Resolves text direction (consumer contract C4 / R6): the `dir` prop wins; otherwise the
 * element's direction, read after mount — the computed `direction`, or the nearest explicit
 * non-`auto` `[dir]` ancestor (jsdom has no UA stylesheet for `dir`); otherwise `"ltr"`.
 *
 * The server render and the first client render both return the prop or `"ltr"`, so markup
 * must not depend on the resolved value before mount. Key handling, swipe, carousel and
 * transition logic may. A later direction change is not observed — pass `dir` if the app
 * switches direction at runtime without remounting.
 *
 * Directional props take `"start" | "end"`; physical values stay only as deprecated aliases.
 * Copy into a component's `hooks/`. Canonical copy: `_template/_snippets/` (tests next to it).
 */
export function useDirection(
  ref: React.RefObject<HTMLElement | null>,
  dirProp?: Direction,
): Direction {
  const [resolved, setResolved] = useState<Direction>("ltr");
  useIsoLayoutEffect(() => {
    if (dirProp) return;
    const el = ref.current;
    if (!el) return;
    const explicit = el.closest('[dir]:not([dir="auto"])')?.getAttribute("dir")?.toLowerCase();
    const rtl = getComputedStyle(el).direction === "rtl" || explicit === "rtl";
    setResolved(rtl ? "rtl" : "ltr");
  }, [dirProp, ref]);
  return dirProp ?? resolved;
}
