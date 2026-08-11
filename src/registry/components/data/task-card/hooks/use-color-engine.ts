"use client";

/**
 * Single setInterval at the root that bumps `tick`, forcing the card subtree
 * to re-render and recompute `elapsed` from `now()`.
 *
 * NOT per-card — would be N intervals for N nodes. One interval, tree-wide.
 *
 * `intervalMs = 0` disables the timer (render-time computation still works at
 * mount, just doesn't refresh). Useful for consumer-driven external clocks.
 */

import { useEffect, useState } from "react";

export function useColorEngine(intervalMs: number): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (intervalMs <= 0) return;
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
}
