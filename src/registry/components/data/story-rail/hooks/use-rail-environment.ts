"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    if (typeof window === "undefined" || !window.matchMedia) return () => {};
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  };
}

function readMedia(query: string): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(query).matches;
}

const FINE_POINTER = "(pointer: fine)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const subscribeFinePointer = subscribeMedia(FINE_POINTER);
const subscribeReducedMotion = subscribeMedia(REDUCED_MOTION);
const serverFalse = () => false;

/**
 * True under a fine pointer (mouse / trackpad). The server snapshot is `false`,
 * so the server render and the hydrating client render agree; the real value
 * lands right after hydration.
 */
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    subscribeFinePointer,
    () => readMedia(FINE_POINTER),
    serverFalse,
  );
}

/** `prefers-reduced-motion: reduce`, SSR-safe (server snapshot `false`). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => readMedia(REDUCED_MOTION),
    serverFalse,
  );
}

/**
 * Resolves the text direction: the explicit `dir` prop wins; otherwise the
 * element's computed `direction`, read after mount (so the first client render
 * matches the server's `"ltr"`). Computed style covers `dir="rtl"` ancestors,
 * `dir="auto"` and CSS `direction: rtl` alike. A later change is not observed —
 * pass `dir` when your app switches direction at runtime.
 */
export function useResolvedDirection(
  ref: React.RefObject<HTMLElement | null>,
  dirProp: "ltr" | "rtl" | undefined,
): "ltr" | "rtl" {
  const [ancestorDir, setAncestorDir] = useState<"ltr" | "rtl">("ltr");
  useIsoLayoutEffect(() => {
    if (dirProp) return;
    const el = ref.current;
    if (!el) return;
    // Fallback for environments without a UA stylesheet for `dir` (jsdom):
    // the nearest explicit, non-`auto` `dir` — in a browser it agrees with
    // the computed value whenever it says "rtl".
    const explicit = el
      .closest('[dir]:not([dir="auto"])')
      ?.getAttribute("dir")
      ?.toLowerCase();
    const rtl = getComputedStyle(el).direction === "rtl" || explicit === "rtl";
    setAncestorDir(rtl ? "rtl" : "ltr");
  }, [dirProp, ref]);
  return dirProp ?? ancestorDir;
}
