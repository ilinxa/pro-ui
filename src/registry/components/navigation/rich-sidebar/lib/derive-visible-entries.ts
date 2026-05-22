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
  /**
   * v0.2.0 — Whether the current user is an owner. Used by `ownerOnly`
   * gate (L44). Default `false` (matches v0.1 behavior — no items have
   * `ownerOnly` in v0.1.x so default is a no-op for legacy callers).
   */
  isOwner?: boolean;
  /**
   * v0.2.0 — Current plan-tier seat capacity. Used by `minMembers` gate
   * (L45). Default `Infinity` (matches v0.1 behavior — no items have
   * `minMembers` in v0.1.x so default is a no-op for legacy callers).
   */
  currentMaxMembers?: number;
  /**
   * v0.2.0 — When `true`, bypass ALL permission gates (permission /
   * ownerOnly / minMembers) at BOTH section AND item levels (Q21 +
   * re-validation Finding 4). `hidden: true` is unconditionally respected.
   * Default `false`.
   */
  bypassFiltering?: boolean;
}

/**
 * Filter and shape the items[] for render.
 *
 * Gating order per NavItem:
 *   1. hidden === true → drop (no diagnostic, ALWAYS respected — Q21)
 *   2. If !bypassFiltering: permission ∩ ownerOnly ∩ minMembers (L46)
 *
 * NavSection gates the same way at the section level (whole-group drop) —
 * `bypassFiltering` applies at BOTH levels coherently per Finding 4 from
 * the GATE 2 re-validation (else "section disappears, items remain"
 * inconsistency). Empty sections after item filter auto-hide unless
 * keepEmptySections.
 *
 * v0.1 callers (without isOwner / currentMaxMembers / bypassFiltering)
 * see byte-identical behavior because the new gates only fire when the
 * corresponding optional NavItem fields are present + the bypass flag is
 * false; defaults are explicit per Finding 5.
 */
export function deriveVisibleEntries(opts: DeriveOptions): VisibleEntriesResult {
  const {
    items,
    permissions,
    keepEmptySections = false,
    isOwner = false,
    currentMaxMembers = Infinity,
    bypassFiltering = false,
  } = opts;

  const out: NavEntry[] = [];
  const filteredByPermission: { item: NavItem; requiredPermission: string }[] = [];
  let totalItemCount = 0;
  let hiddenItemCount = 0;

  const passesItemGates = (item: NavItem): { pass: boolean; missingPermission?: string } => {
    if (bypassFiltering) return { pass: true };
    if (item.permission && !(permissions?.has(item.permission) ?? false)) {
      return { pass: false, missingPermission: item.permission };
    }
    if (item.ownerOnly && !isOwner) return { pass: false };
    if (item.minMembers !== undefined && currentMaxMembers < item.minMembers) {
      return { pass: false };
    }
    return { pass: true };
  };

  for (const entry of items) {
    if (entry.kind === "separator") {
      out.push(entry);
      continue;
    }

    if (entry.kind === "section") {
      const section = entry as NavSection;
      if (section.hidden) continue;
      // Section perm gate — also skipped by bypassFiltering per Finding 4.
      if (
        !bypassFiltering &&
        section.permission &&
        !(permissions?.has(section.permission) ?? false)
      ) {
        continue;
      }
      const visibleInner: NavItem[] = [];
      for (const child of section.items) {
        totalItemCount += 1;
        if (child.hidden) {
          hiddenItemCount += 1;
          continue;
        }
        const gate = passesItemGates(child);
        if (!gate.pass) {
          if (gate.missingPermission) {
            filteredByPermission.push({ item: child, requiredPermission: gate.missingPermission });
          }
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
    const gate = passesItemGates(item);
    if (!gate.pass) {
      if (gate.missingPermission) {
        filteredByPermission.push({ item, requiredPermission: gate.missingPermission });
      }
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
