"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type Direction = "ltr" | "rtl";

/**
 * Resolves text direction (consumer contract C4): the `dir` prop wins; otherwise the
 * element's direction, read after mount — the computed `direction`, or the nearest explicit
 * non-`auto` `[dir]` ancestor (jsdom has no UA stylesheet for `dir`); otherwise `"ltr"`.
 *
 * Element variant of the canonical `_template/_snippets/use-direction.ts`: it takes the node
 * itself (held in state by the caller), so it re-resolves when the node mounts or changes.
 * The server render and the first client render return the prop or `"ltr"`, so markup that
 * is server-rendered must not depend on the resolved value before mount.
 */
export function useDirection(node: HTMLElement | null, dirProp?: Direction): Direction {
  const [resolved, setResolved] = useState<Direction>("ltr");
  useIsoLayoutEffect(() => {
    if (dirProp || !node) return;
    const explicit = node.closest('[dir]:not([dir="auto"])')?.getAttribute("dir")?.toLowerCase();
    const rtl = getComputedStyle(node).direction === "rtl" || explicit === "rtl";
    setResolved(rtl ? "rtl" : "ltr");
  }, [dirProp, node]);
  return dirProp ?? resolved;
}
