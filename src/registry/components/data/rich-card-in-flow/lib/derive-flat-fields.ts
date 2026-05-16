import type { RichCardJsonNode } from "@/registry/components/data/rich-card";
import type { FlatField, FlatFieldType } from "../types";

const RESERVED_PREFIX = "__rc";
const SKIP_KEYS = new Set(["__type", "ports", "title"]);

// ISO-8601 date detection. Accepts:
//   2024-05-16
//   2024-05-16T12:30:00
//   2024-05-16T12:30:00.123Z
//   2024-05-16T12:30:00+02:00
const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Return the first N "flat field" entries from a rich-card tree, in
 * `Object.entries` order. Skips:
 *   - rich-card metadata (`__rcid` / `__rcorder` / `__rcmeta`)
 *   - canvas discriminators (`__type`)
 *   - the title (rendered separately by the title strip)
 *   - port arrays (`ports`)
 *   - nested cards (anything that `enumerateSubcards` would pick up)
 *
 * Type detection:
 *   - `boolean` primitive  → "boolean"
 *   - `number` primitive   → "number"
 *   - `string` matching ISO-8601 → "date"
 *   - `string` otherwise → "string"
 *   - other (object / array / null / undefined) → not a flat field, skipped
 */
export function deriveFlatFields(
  data: RichCardJsonNode,
  max: number,
): FlatField[] {
  const out: FlatField[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (out.length >= max) break;
    if (key.startsWith(RESERVED_PREFIX)) continue;
    if (SKIP_KEYS.has(key)) continue;

    const type = classifyFlatValue(value);
    if (!type) continue;

    out.push({ key, value, type });
  }

  return out;
}

function classifyFlatValue(value: unknown): FlatFieldType | undefined {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number" && Number.isFinite(value)) return "number";
  if (typeof value === "string") {
    if (ISO_DATE_RE.test(value)) return "date";
    return "string";
  }
  return undefined;
}
