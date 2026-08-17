/**
 * Mount-time resolution of `customPredefinedKeys` (v0.6).
 *
 * Registration is mount-only and last-write-loses is NOT the policy: a name that
 * collides with a built-in or reserved key is rejected outright, and duplicate
 * registrations keep the first. Both cases emit a diagnostic — the 0.5.0 failure
 * mode this closes was silence, so every rejection must be *loud*.
 *
 * Pure: returns diagnostics rather than logging, so parse/classify stay
 * side-effect free and the caller (card-tree.tsx) owns the single console.error.
 */

import {
  PREDEFINED_KEYS,
  RESERVED_KEYS,
  type CustomPredefinedKey,
} from "../types";

export type CustomKeyDiagnostic = {
  key: string;
  code: "collides-with-predefined" | "collides-with-reserved" | "duplicate" | "empty-key";
  message: string;
};

export type ResolvedCustomKeys = {
  /** Accepted registrations, in registration order. */
  keys: readonly CustomPredefinedKey[];
  /** Accepted key names — the cheap lookup `classifyKey` takes. */
  names: readonly string[];
  diagnostics: readonly CustomKeyDiagnostic[];
};

/**
 * Shared no-registrations result. Frozen (arrays included) because it is handed
 * out by reference to every caller — an in-place push by future code would leak
 * one tree's registrations into every other CardTree on the page.
 */
const EMPTY: ResolvedCustomKeys = Object.freeze({
  keys: Object.freeze([]),
  names: Object.freeze([]),
  diagnostics: Object.freeze([]),
});

export function resolveCustomKeys(
  registered: readonly CustomPredefinedKey[] | undefined,
): ResolvedCustomKeys {
  if (!registered || registered.length === 0) return EMPTY;

  const keys: CustomPredefinedKey[] = [];
  const names: string[] = [];
  const diagnostics: CustomKeyDiagnostic[] = [];
  const seen = new Set<string>();

  for (const entry of registered) {
    const key = entry?.key;

    if (typeof key !== "string" || key.trim().length === 0) {
      diagnostics.push({
        key: String(key),
        code: "empty-key",
        message: "custom predefined-key registered with an empty name; dropped",
      });
      continue;
    }

    if ((RESERVED_KEYS as readonly string[]).includes(key)) {
      diagnostics.push({
        key,
        code: "collides-with-reserved",
        message: `custom predefined-key "${key}" collides with a reserved key (${RESERVED_KEYS.join(", ")}); dropped`,
      });
      continue;
    }

    if ((PREDEFINED_KEYS as readonly string[]).includes(key)) {
      diagnostics.push({
        key,
        code: "collides-with-predefined",
        message: `custom predefined-key "${key}" collides with a built-in predefined key (${PREDEFINED_KEYS.join(", ")}); dropped — the built-in wins`,
      });
      continue;
    }

    if (seen.has(key)) {
      diagnostics.push({
        key,
        code: "duplicate",
        message: `custom predefined-key "${key}" registered more than once; keeping the first registration`,
      });
      continue;
    }

    seen.add(key);
    keys.push(entry);
    names.push(key);
  }

  return { keys, names, diagnostics };
}

/** Find a resolved registration by name. Linear scan — registries are tiny. */
export function findCustomKey(
  keys: readonly CustomPredefinedKey[],
  name: string,
): CustomPredefinedKey | undefined {
  return keys.find((k) => k.key === name);
}
