import type { CommentReactions } from "../types";

const bump = (n: number | null | undefined, by: number): number | null | undefined =>
  typeof n === "number" ? Math.max(0, n + by) : n;

/**
 * The reaction data after the viewer picks `next` (or clears it with `null`). Withheld tallies
 * (`null` / missing) stay withheld: only numbers move.
 */
export function nextReactions(
  current: CommentReactions | undefined,
  next: string | null,
): CommentReactions {
  const previous = current?.viewerReaction ?? null;
  if (previous === next) return { ...current, viewerReaction: next };
  const counts: Record<string, number | null> = { ...current?.counts };
  if (previous !== null && previous in counts) counts[previous] = bump(counts[previous], -1) ?? null;
  if (next !== null && next in counts) counts[next] = bump(counts[next], 1) ?? null;
  const total = current?.totalCount;
  const delta = (next !== null ? 1 : 0) - (previous !== null ? 1 : 0);
  return {
    ...current,
    viewerReaction: next,
    counts,
    totalCount: delta === 0 ? total : bump(total, delta),
  };
}
