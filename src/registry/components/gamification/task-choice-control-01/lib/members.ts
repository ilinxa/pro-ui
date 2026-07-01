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
 * display name, or the raw id when the member is unknown (stale-id path).
 */
export function initialsFor(
  member: TeamMember | undefined,
  fallbackId: string,
): string {
  const src = (member?.displayName ?? fallbackId).trim();
  if (src === "") return "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return src.slice(0, 2).toUpperCase();
}
