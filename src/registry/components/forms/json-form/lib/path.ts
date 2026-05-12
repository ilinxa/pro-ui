/**
 * Dot-path helpers used by the expression interpolator + nested ZodObject
 * construction. RHF handles deep-set/get internally for `register('a.b.c')`,
 * but we need read-side dot-path access for `expression: '{address.city}'`.
 */

export function getByPath(obj: unknown, path: string): unknown {
  if (obj == null) return undefined;
  const segments = path.split(".");
  let cur: unknown = obj;
  for (const seg of segments) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

export function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split(".");
  const last = segments.pop();
  if (!last) return;
  let cur: Record<string, unknown> = obj;
  for (const seg of segments) {
    if (!(seg in cur) || typeof cur[seg] !== "object" || cur[seg] === null) {
      cur[seg] = {};
    }
    cur = cur[seg] as Record<string, unknown>;
  }
  cur[last] = value;
}
