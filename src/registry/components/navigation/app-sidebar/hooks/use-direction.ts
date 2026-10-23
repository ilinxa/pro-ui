"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Resolves the text direction: an explicit `dir` wins; otherwise the
 * element's computed `direction`, read after mount, so the server render and
 * the first client render agree on `"ltr"`. A nearest explicit, non-`auto`
 * `dir` attribute is a fallback for environments without a UA stylesheet for
 * `dir` (jsdom). A later direction change is not observed — pass `dir` when
 * your app switches direction at runtime without remounting.
 */
export function useDirection(
  ref: React.RefObject<HTMLElement | null>,
  dirProp: "ltr" | "rtl" | undefined,
): "ltr" | "rtl" {
  const [resolved, setResolved] = useState<"ltr" | "rtl">("ltr");
  useIsoLayoutEffect(() => {
    if (dirProp) return;
    const el = ref.current;
    if (!el) return;
    const explicit = el
      .closest('[dir]:not([dir="auto"])')
      ?.getAttribute("dir")
      ?.toLowerCase();
    const rtl = getComputedStyle(el).direction === "rtl" || explicit === "rtl";
    setResolved(rtl ? "rtl" : "ltr");
  }, [dirProp, ref]);
  return dirProp ?? resolved;
}

/** `start` / `end` → the physical edge for a direction; `left` / `right` pass through. */
export function resolvePhysicalSide(
  side: "start" | "end" | "left" | "right",
  dir: "ltr" | "rtl",
): "left" | "right" {
  if (side === "left" || side === "right") return side;
  const startIsLeft = dir === "ltr";
  return side === "start"
    ? startIsLeft ? "left" : "right"
    : startIsLeft ? "right" : "left";
}
