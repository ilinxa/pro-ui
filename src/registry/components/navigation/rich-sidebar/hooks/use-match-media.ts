import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe matchMedia hook via `useSyncExternalStore`.
 *
 * Server snapshot returns `false` (matches the SSR HTML). Client snapshot
 * reads `window.matchMedia(query).matches`. Subscribe wires the change
 * event. This avoids the React-19 cascading-render antipattern
 * (setState-in-effect) — `useSyncExternalStore` is the right primitive
 * for synchronizing with browser APIs.
 *
 * IMPORTANT (L44): Mobile-vs-desktop RENDERING is gated by CSS classes
 * (`hidden lg:flex` etc.), NOT by this hook. This hook is for JS BEHAVIOR
 * gating only — e.g., deciding whether `autoCloseMobileOnNavigate` should
 * trigger when an item is clicked. The SSR-default `false` is harmless
 * because CSS owns the visual decision.
 */
export function useMatchMedia(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", callback);
        return () => mql.removeEventListener("change", callback);
      }
      // Safari < 14 fallback
      mql.addListener(callback);
      return () => mql.removeListener(callback);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Tailwind v4 default breakpoints (px). Used to translate the enum
// values `"sm" | "md" | "lg" | "xl" | "2xl"` to CSS media queries.
export const TAILWIND_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/** Resolve a `mobileBreakpoint` prop value to a CSS media query string. */
export function resolveBreakpointQuery(
  bp: "sm" | "md" | "lg" | "xl" | "2xl" | (string & {}),
): string {
  if (bp in TAILWIND_BREAKPOINTS) {
    const px = TAILWIND_BREAKPOINTS[bp as keyof typeof TAILWIND_BREAKPOINTS];
    return `(max-width: ${px - 1}px)`;
  }
  // Raw CSS query passed through (PQ7 union with raw string)
  return bp;
}
