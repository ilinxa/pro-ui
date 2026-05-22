import type { SwitcherItem } from "../types";

/**
 * Strip duplicate-key entries and dev-warn about the violation.
 *
 * Per L3 + Q2 — matches React's own key-uniqueness warning semantics:
 *   - Production: silent strip, last-write-wins-by-position (preserves first
 *     occurrence by source order)
 *   - Development: console.warn listing each duplicate key
 *
 * Callers should wrap in `useMemo([items])` so the dedup pass and the
 * (potential) warn fire once per items-reference change, not per render.
 */
export function enforceUniqueKeys(
  items: ReadonlyArray<SwitcherItem>,
): ReadonlyArray<SwitcherItem> {
  const seen = new Set<string>();
  const deduped: SwitcherItem[] = [];
  const duplicateKeys: string[] = [];
  for (const item of items) {
    if (seen.has(item.key)) {
      duplicateKeys.push(item.key);
      continue;
    }
    seen.add(item.key);
    deduped.push(item);
  }
  if (duplicateKeys.length > 0 && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      `[account-switcher-01] Duplicate item keys stripped: ${duplicateKeys.join(", ")}. ` +
        `Each item must have a unique \`key\`. First occurrence preserved by source order.`,
    );
  }
  return deduped;
}
