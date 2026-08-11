/**
 * First letters of up to two name words → avatar initials fallback.
 * Empty (or whitespace-only) input returns `"?"`; a single word returns its
 * first two characters; two-or-more words return the first character of the
 * first word + the first character of the last word — all uppercased. Pure,
 * framework-free, SSR-safe, deterministic.
 *
 * Extracted 2026-08-11 (P3.5 / D-04) from two behaviorally-identical private
 * copies: `team-challenge/parts/team-member-stack.tsx`'s `initials(name)` and
 * `team-task-claim/lib/members.ts`'s `initialsFor(member, fallbackId)` (the
 * latter is a member-resolution wrapper that now calls this core directly).
 */
export function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (trimmed === "") return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
