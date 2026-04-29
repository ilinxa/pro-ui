import type { EntityLike } from "../types";

export function singleSelectionEqual<T extends EntityLike>(
  a: T | null,
  b: T | null,
): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.id === b.id;
}

export function multiSelectionEqual<T extends EntityLike>(
  a: ReadonlyArray<T>,
  b: ReadonlyArray<T>,
): boolean {
  if (a.length !== b.length) return false;
  if (a.length === 0) return true;
  const seen = new Set<string>();
  for (const item of a) seen.add(item.id);
  for (const item of b) {
    if (!seen.has(item.id)) return false;
  }
  return true;
}
