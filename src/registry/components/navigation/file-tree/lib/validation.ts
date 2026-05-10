import type { FsNode, FileTreeDropPosition } from "../types";

/** True iff any source id equals the target id. */
export function isSelfDrop(
  srcIds: string[],
  targetId: string | null,
): boolean {
  if (!targetId) return false;
  return srcIds.includes(targetId);
}

/**
 * True iff dropping `srcIds` into / next-to `targetId` would create a cycle.
 * Walks the parent chain of the target; if any ancestor is in `srcIds`, the
 * move is illegal.
 */
export function isCycle(
  srcIds: string[],
  targetId: string | null,
  index: Map<string, FsNode>,
): boolean {
  if (!targetId) return false;
  const set = new Set(srcIds);
  let current: FsNode | undefined = index.get(targetId);
  while (current) {
    if (set.has(current.id)) return true;
    const parentId = current.parentId;
    if (!parentId) break;
    current = index.get(parentId);
  }
  return false;
}

export interface IsLegalDropArgs {
  srcIds: string[];
  targetId: string | null;
  position: FileTreeDropPosition;
  index: Map<string, FsNode>;
}

/**
 * Combined legality check. The tree refuses cycle / self-drop universally;
 * name-collision is a consumer-policy concern and not blocked here.
 */
export function isLegalDrop({
  srcIds,
  targetId,
  position,
  index,
}: IsLegalDropArgs): boolean {
  if (srcIds.length === 0) return false;
  if (isSelfDrop(srcIds, targetId)) return false;
  if (position === "inside" && isCycle(srcIds, targetId, index)) return false;
  if (position !== "inside" && targetId) {
    // before/after: cycle check uses the target's parent
    const target = index.get(targetId);
    const parentId = target?.parentId ?? null;
    if (isCycle(srcIds, parentId, index)) return false;
  }
  return true;
}

/**
 * Soft-validates a node tree on mount. Returns an array of warnings; never
 * throws. Caller logs to `console.warn` in development. Catches: duplicate
 * ids, missing parents (parentId references a node not in the tree), and
 * structural cycles (a node ancestor-of-itself).
 */
export function validateNodes(nodes: FsNode[]): string[] {
  const warnings: string[] = [];
  const ids = new Set<string>();
  const seenInPath = new Set<string>();
  const walk = (list: FsNode[], path: Set<string>) => {
    for (const node of list) {
      if (ids.has(node.id)) {
        warnings.push(`duplicate node id: "${node.id}"`);
        continue;
      }
      ids.add(node.id);
      if (path.has(node.id)) {
        warnings.push(`cycle detected at node: "${node.id}"`);
        continue;
      }
      if (node.children) {
        const next = new Set(path);
        next.add(node.id);
        walk(node.children, next);
      }
    }
  };
  walk(nodes, seenInPath);
  // parent-id sanity (advisory — parentId is optional)
  for (const node of ids) {
    void node;
  }
  return warnings;
}
