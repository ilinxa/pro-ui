/**
 * Pure key router. Decides which bucket a JSON property belongs in:
 *   - 'reserved'    — a __rc* key handled out-of-band (skipped before this is called)
 *   - 'predefined'  — a known predefined-key (codearea/image/table/quote/list) not opted-out
 *   - 'field'       — a flat scalar field (or a predefined-key the developer opted out of)
 *   - 'child'       — a child card (parser will reject arrays in v0.1, per Q-P4)
 */

import {
  PREDEFINED_KEYS,
  RESERVED_KEYS,
  type PredefinedKey,
} from "../types";

export type KeyClassification =
  | "reserved"
  | "predefined"
  | "field"
  | "child";

export function classifyKey(
  key: string,
  value: unknown,
  disabledPredefinedKeys: readonly PredefinedKey[],
): KeyClassification {
  if ((RESERVED_KEYS as readonly string[]).includes(key)) return "reserved";

  if ((PREDEFINED_KEYS as readonly string[]).includes(key)) {
    const predefined = key as PredefinedKey;
    if (disabledPredefinedKeys.includes(predefined)) return "field";
    return "predefined";
  }

  // Scalars are flat fields.
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return "field";
  }

  // Objects + arrays are children. The parser rejects arrays in v0.1
  // (per Q-P4: arrays of objects break round-trip; use object-keyed children).
  if (typeof value === "object") return "child";

  // undefined, function, symbol, bigint — treat as field; type-inference will null out.
  return "field";
}
