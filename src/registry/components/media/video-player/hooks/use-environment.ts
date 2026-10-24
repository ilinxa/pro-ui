"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const hasMatchMedia = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

function subscribeReducedMotion(onChange: () => void) {
  if (!hasMatchMedia()) return () => {};
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const readReducedMotion = () => hasMatchMedia() && window.matchMedia(REDUCED_MOTION).matches;
const serverFalse = () => false;
const STEPS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * True under `prefers-reduced-motion: reduce`. `false` on the server, on the hydrating render and
 * wherever `matchMedia` does not exist (it is guarded, not assumed — jsdom has none).
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, readReducedMotion, serverFalse);
}

/**
 * Whether at least `threshold` of the element is visible. `null` until the first observation, and
 * always `null` when disabled or where IntersectionObserver does not exist — "unknown" never
 * starts or stops playback.
 */
export function useVisibility(
  ref: React.RefObject<HTMLElement | null>,
  threshold: number,
  enabled: boolean,
): boolean | null {
  const [visible, setVisible] = useState<boolean | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === "undefined") {
      setVisible(null);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        // A player taller than the viewport may never reach the ratio: covering at least
        // `threshold` of the viewport counts as visible (same rule as media-carousel).
        const viewport = entry.rootBounds?.height ?? 0;
        const coversViewport =
          viewport > 0 && (entry.intersectionRect?.height ?? 0) >= viewport * threshold;
        setVisible(entry.isIntersecting && (entry.intersectionRatio >= threshold || coversViewport));
      },
      { threshold: STEPS },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold, enabled]);
  return visible;
}
