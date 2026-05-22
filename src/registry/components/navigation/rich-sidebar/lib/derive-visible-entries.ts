import type { NavEntry, NavItem, NavSection } from "../types";

export interface VisibleEntriesResult {
  // Filtered + ordered for render. Sections retain their inner items[]
  // already-filtered. Separators pass through.
  entries: ReadonlyArray<NavEntry>;

  // Diagnostic — which items dropped due to which gate. Used by
  // onPermissionDenied diff-firing (L38).
  filteredByPermission: ReadonlyArray<{ item: NavItem; requiredPermission: string }>;

  // Total NavItem count BEFORE filtering (for the empty-state "no-items" branch).
  totalItemCount: number;

  // Count of items that exist but were hidden (manual `hidden: true`).
  hiddenItemCount: number;
}

interface DeriveOptions {
  items: ReadonlyArray<NavEntry>;
  permissions?: ReadonlySet<string>;
  keepEmptySections?: boolean;
}

/**
 * Filter and shape the items[] for render.
 *
 * Order of gating per NavItem (L48):
 *   1. hidden === true → drop (no diagnostic)
 *   2. permission set AND permissions doesn't include it → drop + record
 *
 * NavSection gates the same way at the section level (whole-group drop).
 * Empty sections after item filter auto-hide unless keepEmptySections (L41).
 */
export function deriveVisibleEntries(opts: DeriveOptions): VisibleEntriesResult {
  const { items, permissions, keepEmptySections = false } = opts;

  const out: NavEntry[] = [];
  const filteredByPermission: { item: NavItem; requiredPermission: string }[] = [];
  let totalItemCount = 0;
  let hiddenItemCount = 0;

  for (const entry of items) {
    if (entry.kind === "separator") {
      out.push(entry);
      continue;
    }

    if (entry.kind === "section") {
      const section = entry as NavSection;
      if (section.hidden) continue;
      if (section.permission && !(permissions?.has(section.permission) ?? false)) {
        // Section-level permission gate — drop whole group, no per-item diagnostic
        continue;
      }
      const visibleInner: NavItem[] = [];
      for (const child of section.items) {
        totalItemCount += 1;
        if (child.hidden) {
          hiddenItemCount += 1;
          continue;
        }
        if (child.permission && !(permissions?.has(child.permission) ?? false)) {
          filteredByPermission.push({ item: child, requiredPermission: child.permission });
          continue;
        }
        visibleInner.push(child);
      }
      if (visibleInner.length === 0 && !keepEmptySections) continue;
      out.push({ ...section, items: visibleInner });
      continue;
    }

    // Top-level NavItem
    const item = entry as NavItem;
    totalItemCount += 1;
    if (item.hidden) {
      hiddenItemCount += 1;
      continue;
    }
    if (item.permission && !(permissions?.has(item.permission) ?? false)) {
      filteredByPermission.push({ item, requiredPermission: item.permission });
      continue;
    }
    out.push(item);
  }

  return {
    entries: out,
    filteredByPermission,
    totalItemCount,
    hiddenItemCount,
  };
}
