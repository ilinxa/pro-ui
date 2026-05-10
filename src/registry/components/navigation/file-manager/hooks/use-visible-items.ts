"use client";

import { useMemo } from "react";
import type {
  FileClipboard,
  FileManagerItem,
  FileManagerSortState,
  FsNode,
} from "../types";
import { defaultSort, getChildrenOf } from "../lib/tree-utils";
import { getNodeExtension } from "../lib/icons";

interface UseVisibleItemsArgs {
  nodes: FsNode[];
  index: Map<string, FsNode>;
  currentFolderId: string | null;
  selectedIds: ReadonlySet<string>;
  focusedId: string | null;
  clipboard: FileClipboard;
  sort: FileManagerSortState;
  searchQuery: string;
  showHidden: boolean;
  isHidden?: (node: FsNode) => boolean;
  filterItems?: (node: FsNode, query: string) => boolean;
  sortItems?: (a: FsNode, b: FsNode, sort: FileManagerSortState) => number;
}

const defaultIsHidden = (node: FsNode) => node.name.startsWith(".");

const defaultFilter = (node: FsNode, query: string) =>
  node.name.toLowerCase().includes(query.toLowerCase());

function defaultSortBy(
  a: FsNode,
  b: FsNode,
  sort: FileManagerSortState,
): number {
  // folders always before files regardless of sort key (Mac Finder behavior)
  if (a.type !== b.type) return a.type === "folder" ? -1 : 1;

  let cmp = 0;
  switch (sort.key) {
    case "name":
      cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      break;
    case "modified": {
      const ta = a.modifiedAt ? new Date(a.modifiedAt).getTime() : 0;
      const tb = b.modifiedAt ? new Date(b.modifiedAt).getTime() : 0;
      cmp = ta - tb;
      break;
    }
    case "size":
      cmp = (a.size ?? 0) - (b.size ?? 0);
      break;
    case "type": {
      const ea = getNodeExtension(a);
      const eb = getNodeExtension(b);
      cmp = ea.localeCompare(eb, undefined, { sensitivity: "base" });
      if (cmp === 0) {
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }
      break;
    }
  }
  return sort.order === "asc" ? cmp : -cmp;
}

export interface UseVisibleItemsResult {
  items: FileManagerItem[];
  /** Total size in bytes across visible items (folders contribute 0). */
  totalSize: number;
  /** Visible item count (post-filter, post-hidden). */
  visibleCount: number;
}

export function useVisibleItems(
  args: UseVisibleItemsArgs,
): UseVisibleItemsResult {
  const {
    nodes,
    index,
    currentFolderId,
    selectedIds,
    focusedId,
    clipboard,
    sort,
    searchQuery,
    showHidden,
    isHidden,
    filterItems,
    sortItems,
  } = args;

  return useMemo(() => {
    const children = getChildrenOf(currentFolderId, nodes, index) ?? [];
    const hiddenFn = isHidden ?? defaultIsHidden;
    const filterFn = filterItems ?? defaultFilter;
    const sorter = sortItems
      ? (a: FsNode, b: FsNode) => sortItems(a, b, sort)
      : (a: FsNode, b: FsNode) => defaultSortBy(a, b, sort);

    let filtered = showHidden
      ? [...children]
      : children.filter((n) => !hiddenFn(n));
    if (searchQuery.trim()) {
      filtered = filtered.filter((n) => filterFn(n, searchQuery));
    }
    filtered.sort(sorter);

    const cutSet = new Set(
      clipboard.kind === "cut" ? clipboard.ids : [],
    );

    const total = filtered.length;
    const totalSize = filtered.reduce(
      (sum, node) => sum + (node.type === "file" ? (node.size ?? 0) : 0),
      0,
    );
    const items: FileManagerItem[] = filtered.map((node, i) => ({
      node,
      selected: selectedIds.has(node.id),
      focused: focusedId === node.id,
      cut: cutSet.has(node.id),
      index: i,
      totalVisible: total,
    }));

    return { items, totalSize, visibleCount: total };
  }, [
    nodes,
    index,
    currentFolderId,
    selectedIds,
    focusedId,
    clipboard,
    sort,
    searchQuery,
    showHidden,
    isHidden,
    filterItems,
    sortItems,
  ]);
}

// fallback so the unused-import lint doesn't fire when defaultSort is
// referenced by tree-utils consumers expecting it to be available
void defaultSort;
