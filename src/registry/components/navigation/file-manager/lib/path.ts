import type { FsNode } from "../types";
import { getParentChain } from "./tree-utils";

/**
 * Build the path from root → ... → currentFolder. Empty array when at root
 * (`currentFolderId === null`). Returns the chain of FsNodes.
 */
export function buildPath(
  currentFolderId: string | null,
  index: Map<string, FsNode>,
): FsNode[] {
  if (currentFolderId === null) return [];
  const current = index.get(currentFolderId);
  if (!current) return [];
  const chain = getParentChain(currentFolderId, index);
  return [...chain, current];
}

/**
 * Best-effort string-to-id resolution. Looks for a node whose name path
 * (from root) matches the typed segments. Returns the id of the matching
 * folder, or `null` if no match.
 *
 * Consumer typically provides their own resolver via `onPathTyped`; this
 * helper is for the simple case where path segments map directly to node
 * names.
 */
export function parsePath(
  path: string,
  nodes: FsNode[],
): string | null {
  const segments = path.split(/[/\\]/).filter(Boolean);
  if (segments.length === 0) return null;

  let current: FsNode[] | undefined = nodes;
  let lastMatchId: string | null = null;
  for (const segment of segments) {
    if (!current) return null;
    const match: FsNode | undefined = current.find(
      (n: FsNode) =>
        n.type === "folder" &&
        n.name.localeCompare(segment, undefined, { sensitivity: "base" }) ===
          0,
    );
    if (!match) return null;
    lastMatchId = match.id;
    current = match.children;
  }
  return lastMatchId;
}
