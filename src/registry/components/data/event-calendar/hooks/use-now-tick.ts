"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe "now" in epoch ms. On the server + first client render it returns
 * the seed (the `now` prop, if any) so server + client markup match; after
 * mount it switches to the real clock (on the next animation frame, so we never
 * setState synchronously inside the effect) and refreshes every `intervalMs`
 * (0 disables the refresh). Drives the now-line + urgency color.
 *
 * If no seed is given, the pre-mount value is `0` (epoch) — deterministic, so
 * no hydration mismatch; the real clock takes over on mount (a one-frame
 * settle). Pass `now` for an exact SSR-stable first paint.
 */
export function useNowTick(
  seed: Date | string | undefined,
  intervalMs: number,
): number {
  const seedMs =
    seed == null
      ? null
      : typeof seed === "string"
        ? Date.parse(seed)
        : seed.getTime();

  const [nowMs, setNowMs] = useState<number>(() =>
    seedMs != null && Number.isFinite(seedMs) ? seedMs : 0,
  );

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    // First real-clock read on the next frame (not synchronous in the effect).
    const raf = requestAnimationFrame(tick);
    if (!intervalMs || intervalMs <= 0) {
      return () => cancelAnimationFrame(raf);
    }
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [intervalMs]);

  return nowMs;
}
