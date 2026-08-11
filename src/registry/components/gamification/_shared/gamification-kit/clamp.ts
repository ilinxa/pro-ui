/**
 * Generic numeric clamp — `Math.min(Math.max(n, lo), hi)`. Pure,
 * framework-free, SSR-safe. Extracted 2026-08-11 (P3.5 / D-04) from
 * byte-identical private copies in `team-challenge/lib/derive.ts` and
 * `team-progress-bar/lib/resolve-progress.ts`.
 */
export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}
