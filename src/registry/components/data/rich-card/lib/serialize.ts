/**
 * Pure serializer: `RichCardTree` → canonical `RichCardJsonNode` and JSON string.
 *
 * Property emission order per plan §3.1:
 *   1. __rcid
 *   2. __rcorder
 *   3. __rcmeta
 *   4. flat fields (insertion order from parse)
 *   5. predefined-key elements (insertion order)
 *   6. children — emitted under their stored `parentKey` in `order` ascending
 *
 * Round-trip property: parse(serialize(parse(x))) === parse(x). Fixed-point
 * on the second round trip.
 */

import type { RichCardJsonNode } from "../types";
import type { RichCardTree } from "./parse";

export function treeToJsonNode(tree: RichCardTree): RichCardJsonNode {
  const out: RichCardJsonNode = {
    __rcid: tree.id,
    __rcorder: tree.order,
  };

  if (tree.meta && Object.keys(tree.meta).length > 0) {
    out.__rcmeta = { ...tree.meta };
  }

  for (const field of tree.fields) {
    out[field.key] = field.value;
  }

  for (const entry of tree.predefined) {
    out[entry.key] = entry.value as unknown;
  }

  for (const child of tree.children) {
    if (!child.parentKey) {
      // Root has no parentKey; non-root with no parentKey is a parser bug — skip.
      continue;
    }
    out[child.parentKey] = treeToJsonNode(child);
  }

  return out;
}

export function serializeTree(tree: RichCardTree): string {
  return JSON.stringify(treeToJsonNode(tree), null, 2);
}
