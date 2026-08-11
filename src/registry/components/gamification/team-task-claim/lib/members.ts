import { initialsFromName } from "../../_shared/gamification-kit";
import type { TeamMember } from "../types";

/**
 * Member resolution — pure, framework-free, SSR-safe. A stale `assigneeId` not
 * present in `members` returns `undefined` (the chip degrades gracefully to
 * id-initials, never crashes — §9).
 */
export function resolveMember(
  id: string | undefined,
  members: TeamMember[],
): TeamMember | undefined {
  return id == null ? undefined : members.find((m) => m.id === id);
}

/**
 * Deterministic (SSR-safe) initials for an avatar fallback — from the member's
 * display name, or the raw id when the member is unknown (stale-id path). The
 * name → initials core moved to the shared `gamification-kit` (P3.5 / D-04);
 * this wrapper keeps the member + fallback-id resolution local.
 */
export function initialsFor(
  member: TeamMember | undefined,
  fallbackId: string,
): string {
  return initialsFromName(member?.displayName ?? fallbackId);
}
