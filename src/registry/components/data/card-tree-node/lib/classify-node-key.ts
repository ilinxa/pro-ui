// F-S1 lock — RELATIVE import for cross-procomp types. Same-category alias
// imports get the slug name substituted by shadcn's rewriter; relative paths
// bypass that and translate verbatim.
import { PREDEFINED_KEYS, RESERVED_KEYS, type PredefinedKey } from "../../card-tree/types";

/**
 * Pure key router for the canvas viewer — the v0.4.0 answer to FU-2.
 *
 * Before v0.4.0 the viewer had no key router at all. It asked two independent
 * value-shape questions ("is this a scalar?" / "does this object carry
 * `__rcid` or `ports`?") and dropped anything that answered no to both. Every
 * card-tree *block* answers no to both, so `image` / `table` / `codearea` /
 * `list` and every host-registered custom block rendered as nothing, while
 * `quote` — a string-valued built-in — leaked into the flat-field strip as an
 * ordinary string field.
 *
 * The fix is to route on the KEY first, exactly as card-tree's own parser
 * does. This mirrors `card-tree/lib/classify-key.ts`; keep the two in step.
 *
 *   reserved -> built-in -> custom -> scalar -> object/array
 *
 * Matching custom keys by NAME before inspecting the value is the load-bearing
 * part (card-tree v0.6.0, "custom keys are inert" report): a value-shape-first
 * router can never reach an array-valued custom block, because the array route
 * rejects arrays for good reason (Q-P4).
 *
 * Differences from card-tree's router, both deliberate:
 *   - `__type`, `ports` and `title` return "skip" — the canvas viewer paints
 *     those out of band (discriminator, port handles, title strip).
 *   - An UNREGISTERED array returns "skip" rather than "child". card-tree
 *     returns "child" and lets `parseInput` reject it (Q-P4); the viewer has
 *     no parser, so it drops the value at the same point the parser would.
 */

export type NodeKeyClass =
  /** `__rcid` / `__rcorder` / `__rcmeta` — card-tree metadata. */
  | "reserved"
  /** Painted elsewhere by the viewer: `__type`, `ports`, `title`. */
  | "skip"
  /** A built-in or host-registered predefined block. */
  | "block"
  /** A flat scalar field. */
  | "field"
  /** A nested child card. */
  | "child";

export type NodeKeyOptions = {
  /** Names the host registered via `customPredefinedKeys`. */
  customKeyNames?: readonly string[];
  /** Built-ins the consumer opted out of — demoted to field/child, as in card-tree. */
  disabledPredefinedKeys?: readonly PredefinedKey[];
};

/** Keys the viewer paints out of band rather than as content. */
const VIEWER_SKIP_KEYS = new Set(["__type", "ports", "title"]);

export function classifyNodeKey(
  key: string,
  value: unknown,
  options: NodeKeyOptions = {},
): NodeKeyClass {
  const { customKeyNames = [], disabledPredefinedKeys = [] } = options;

  if ((RESERVED_KEYS as readonly string[]).includes(key)) return "reserved";
  if (VIEWER_SKIP_KEYS.has(key)) return "skip";

  if ((PREDEFINED_KEYS as readonly string[]).includes(key)) {
    // Built-ins win over host registrations, and an opted-out built-in becomes
    // a plain field — both exactly as card-tree's router does it, including the
    // consequence that an opted-out OBJECT-valued built-in renders as nothing
    // (its value is not a scalar). Diverging from card-tree here is what
    // produced FU-2 in the first place; a consumer who wants the payload
    // visible should leave the key enabled rather than opt out.
    return disabledPredefinedKeys.includes(key as PredefinedKey) ? "field" : "block";
  }

  if (customKeyNames.includes(key)) return "block";

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return "field";
  }

  // Unregistered arrays are dropped here — see the header note on Q-P4.
  if (Array.isArray(value)) return "skip";
  if (typeof value === "object") return "child";

  // undefined / function / symbol / bigint — nominally a field; the field
  // deriver's own type check drops it.
  return "field";
}
