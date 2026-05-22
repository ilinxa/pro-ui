import { useMemo } from "react";
import { deriveVisibleEntries } from "../lib/derive-visible-entries";
import type { NavEntry } from "../types";

export interface UseFilteredNavSectionsOpts {
  sections: ReadonlyArray<NavEntry>;
  permissions?: ReadonlySet<string>;
  isOwner?: boolean;
  currentMaxMembers?: number;
  bypassFiltering?: boolean;
}

/**
 * Pure helper hook — returns the filtered `NavEntry[]` with all three
 * gates applied (permission ∩ ownerOnly ∩ minMembers per L46) and empty
 * sections dropped. `bypassFiltering: true` skips the three permission
 * gates at BOTH section + item levels; `hidden: true` is unconditionally
 * respected (Q21).
 *
 * **Memoized over 5 inputs (Q16)** — returns referentially-stable sections
 * when inputs don't change by reference (or value, for boolean/number).
 * Mitigates R14: downstream `<NavSection>` memoization holds.
 *
 * **Consumer-side memo guidance (Finding 6 / R16):** `permissions` is a
 * `ReadonlySet<string>` — wrap construction in `useMemo([source])` on the
 * caller side, else the hook's memo will invalidate every render.
 *
 * Items-only return per PQ1 — diagnostic struct stays internal to
 * `<RichSidebar>`. NOT coupled to the `<RichSidebar>` component; consumers
 * rendering their own arbitrary sidebar UI use this standalone.
 */
export function useFilteredNavSections(
  opts: UseFilteredNavSectionsOpts,
): ReadonlyArray<NavEntry> {
  const { sections, permissions, isOwner, currentMaxMembers, bypassFiltering } = opts;

  return useMemo(
    () =>
      deriveVisibleEntries({
        items: sections,
        permissions,
        isOwner,
        currentMaxMembers,
        bypassFiltering,
      }).entries,
    [sections, permissions, isOwner, currentMaxMembers, bypassFiltering],
  );
}
