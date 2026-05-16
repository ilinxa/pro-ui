/**
 * Inline shallow-equality helper. Matches zustand's `shallow` algorithm
 * (zustand v3/v4/v5 — algorithm unchanged) without taking on a transitive
 * dep on zustand itself. Used by xyflow's `useStore(selector, equality?)`
 * second arg where the default identity equality thrashes — e.g. a
 * selector that looks up an object in a Map and returns it: the lookup
 * resolves to the same underlying object, but xyflow's store updates the
 * Map reference on every change, so the selector returns a fresh reference
 * even when the meaningful contents are unchanged.
 *
 * Map / Set comparison is intentionally omitted — selectors in this
 * codebase never return those.
 *
 * Kept in the sealed folder (rather than importing from `zustand/shallow`)
 * for registry-portability: this avoids leaking a transitive zustand dep
 * to consumers of `@ilinxa/flow-canvas-01` who haven't otherwise installed
 * it. xyflow's own zustand peer is nested and doesn't surface to consumer
 * package.json. v0.2.0 Tier 2 plan F-01.
 */
export function shallow<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null) return false;
  if (typeof b !== "object" || b === null) return false;
  const aKeys = Object.keys(a as object);
  const bKeys = Object.keys(b as object);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (
      !Object.is(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      )
    ) {
      return false;
    }
  }
  return true;
}
