import type { FsNode } from "../types";

/**
 * Flat-index a hierarchical array by id. Walks every node once, ignoring
 * cycles produced by malformed input (a node already in the index is skipped).
 */
export function indexNodes(nodes: FsNode[]): Map<string, FsNode> {
  const map = new Map<string, FsNode>();
  const walk = (list: FsNode[]) => {
    for (const node of list) {
      if (map.has(node.id)) continue;
      map.set(node.id, node);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return map;
}

/** Find one node by id by walking the tree. Stops at first hit. */
export function findNode(
  id: string,
  nodes: FsNode[],
): FsNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const hit = findNode(id, node.children);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** Returns the chain of ancestor nodes (root → ... → parent) for `nodeId`. */
export function getParentChain(
  nodeId: string,
  index: Map<string, FsNode>,
): FsNode[] {
  const chain: FsNode[] = [];
  let current = index.get(nodeId);
  while (current?.parentId) {
    const parent = index.get(current.parentId);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

/** All descendant ids of `nodeId` (excluding itself). */
export function getDescendantIds(
  nodeId: string,
  index: Map<string, FsNode>,
): Set<string> {
  const out = new Set<string>();
  const node = index.get(nodeId);
  if (!node?.children) return out;
  const walk = (list: FsNode[]) => {
    for (const child of list) {
      if (out.has(child.id)) continue;
      out.add(child.id);
      if (child.children) walk(child.children);
    }
  };
  walk(node.children);
  return out;
}

/**
 * Default sort: folders before files, then case-insensitive locale alpha by name.
 */
export function defaultSort(a: FsNode, b: FsNode): number {
  if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

/** Initial uncontrolled-mode expanded set: every top-level folder id. */
export function deriveRootExpandedIds(nodes: FsNode[]): Set<string> {
  const set = new Set<string>();
  for (const node of nodes) {
    if (node.type === "folder") set.add(node.id);
  }
  return set;
}

/**
 * Recursive, immutable update — replaces a folder's `children` everywhere
 * in the tree without mutating the input array. Used by both
 * `mergeLoadedChildren` and other consumer helpers.
 */
function replaceChildren(
  nodes: FsNode[],
  parentId: string,
  next: FsNode[],
): FsNode[] {
  let changed = false;
  const out = nodes.map((node) => {
    if (node.id === parentId) {
      changed = true;
      return { ...node, children: next };
    }
    if (node.children) {
      const replaced = replaceChildren(node.children, parentId, next);
      if (replaced !== node.children) {
        changed = true;
        return { ...node, children: replaced };
      }
    }
    return node;
  });
  return changed ? out : nodes;
}

/**
 * Public consumer helper. After `onLoadChildren` resolves, splice the new
 * children into the right folder immutably.
 *
 *   onLoadChildren={async ({ nodeId }) => {
 *     const kids = await fs.list(nodeId);
 *     setNodes((prev) => mergeLoadedChildren(prev, nodeId, kids));
 *     return kids;
 *   }}
 */
export function mergeLoadedChildren(
  nodes: FsNode[],
  parentId: string,
  children: FsNode[],
): FsNode[] {
  return replaceChildren(nodes, parentId, children);
}

/** Total node count (recursive). */
export function countAllNodes(nodes: FsNode[]): number {
  let total = 0;
  const walk = (list: FsNode[]) => {
    for (const node of list) {
      total += 1;
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return total;
}
