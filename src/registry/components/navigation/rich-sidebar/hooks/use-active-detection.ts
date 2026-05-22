import { useMemo } from "react";
import { computeActiveItem, type ActiveItemResult } from "../lib/compute-active-item";
import { deriveVisibleEntries, type VisibleEntriesResult } from "../lib/derive-visible-entries";
import type { NavEntry, NavItem } from "../types";

interface UseActiveDetectionOptions {
  items: ReadonlyArray<NavEntry>;
  currentPath: string;
  isActive?: (item: NavItem, currentPath: string) => boolean;
  defaultMatch?: "exact" | "prefix";
  permissions?: ReadonlySet<string>;
  keepEmptySections?: boolean;
  // v0.2.0 — gates threaded to deriveVisibleEntries (L44 / L45 / Q21).
  isOwner?: boolean;
  currentMaxMembers?: number;
  bypassFiltering?: boolean;
}

export interface UseActiveDetectionResult {
  visible: VisibleEntriesResult;
  active: ActiveItemResult;
}

/**
 * Memoize the items[] → visible-entries → active-item pipeline.
 *
 * Reference stability of `items` is critical (L34) — non-memoized items[]
 * invalidate this memo every render. Guide.md teaches consumers to memoize.
 *
 * v0.2.0 — also threads `isOwner`, `currentMaxMembers`, `bypassFiltering`
 * into the deriveVisibleEntries call (L44–L46 + Q21).
 */
export function useActiveDetection(
  options: UseActiveDetectionOptions,
): UseActiveDetectionResult {
  const visible = useMemo(
    () =>
      deriveVisibleEntries({
        items: options.items,
        permissions: options.permissions,
        keepEmptySections: options.keepEmptySections,
        isOwner: options.isOwner,
        currentMaxMembers: options.currentMaxMembers,
        bypassFiltering: options.bypassFiltering,
      }),
    [
      options.items,
      options.permissions,
      options.keepEmptySections,
      options.isOwner,
      options.currentMaxMembers,
      options.bypassFiltering,
    ],
  );

  const active = useMemo(
    () =>
      computeActiveItem({
        entries: visible.entries,
        currentPath: options.currentPath,
        isActive: options.isActive,
        defaultMatch: options.defaultMatch,
      }),
    [visible.entries, options.currentPath, options.isActive, options.defaultMatch],
  );

  return { visible, active };
}
