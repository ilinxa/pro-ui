import type { MediaNode } from "../types";

/** Payload carried by a card drag (one or more selected node ids). */
export interface MediaDragData {
  type: "media-node";
  ids: string[];
}

/** Build a `parentId` lookup by walking the (possibly partial) tree. */
export function buildParentMap(nodes: MediaNode[]): Map<string, string | null> {
  const map = new Map<string, string | null>();
  const walk = (list: MediaNode[], parentId: string | null) => {
    for (const n of list) {
      map.set(n.id, n.parentId ?? parentId);
      if (n.children) walk(n.children, n.id);
    }
  };
  walk(nodes, null);
  return map;
}

/** Is `maybeAncestorId` an ancestor of (or equal to) `nodeId`, per the parent map? */
export function isAncestor(
  parentMap: Map<string, string | null>,
  maybeAncestorId: string,
  nodeId: string,
): boolean {
  let cur: string | null | undefined = nodeId;
  const seen = new Set<string>();
  while (cur != null) {
    if (cur === maybeAncestorId) return true;
    if (seen.has(cur)) break; // cycle guard
    seen.add(cur);
    cur = parentMap.get(cur);
  }
  return false;
}

/**
 * Can `draggedIds` drop into `targetFolderId` (null = root)?
 * Rejects: target not a folder; dropping a node onto itself; dropping a folder
 * into its own subtree; a pure no-op (already the current parent of all).
 */
export function canDropInto(
  draggedIds: string[],
  targetFolderId: string | null,
  nodes: MediaNode[],
  parentMap: Map<string, string | null> = buildParentMap(nodes),
): boolean {
  if (draggedIds.length === 0) return false;

  if (targetFolderId !== null) {
    const target = findNode(nodes, targetFolderId);
    if (!target || target.type !== "folder") return false;
    // can't drop a node onto itself, or a folder into its own descendant
    for (const id of draggedIds) {
      if (id === targetFolderId) return false;
      if (isAncestor(parentMap, id, targetFolderId)) return false;
    }
  }

  // reject a pure no-op (every dragged node already lives in the target)
  const allAlreadyHere = draggedIds.every((id) => (parentMap.get(id) ?? null) === targetFolderId);
  if (allAlreadyHere) return false;

  return true;
}

/** Depth-first find by id across the (partial) tree. */
export function findNode(nodes: MediaNode[], id: string): MediaNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const hit = findNode(n.children, id);
      if (hit) return hit;
    }
  }
  return undefined;
}
