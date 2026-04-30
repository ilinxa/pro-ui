"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { ResolvedTheme, ThemeKey } from "../types";
import { resolveTheme, resolveThemeStatic } from "../lib/theme";

/**
 * Per system decision #37 + plan §8.5: theme colors come from CSS
 * variables in globals.css.
 *
 * The graph's visual identity is decoupled from the host document's
 * light/dark mode — the `theme` prop chooses which palette to read, and
 * we don't subscribe to documentElement class flips. Hosts that want
 * the graph to follow the document can pipe their resolved document
 * theme into this prop themselves; the default is `"dark"`.
 *
 * Hydration posture:
 *   - SSR + initial client render use `resolveThemeStatic` (pure JS,
 *     fixed fallback hex values) so the markup matches across server
 *     and client.
 *   - After mount, `useSyncExternalStore`'s client snapshot returns
 *     `true` and we upgrade to `resolveTheme`, which reads the actual
 *     computed colors from globals.css. No setState-in-effect needed.
 */
const noopSubscribe = () => () => {};
const getMountedSnapshot = () => true;
const getServerSnapshot = () => false;

export function useThemeResolution(
  theme: "dark" | "light" | "custom",
  customColors?: Partial<Record<ThemeKey, string>>,
): ResolvedTheme {
  const isMounted = useSyncExternalStore(
    noopSubscribe,
    getMountedSnapshot,
    getServerSnapshot,
  );

  return useMemo(
    () =>
      isMounted
        ? resolveTheme(theme, customColors)
        : resolveThemeStatic(theme, customColors),
    [theme, customColors, isMounted],
  );
}
