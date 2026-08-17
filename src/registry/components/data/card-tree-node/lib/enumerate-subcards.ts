// F-S1 lock — RELATIVE import for cross-procomp types. Same-category alias
// imports get the slug name substituted by shadcn's rewriter; relative paths
// bypass that and translate verbatim.
import type { CardTreeJsonNode } from "../../card-tree/types";
import { classifyNodeKey, type NodeKeyOptions } from "./classify-node-key";

/**
 * Walk `data` shallow (depth 1) and return the entries that are nested
 * card-tree subcards, per `classifyNodeKey` — i.e. object values that are not
 * reserved metadata, not a block, and not painted out of band.
 *
 * **v0.4.0 replaced the v0.1 heuristic (F-04).** The old `isCardLike` test
 * asked whether an object carried `__rcid` / `__rcorder` / `__rcmeta` or its
 * own `ports` array. That was wrong in both directions:
 *
 *   - it MISSED a genuine child card that had not been round-tripped through
 *     `<CardTree>` yet, so had no `__rcid`. Such a card rendered as nothing —
 *     which also made `SubcardBlock`'s documented missing-`__rcid`
 *     degradation path (F-03) unreachable in practice;
 *   - it CLAIMED a host block whose payload happened to have a `ports` key,
 *     painting a block as a subcard outline.
 *
 * Key-first classification fixes both and keeps this helper in step with
 * card-tree's parser, which is the component the edit dialog actually mounts.
 * The plan's F-rev-3 revisit trigger ("tighten when card-tree ships a
 * canonical predicate") is satisfied by reusing card-tree's key precedence
 * rather than by importing a predicate it still does not export.
 *
 * Keep this helper PRIVATE — see plan §10 (F-rev-3).
 */
export function enumerateSubcards(
  data: CardTreeJsonNode,
  options: NodeKeyOptions = {},
): Array<{ key: string; card: CardTreeJsonNode }> {
  const out: Array<{ key: string; card: CardTreeJsonNode }> = [];

  for (const [key, value] of Object.entries(data)) {
    if (classifyNodeKey(key, value, options) !== "child") continue;
    out.push({ key, card: value as CardTreeJsonNode });
  }

  return out;
}
