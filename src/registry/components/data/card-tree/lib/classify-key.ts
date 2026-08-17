/**
 * Pure key router. Decides which bucket a JSON property belongs in:
 *   - 'reserved'    — a __rc* key handled out-of-band (skipped before this is called)
 *   - 'predefined'  — a known predefined-key (codearea/image/table/quote/list) not opted-out
 *   - 'custom'      — a host-registered custom predefined-key (v0.6, `customPredefinedKeys`)
 *   - 'field'       — a flat scalar field (or a predefined-key the developer opted out of)
 *   - 'child'       — a child card (parser will reject arrays here, per Q-P4)
 *
 * PRECEDENCE (v0.6 — load-bearing, see plan-v0.3 §9 + the 0.5.0 "custom keys are
 * inert" report): reserved → built-in → **custom** → scalar → object/array.
 *
 * Custom keys are matched by NAME, before the value is inspected at all. That is
 * what makes an array-valued custom block possible: the `child` route rejects
 * arrays (Q-P4, correct for ordinary children), so a value-shape-first router
 * could never reach a registered array key. Q-P4 is untouched for non-registered
 * keys.
 *
 * Built-ins win over custom registrations; `resolveCustomKeys` drops colliding
 * names at mount, so by the time a name reaches here the two sets are disjoint.
 */

import {
  PREDEFINED_KEYS,
  RESERVED_KEYS,
  type PredefinedKey,
} from "../types";

export type KeyClassification =
  | "reserved"
  | "predefined"
  | "custom"
  | "field"
  | "child";

export function classifyKey(
  key: string,
  value: unknown,
  disabledPredefinedKeys: readonly PredefinedKey[],
  /** Resolved custom-key names (see `resolveCustomKeys`). Empty = v0.5 behavior. */
  customKeyNames: readonly string[] = [],
): KeyClassification {
  if ((RESERVED_KEYS as readonly string[]).includes(key)) return "reserved";

  if ((PREDEFINED_KEYS as readonly string[]).includes(key)) {
    const predefined = key as PredefinedKey;
    if (disabledPredefinedKeys.includes(predefined)) return "field";
    return "predefined";
  }

  // Registered custom blocks are matched by NAME, before any value inspection —
  // this is the branch that unblocks array-valued blocks (Plate Value, editor.js).
  if (customKeyNames.includes(key)) return "custom";

  // Scalars are flat fields.
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return "field";
  }

  // Objects + arrays are children. The parser rejects arrays
  // (per Q-P4: arrays of objects break round-trip; use object-keyed children).
  if (typeof value === "object") return "child";

  // undefined, function, symbol, bigint — treat as field; type-inference will null out.
  return "field";
}
