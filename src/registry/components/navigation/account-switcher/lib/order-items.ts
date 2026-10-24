import type { ReactNode } from "react";
import type { SwitcherGroup, SwitcherItem } from "../types";

/** One block of the list: the ungrouped items (`id: null`) or one group with its heading. */
export interface SwitcherSection {
  id: string | null;
  label: ReactNode;
  items: SwitcherItem[];
}

/**
 * Bucket items for rendering. Ungrouped items come first (array order), then each
 * group in `groups` order with its items in array order; empty groups are skipped.
 * A repeated group id keeps its first occurrence. An item whose `group` is not in
 * `groups` renders ungrouped.
 *
 * `flat` is the rendered order — the keyboard walks it, so arrow keys always follow
 * what the user sees. `problems` lists both input mistakes; the component dev-warns
 * them once per change (pure here, so inline `groups` literals don't warn every render).
 */
export function orderItems(
  items: ReadonlyArray<SwitcherItem>,
  groups: ReadonlyArray<SwitcherGroup> | undefined,
): { sections: SwitcherSection[]; flat: SwitcherItem[]; problems: string[] } {
  const known = new Map<string, SwitcherItem[]>();
  const uniqueGroups: SwitcherGroup[] = [];
  const duplicateGroups: string[] = [];
  for (const g of groups ?? []) {
    if (known.has(g.id)) {
      duplicateGroups.push(g.id);
      continue;
    }
    known.set(g.id, []);
    uniqueGroups.push(g);
  }
  const ungrouped: SwitcherItem[] = [];
  const unknown: string[] = [];
  for (const item of items) {
    const bucket = item.group === undefined ? undefined : known.get(item.group);
    if (bucket) {
      bucket.push(item);
      continue;
    }
    if (item.group !== undefined) unknown.push(`${item.key} → ${item.group}`);
    ungrouped.push(item);
  }

  const problems: string[] = [];
  if (duplicateGroups.length > 0) {
    problems.push(`Duplicate group ids in \`groups\`; first occurrence kept: ${duplicateGroups.join(", ")}.`);
  }
  if (unknown.length > 0) {
    problems.push(`Items reference a group missing from \`groups\`; rendered ungrouped: ${unknown.join(", ")}.`);
  }

  const sections: SwitcherSection[] = [];
  if (ungrouped.length > 0) sections.push({ id: null, label: null, items: ungrouped });
  for (const g of uniqueGroups) {
    const bucket = known.get(g.id);
    if (bucket && bucket.length > 0) sections.push({ id: g.id, label: g.label, items: bucket });
  }
  return { sections, flat: sections.flatMap((s) => s.items), problems };
}
