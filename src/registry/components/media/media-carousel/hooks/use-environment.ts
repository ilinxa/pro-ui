"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const FINE_POINTER = "(pointer: fine)";

function subscribeFinePointer(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(FINE_POINTER);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const readFinePointer = () =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(FINE_POINTER).matches;
const serverFalse = () => false;
const STEPS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * True under a fine pointer (mouse / trackpad). The server snapshot is `false`, so the server
 * render and the hydrating client render agree; the real value lands right after hydration.
 */
export function useFinePointer(): boolean {
  return useSyncExternalStore(subscribeFinePointer, readFinePointer, serverFalse);
}

/**
 * True while at least `threshold` of the element is in the viewport — or, for an element
 * taller than the viewport, while it covers at least `threshold` of the viewport. Starts `true`
 * (server, first render, and environments without IntersectionObserver), so nothing that
 * depends on it changes before mount.
 */
export function useInView(
  ref: React.RefObject<HTMLElement | null>,
  threshold = 0.5,
): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        // A carousel taller than the viewport can never be half visible: then covering at
        // least `threshold` of the viewport counts as in view.
        const viewport = entry.rootBounds?.height ?? 0;
        const coversViewport =
          viewport > 0 && (entry.intersectionRect?.height ?? 0) >= viewport * threshold;
        setInView(
          entry.isIntersecting && (entry.intersectionRatio >= threshold || coversViewport),
        );
      },
      // Fine steps: the tall-element rule depends on the visible height, not one ratio crossing.
      { threshold: STEPS },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}
