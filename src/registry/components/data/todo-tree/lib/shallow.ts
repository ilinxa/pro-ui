/**
 * Shallow-equality helpers used by the controlled-mode structural resync guard
 * (lands in C3 `use-controlled-mode.ts`). Kept here as a sealed-folder utility
 * to avoid leaking a third-party shallow dep to consumers.
 */

export function shallowEqualArray<T>(
  a: ReadonlyArray<T>,
  b: ReadonlyArray<T>,
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function shallowEqualSet<T>(
  a: ReadonlySet<T>,
  b: ReadonlySet<T>,
): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const v of a) {
    if (!b.has(v)) return false;
  }
  return true;
}

export function shallowEqualObject<T extends Record<string, unknown>>(
  a: T,
  b: T,
): boolean {
  if (a === b) return true;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}
