"use client";

import { useEffect, useState } from "react";

/**
 * A counter that increments every `intervalMs` (0 disables). SSR-safe: stays 0
 * on the server + first client render, the interval starts only after mount.
 * Drives the periodic re-resolution of the "now" line + urgency color.
 */
export function useColorTick(intervalMs: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return;
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
