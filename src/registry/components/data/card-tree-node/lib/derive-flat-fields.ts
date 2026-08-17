// F-S1 lock — RELATIVE import for cross-procomp types. Same-category alias
// imports get the slug name substituted by shadcn's rewriter; relative paths
// bypass that and translate verbatim.
import type { CardTreeJsonNode } from "../../card-tree/types";
import type { FlatField, FlatFieldType } from "../types";
import { classifyNodeKey, type NodeKeyOptions } from "./classify-node-key";

// ISO-8601 date detection. Accepts:
//   2024-05-16
//   2024-05-16T12:30:00
//   2024-05-16T12:30:00.123Z
//   2024-05-16T12:30:00+02:00
const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Return the first N "flat field" entries from a card-tree tree, in
 * `Object.entries` order.
 *
 * Which keys qualify is decided by `classifyNodeKey`, which mirrors
 * card-tree's own precedence. Everything that is not a scalar field is
 * handled elsewhere: metadata and the title strip out of band, blocks by
 * `deriveBlocks`, nested cards by `enumerateSubcards`.
 *
 * v0.4.0 changed one visible behaviour here: `quote` is a *string*-valued
 * built-in block, so through v0.3 it satisfied the old "is it a string?"
 * test and was rendered as an ordinary field — consuming one of the three
 * field slots and pushing a real field out of view. It is now a block. A
 * consumer who genuinely wants it as text can put `quote` in
 * `disabledPredefinedKeys`, exactly as they would with `<CardTree>`.
 *
 * Type detection (unchanged):
 *   - `boolean` primitive  → "boolean"
 *   - `number` primitive   → "number"
 *   - `string` matching ISO-8601 → "date"
 *   - `string` otherwise → "string"
 *   - anything else → not a flat field, skipped
 */
export function deriveFlatFields(
  data: CardTreeJsonNode,
  max: number,
  options: NodeKeyOptions = {},
): FlatField[] {
  const out: FlatField[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (out.length >= max) break;
    if (classifyNodeKey(key, value, options) !== "field") continue;

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
