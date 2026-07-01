/**
 * Pure duration clamp — the D-10 non-blocking guarantee in code. Even if a
 * consumer passes `celebrationDurationMs={5000}`, the celebration is clamped to
 * < 1000 ms; a sub-200 ms flash (unreadable) is floored to 200 ms. Framework-free,
 * unit-testable, kit-extraction candidate.
 */

export const DEFAULT_CELEBRATION_MS = 800;
export const MIN_CELEBRATION_MS = 200;
/** Hard ceiling — strictly < 1000 ms (D-10). */
export const MAX_CELEBRATION_MS = 999;

export function clampDuration(ms?: number): number {
  return Math.min(
    Math.max(ms ?? DEFAULT_CELEBRATION_MS, MIN_CELEBRATION_MS),
    MAX_CELEBRATION_MS,
  );
}
