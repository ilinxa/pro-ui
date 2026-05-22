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
      }),
    [options.items, options.permissions, options.keepEmptySections],
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
