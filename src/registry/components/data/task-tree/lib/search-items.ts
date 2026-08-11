import type { TaskItem } from "../../task-card/types";

/**
 * Plain case-insensitive `.includes()` over `name` + `description` per
 * Q5 lock. Empty/whitespace-only queries match everything (returns true for
 * every item; callers don't need to special-case).
 */
export function itemMatchesQuery(item: TaskItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (item.name.toLowerCase().includes(q)) return true;
  if (item.description && item.description.toLowerCase().includes(q)) return true;
  return false;
}
