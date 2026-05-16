// F-S1 lock — RELATIVE import for cross-procomp types. Same-category alias
// imports get the slug name substituted by shadcn's rewriter; relative paths
// bypass that and translate verbatim.
import type { RichCardJsonNode } from "../../rich-card/types";

/**
 * Walk `data` shallow (depth 1) and return the entries that look like nested
 * rich-card subcards. v0.1 of this helper is intentionally heuristic — rich-card
 * uses an open-shape `RichCardJsonNode` (`[key: string]: unknown`); there is no
 * canonical "is-card" predicate exported from rich-card today. v0.2 may
 * tighten if rich-card ships such a predicate (F-04 lock in procomp plan §3).
 *
 * Keep this helper PRIVATE in v0.1 — its signature depends on the heuristic
 * which is marked for tightening. Re-exporting from `index.ts` would freeze
 * the signature; see plan §10 (F-rev-3) for the revisit trigger.
 */
export function enumerateSubcards(
  data: RichCardJsonNode,
): Array<{ key: string; card: RichCardJsonNode }> {
  const out: Array<{ key: string; card: RichCardJsonNode }> = [];

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("__rc")) continue; // skip __rcid / __rcorder / __rcmeta
    if (key === "__type") continue; // canvas discriminator (when present)
    if (key === "ports") continue; // ports handled by port-walker / PortsAt
    if (!isCardLike(value)) continue;
    out.push({ key, card: value });
  }

  return out;
}

function isCardLike(value: unknown): value is RichCardJsonNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  // F-04 heuristic: an object value is "card-like" when it carries any
  // rich-card metadata OR its own ports array.
  return (
    obj.__rcid !== undefined ||
    obj.__rcorder !== undefined ||
    obj.__rcmeta !== undefined ||
    Array.isArray(obj.ports)
  );
}
