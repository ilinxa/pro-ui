import type { NavEntry } from "../types";

/**
 * Linear focus-traversal slot in the keyboard nav sequence.
 *
 * - `kind: "section-header"` — a focusable section header (the section was
 *   declared `collapsible: true`). Non-collapsible section headers render
 *   as a static `<h6>` and are excluded from focus traversal (L37).
 * - `kind: "item"` — a NavItem row. `sectionId` is the parent section id
 *   when the item lives inside a section, or `null` for top-level items.
 *
 * The `id` field is the row's stable id (item.id or section.id) and is
 * what the reducer's `FOCUS_ITEM` action stores.
 */
export interface SidebarKeyboardEntry {
  id: string;
  kind: "section-header" | "item";
  sectionId: string | null;
}

/**
 * Flatten the rendered NavEntry tree into the keyboard traversal sequence.
 *
 * Rules (per plan §17.2 + L37):
 *  - Separators are skipped.
 *  - Collapsible section headers are included; non-collapsible headers are
 *    not focusable so they're omitted.
 *  - When a section is collapsed, its items are not in the sequence.
 *  - Disabled items are skipped (they're not interactive).
 */
export function flattenEntriesForKeyboard(
  entries: ReadonlyArray<NavEntry>,
  collapsedSectionIds: ReadonlySet<string>,
): ReadonlyArray<SidebarKeyboardEntry> {
  const out: SidebarKeyboardEntry[] = [];
  for (const entry of entries) {
    if (entry.kind === "separator") continue;
    if (entry.kind === "section") {
      if (entry.collapsible) {
        out.push({ id: entry.id, kind: "section-header", sectionId: entry.id });
      }
      if (collapsedSectionIds.has(entry.id)) continue;
      for (const child of entry.items) {
        if (child.disabled) continue;
        out.push({ id: child.id, kind: "item", sectionId: entry.id });
      }
      continue;
    }
    if (entry.disabled) continue;
    out.push({ id: entry.id, kind: "item", sectionId: null });
  }
  return out;
}
