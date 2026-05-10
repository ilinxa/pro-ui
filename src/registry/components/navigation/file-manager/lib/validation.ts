import type { FsNode, FileManagerDropPosition } from "../types";

export function isSelfDrop(
  srcIds: string[],
  targetId: string | null,
): boolean {
  if (!targetId) return false;
  return srcIds.includes(targetId);
}

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
  position: FileManagerDropPosition;
  index: Map<string, FsNode>;
}

export function isLegalDrop({
  srcIds,
  targetId,
  position,
  index,
}: IsLegalDropArgs): boolean {
  if (srcIds.length === 0) return false;
  if (isSelfDrop(srcIds, targetId)) return false;
  if (position === "inside" && isCycle(srcIds, targetId, index)) return false;
  return true;
}

/** Soft-validate a node tree on mount. */
export function validateNodes(nodes: FsNode[]): string[] {
  const warnings: string[] = [];
  const ids = new Set<string>();
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
  walk(nodes, new Set());
  return warnings;
}
