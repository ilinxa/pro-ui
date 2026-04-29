type Flat = Record<string, unknown>;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === null || proto === Object.prototype;
}

export function flatten(
  obj: Record<string, unknown>,
  prefix = "",
): Flat {
  const out: Flat = {};
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) {
      Object.assign(out, flatten(value as Record<string, unknown>, next));
    } else {
      out[next] = value;
    }
  }
  return out;
}

export function unflatten(flat: Flat): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(flat)) {
    const segments = path.split(".");
    let cursor = out;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const existing = cursor[seg];
      if (!isPlainObject(existing)) {
        cursor[seg] = {};
      }
      cursor = cursor[seg] as Record<string, unknown>;
    }
    cursor[segments[segments.length - 1]] = value;
  }
  return out;
}
