"use client";

import { useMemo } from "react";
import type { FileTreeRow, FsNode } from "../types";
import { defaultSort } from "../lib/tree-utils";

interface UseTreeFlattenArgs {
  nodes: FsNode[];
  expandedIds: ReadonlySet<string>;
  selectedIds: ReadonlySet<string>;
  focusedId: string | null;
  loadingFolderIds: ReadonlySet<string>;
  showHidden: boolean;
  isHidden?: (node: FsNode) => boolean;
  sortNodes: ((a: FsNode, b: FsNode) => number) | false | undefined;
}

const defaultIsHidden = (node: FsNode) => node.name.startsWith(".");

/**
 * Walks the tree, applies sort + visibility, returns the visible-row array
 * the virtualizer (and naive renderer) consume.
 */
export function useTreeFlatten(args: UseTreeFlattenArgs): FileTreeRow[] {
  const {
    nodes,
    expandedIds,
    selectedIds,
    focusedId,
    loadingFolderIds,
    showHidden,
    isHidden,
    sortNodes,
  } = args;

  return useMemo(() => {
    const rows: FileTreeRow[] = [];
    const hiddenFn = isHidden ?? defaultIsHidden;
    const sorter = sortNodes === false ? null : sortNodes ?? defaultSort;

    const walk = (list: FsNode[], depth: number) => {
      const filtered = showHidden
        ? list
        : list.filter((node) => !hiddenFn(node));
      const sorted = sorter ? [...filtered].sort(sorter) : filtered;
      const siblingCount = sorted.length;
      sorted.forEach((node, siblingIdx) => {
        const isFolder = node.type === "folder";
        const expanded = isFolder && expandedIds.has(node.id);
        const childrenLoaded = isFolder && node.children !== undefined;
        const hasChildren =
          isFolder &&
          (node.children === undefined || (node.children?.length ?? 0) > 0);
        rows.push({
          node,
          depth,
          expanded,
          selected: selectedIds.has(node.id),
          focused: focusedId === node.id,
          hasChildren,
          childrenLoaded,
          loadingChildren: loadingFolderIds.has(node.id),
          index: rows.length,
          siblingCount,
          siblingIndex: siblingIdx + 1,
        });
        if (expanded && node.children?.length) {
          walk(node.children, depth + 1);
        }
        // Empty (`children: []`) folders render an "(empty)" placeholder row
        // inline; the row component handles that, not the flatten.
      });
    };
    walk(nodes, 0);
    return rows;
  }, [
    nodes,
    expandedIds,
    selectedIds,
    focusedId,
    loadingFolderIds,
    showHidden,
    isHidden,
    sortNodes,
  ]);
}
