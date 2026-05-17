// F-S1 lock — RELATIVE imports for cross-procomp types/helpers. Same-category
// alias imports get the slug name substituted by shadcn's rewriter; relative
// paths bypass that and translate verbatim.
import type {
  CanvasData,
  NodeData,
  NodeRecord,
  Port,
} from "../../flow-canvas-01/types";
import { updateNodeData } from "../../flow-canvas-01/lib/update-node-data";
import type { RichCardJsonNode } from "../../rich-card/types";

/**
 * The card-level slot that `<PortEditorStrip>` targets — either the root
 * `node.data` (when subPath is undefined) or a nested subcard located by
 * matching `__rcid`. Includes a closure that produces an updated CanvasData
 * when given a new ports[] array.
 *
 * Walker logic mirrors `lib/enumerate-subcards.ts`'s heuristic (skip __rc-
 * prefixed keys, skip "__type", skip "ports"; only descend into objects
 * that look card-like).
 *
 * v0.2.0 addition.
 */
export type PortTarget = {
  node: NodeRecord;
  cardData: RichCardJsonNode;
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
 */
export function findPortTarget(
  canvas: CanvasData,
  nodeId: string,
  subPath?: string,
): PortTarget | null {
  const node = canvas.nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const rootData = node.data as RichCardJsonNode;

  // No subPath → target the root card (node.data itself).
  if (subPath === undefined) {
    return makeTarget(canvas, node, rootData, []);
  }

  // subPath defined → recursive walk for the descendant card with matching __rcid.
  const path = findCardPath(rootData, subPath, []);
  if (path === null) return null;

  const subData = walkPath(rootData, path);
  if (!subData) return null;
  return makeTarget(canvas, node, subData, path);
}

function makeTarget(
  canvas: CanvasData,
  node: NodeRecord,
  cardData: RichCardJsonNode,
  pathFromRoot: string[],
): PortTarget {
  const cardRcid =
    typeof cardData.__rcid === "string" ? cardData.__rcid : undefined;
  const ports = Array.isArray(cardData.ports) ? (cardData.ports as Port[]) : [];

  const updateIn = (next: Port[]): CanvasData => {
    const nextRoot = setPortsAtPath(
      node.data as RichCardJsonNode,
      pathFromRoot,
      next,
    );
    return updateNodeData(canvas, node.id, nextRoot as NodeData);
  };

  return { node, cardData, cardRcid, ports, updateIn };
}

/** Find the path (array of object keys) from rootData to the card whose __rcid === targetRcid. */
function findCardPath(
  data: RichCardJsonNode,
  targetRcid: string,
  pathSoFar: string[],
): string[] | null {
  if (data.__rcid === targetRcid) return pathSoFar;

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("__rc")) continue;
    if (key === "__type") continue;
    if (key === "ports") continue;
    if (!isCardLike(value)) continue;

    const childPath = findCardPath(
      value as RichCardJsonNode,
      targetRcid,
      [...pathSoFar, key],
    );
    if (childPath !== null) return childPath;
  }
  return null;
}

/** Walk `data` following the path of keys. Returns null if any step doesn't resolve to a card-like object. */
function walkPath(
  data: RichCardJsonNode,
  path: string[],
): RichCardJsonNode | null {
  let curr: RichCardJsonNode = data;
  for (const key of path) {
    const next = curr[key];
    if (!isCardLike(next)) return null;
    curr = next as RichCardJsonNode;
  }
  return curr;
}

/** Immutable update: replace `ports[]` at `path` (rooted at `data`); returns a new root. */
function setPortsAtPath(
  data: RichCardJsonNode,
  path: string[],
  nextPorts: Port[],
): RichCardJsonNode {
  if (path.length === 0) {
    return { ...data, ports: nextPorts };
  }
  const [head, ...rest] = path;
  const child = data[head];
  if (!isCardLike(child)) return data; // path broken; bail without mutating
  return {
    ...data,
    [head]: setPortsAtPath(child as RichCardJsonNode, rest, nextPorts),
  };
}

function isCardLike(value: unknown): value is RichCardJsonNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.__rcid !== undefined ||
    obj.__rcorder !== undefined ||
    obj.__rcmeta !== undefined ||
    Array.isArray(obj.ports)
  );
}
