import type { EntityLike } from "../types";

export function valueToArray<T extends EntityLike>(
  value: T | T[] | null,
): T[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

export function valueIds<T extends EntityLike>(
  value: T | T[] | null,
): Set<string> {
  const out = new Set<string>();
  for (const item of valueToArray(value)) out.add(item.id);
  return out;
}

export function hasId<T extends EntityLike>(
  value: T | T[] | null,
  id: string,
): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some((v) => v.id === id);
  return value.id === id;
}
