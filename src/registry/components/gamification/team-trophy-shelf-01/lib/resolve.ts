import type { Badge } from "../types";

/**
 * Earned-vs-locked resolution — pure, SSR-deterministic (derives only from
 * props; no `Date.now()`, no layout). `awardedAt` is the single discriminator.
 * Kit-extraction candidate (system §7.3) — keep standalone.
 */

export function isEarned(badge: Badge): boolean {
  return badge.awardedAt != null;
}

export function isLocked(badge: Badge): boolean {
  return badge.awardedAt == null;
}

/** Apply `showLocked`: drop not-yet-earned badges from the rendered list when false. */
export function resolveSlots(badges: Badge[], showLocked: boolean): Badge[] {
  return showLocked ? badges : badges.filter(isEarned);
}

export function earnedCount(badges: Badge[]): number {
  return badges.filter(isEarned).length;
}

export function totalCount(badges: Badge[]): number {
  return badges.length;
}
