import type { EntityLike } from "../types";

export function defaultMatch<T extends EntityLike>(
  item: T,
  query: string,
): boolean {
  if (query.length === 0) return true;
  return item.label.toLowerCase().includes(query.toLowerCase());
}
