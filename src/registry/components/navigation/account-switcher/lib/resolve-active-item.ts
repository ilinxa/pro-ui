import type { SwitcherItem } from "../types";

/**
 * Result of the active-item resolution pipeline (plan §6).
 *
 * Discriminated union so the renderer can react differently per branch —
 * e.g., visually mark `kind: "fallback"` if the design later wants to, or
 * disable the trigger in the `kind: "empty"` case (Q1 default).
 */
export type ResolvedActive =
  | { kind: "resolved"; item: SwitcherItem }
  | { kind: "fallback"; item: SwitcherItem }
  | { kind: "first"; item: SwitcherItem }
  | { kind: "empty" };

/**
 * Resolve the item to show in the trigger.
 *
 * Priority (L4 + Q1):
 *   1. items.find((i) => i.key === activeKey)   → kind: "resolved"
 *   2. fallbackActiveItem                       → kind: "fallback"
 *   3. items[0]                                 → kind: "first"
 *   4. (none)                                   → kind: "empty"
 */
export function resolveActiveItem(
  items: ReadonlyArray<SwitcherItem>,
  activeKey: string | null,
  fallback: SwitcherItem | undefined,
): ResolvedActive {
  if (activeKey !== null) {
    const match = items.find((i) => i.key === activeKey);
    if (match) return { kind: "resolved", item: match };
  }
  if (fallback) return { kind: "fallback", item: fallback };
  if (items.length > 0) return { kind: "first", item: items[0]! };
  return { kind: "empty" };
}
