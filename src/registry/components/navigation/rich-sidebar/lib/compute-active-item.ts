import type { NavEntry, NavItem } from "../types";

export interface ActiveItemResult {
  item: NavItem | null;
  // Section ID the active item lives inside (null = top-level)
  sectionId: string | null;
}

interface ComputeOptions {
  // Already-filtered visible entries (post-permissions, post-hidden)
  entries: ReadonlyArray<NavEntry>;
  currentPath: string;
  isActive?: (item: NavItem, currentPath: string) => boolean;
  defaultMatch?: "exact" | "prefix";
}

/**
 * Compute the active NavItem given a currentPath.
 *
 * Resolution order (L9):
 *   1. `isActive` predicate (if supplied) wins for every item.
 *   2. Per-item `match: "exact" | "prefix"` fallback.
 *   3. `defaultMatch` (default "exact") for items without `match`.
 *
 * Tie-break (L42): longest matching `item.href` wins for prefix matches.
 */
export function computeActiveItem(opts: ComputeOptions): ActiveItemResult {
  const { entries, currentPath, isActive, defaultMatch = "exact" } = opts;

  // Flatten: track each NavItem alongside its containing sectionId (null if top-level).
  const flat: { item: NavItem; sectionId: string | null }[] = [];
  for (const entry of entries) {
    if (entry.kind === "section") {
      for (const child of entry.items) {
        if (child.disabled) continue;
        flat.push({ item: child, sectionId: entry.id });
      }
    } else if (entry.kind === "separator") {
      continue;
    } else {
      if (entry.disabled) continue;
      flat.push({ item: entry, sectionId: null });
    }
  }

  if (isActive) {
    // Predicate wins; first match in flat order.
    for (const { item, sectionId } of flat) {
      if (isActive(item, currentPath)) return { item, sectionId };
    }
    return { item: null, sectionId: null };
  }

  // Exact pass first — any exact match wins immediately (cheaper than longest-prefix)
  for (const { item, sectionId } of flat) {
    const mode = item.match ?? defaultMatch;
    if (mode === "exact" && item.href === currentPath) {
      return { item, sectionId };
    }
  }

  // Prefix pass — collect all prefix candidates, pick longest href.
  let best: { item: NavItem; sectionId: string | null; length: number } | null = null;
  for (const { item, sectionId } of flat) {
    const mode = item.match ?? defaultMatch;
    if (mode !== "prefix" || !item.href) continue;
    // True prefix: currentPath starts with href + (next char is "/" or end)
    if (!currentPath.startsWith(item.href)) continue;
    const after = currentPath.charAt(item.href.length);
    if (after !== "" && after !== "/") continue;
    const length = item.href.length;
    if (!best || length > best.length) best = { item, sectionId, length };
  }

  if (best) return { item: best.item, sectionId: best.sectionId };
  return { item: null, sectionId: null };
}
