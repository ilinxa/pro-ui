// F-S1 lock — RELATIVE imports for cross-procomp types/helpers. Same-category
// alias imports get the slug name substituted by shadcn's rewriter; relative
// paths bypass that and translate verbatim.
import type {
  CanvasData,
  NodeData,
  NodeRecord,
  Port,
} from "../../flow-canvas/types";
import { updateNodeData } from "../../flow-canvas/lib/update-node-data";
import type { CardTreeJsonNode } from "../../card-tree/types";
import { classifyNodeKey, type NodeKeyOptions } from "./classify-node-key";

/**
 * The card-level slot that `<PortEditorStrip>` targets — either the root
 * `node.data` (when subPath is undefined) or a nested subcard located by
 * matching `__rcid`. Includes a closure that produces an updated CanvasData
 * when given a new ports[] array.
 *
 * Walker logic routes through `classifyNodeKey`, so it agrees with what the
 * viewer draws (see `isChildAt` below).
 *
 * v0.2.0 addition.
 */
export type PortTarget = {
  node: NodeRecord;
  cardData: CardTreeJsonNode;
  cardRcid: string | undefined;
  ports: Port[];
  /**
   * Closure that walks the same path back through the tree, replaces the
   * `ports` array at that level, and returns a new `CanvasData` via
   * `updateNodeData`. Pure — does not mutate the input canvas.
   */
  updateIn: (next: Port[]) => CanvasData;
};

/**
 * Resolve the (node, card-by-rcid, ports, updater-closure) tuple for a given
 * `(nodeId, subPath?)` pair. Returns `null` when:
 *   - The node id is not found in `canvas.nodes`
 *   - `subPath` is defined but no descendant card has matching `__rcid`
 *
 * Callers (the strip) render an empty-state when this returns null — common
 * path during dialog open transitions before canvas state settles.
 *
 * `options` carries the host's key registrations, exactly as passed to
 * `createCardTreeViewerRenderer()`. **Pass the same values to both** — the
 * walker and the viewer classify keys with the same router, so mismatched
 * options put them back out of step (that is FU-A in miniature). Omitting it
 * reproduces v0.2–v0.4 behaviour for a host that registered nothing.
 *
 * v0.5.0 — `options` added (FU-A).
 */
export function findPortTarget(
  canvas: CanvasData,
  nodeId: string,
  subPath?: string,
  options: NodeKeyOptions = {},
): PortTarget | null {
  const node = canvas.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const rootData = node.data as CardTreeJsonNode;

  // No subPath → target the root card (node.data itself).
  if (subPath === undefined) {
    return makeTarget(canvas, node, rootData, [], options);
  }

  // subPath defined → recursive walk for the descendant card with matching __rcid.
  const path = findCardPath(rootData, subPath, [], options);
  if (path === null) return null;

  const subData = walkPath(rootData, path, options);
  if (!subData) return null;
  return makeTarget(canvas, node, subData, path, options);
}

function makeTarget(
  canvas: CanvasData,
  node: NodeRecord,
  cardData: CardTreeJsonNode,
  pathFromRoot: string[],
  options: NodeKeyOptions,
): PortTarget {
  const cardRcid =
    typeof cardData.__rcid === "string" ? cardData.__rcid : undefined;
  const ports = Array.isArray(cardData.ports) ? (cardData.ports as Port[]) : [];

  const updateIn = (next: Port[]): CanvasData => {
    const nextRoot = setPortsAtPath(
      node.data as CardTreeJsonNode,
      pathFromRoot,
      next,
      options,
    );
    return updateNodeData(canvas, node.id, nextRoot as NodeData);
  };

  return { node, cardData, cardRcid, ports, updateIn };
}

/** Find the path (array of object keys) from rootData to the card whose __rcid === targetRcid. */
function findCardPath(
  data: CardTreeJsonNode,
  targetRcid: string,
  pathSoFar: string[],
  options: NodeKeyOptions,
): string[] | null {
  if (data.__rcid === targetRcid) return pathSoFar;

  for (const [key, value] of Object.entries(data)) {
    if (!isChildAt(key, value, options)) continue;

    const childPath = findCardPath(
      value as CardTreeJsonNode,
      targetRcid,
      [...pathSoFar, key],
      options,
    );
    if (childPath !== null) return childPath;
  }
  return null;
}

/** Walk `data` following the path of keys. Returns null if any step doesn't resolve to a child card. */
function walkPath(
  data: CardTreeJsonNode,
  path: string[],
  options: NodeKeyOptions,
): CardTreeJsonNode | null {
  let curr: CardTreeJsonNode = data;
  for (const key of path) {
    const next = curr[key];
    if (!isChildAt(key, next, options)) return null;
    curr = next as CardTreeJsonNode;
  }
  return curr;
}

/** Immutable update: replace `ports[]` at `path` (rooted at `data`); returns a new root. */
function setPortsAtPath(
  data: CardTreeJsonNode,
  path: string[],
  nextPorts: Port[],
  options: NodeKeyOptions,
): CardTreeJsonNode {
  if (path.length === 0) {
    return { ...data, ports: nextPorts };
  }
  const [head, ...rest] = path;
  const child = data[head];
  if (!isChildAt(head, child, options)) return data; // path broken; bail without mutating
  return {
    ...data,
    [head]: setPortsAtPath(child as CardTreeJsonNode, rest, nextPorts, options),
  };
}

/**
 * Is `data[key]` a nested child card? **v0.5.0 replaced the private v0.2
 * `isCardLike` heuristic (FU-A).**
 *
 * The old test asked whether the VALUE carried `__rcid` / `__rcorder` /
 * `__rcmeta` or its own `ports` array — the same value-shape question v0.4.0
 * retired from `enumerateSubcards` (F-04). Keeping it here meant the port
 * editor and the viewer disagreed about what a card is, in both directions:
 *
 *   - it MISSED a child that had not been round-tripped through `<CardTree>`,
 *     so had no `__rcid`. The viewer draws such a child as a subcard outline
 *     and flow-canvas's port walker draws the handles of anything nested
 *     beneath it — but the walker refused to descend, so those ports resolved
 *     to "No card found at this path.";
 *   - it CLAIMED a block whose payload happened to carry `ports` or an
 *     `__rcid`, so `updateIn` would write a `ports` array *into a block
 *     payload* the viewer treats as opaque.
 *
 * Routing through `classifyNodeKey` puts all three walkers (find / read /
 * write) on the same router the viewer uses, which is card-tree's own key
 * precedence. It also subsumes the old inline key skips (`__rc*`, `__type`,
 * `ports`) — those classify as `reserved` / `skip` and never return `child`.
 */
function isChildAt(
  key: string,
  value: unknown,
  options: NodeKeyOptions,
): boolean {
  return classifyNodeKey(key, value, options) === "child";
}
