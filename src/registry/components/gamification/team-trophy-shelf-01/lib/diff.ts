import { isEarned } from "./resolve";
import type { Badge } from "../types";

/**
 * The newly-earned diff — pure. Given the current badges and a map of the
 * previous render's badges by id, returns the set of ids whose `awardedAt` went
 * absent → present (i.e. just earned).
 *
 * SSR safety is achieved by the caller, not a `mounted` flag: the Root seeds its
 * "previous" from the FIRST render's badges (via `useState`), so on the initial
 * (and hydration) render `prev === current` for every id → the set is empty →
 * nothing animates on load. The reveal only appears after a subsequent controlled
 * `badges` update flips a badge's `awardedAt` on (exactly the host action D-d
 * describes). This avoids a `set-state-in-effect` mounted flag (which the repo's
 * lint rule forbids) while staying hydration-safe.
 */
export function newlyEarned(
  current: Badge[],
  prevById: Map<string, Badge>,
): Set<string> {
  const result = new Set<string>();
  for (const badge of current) {
    if (isEarned(badge) && prevById.get(badge.id)?.awardedAt == null) {
      result.add(badge.id);
    }
  }
  return result;
}

export function indexById(badges: Badge[]): Map<string, Badge> {
  return new Map(badges.map((badge) => [badge.id, badge]));
}
