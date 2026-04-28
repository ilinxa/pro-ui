"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, type RefObject } from "react";
import type { RichCardTree } from "../lib/parse";
import { visibleIdsInOrder } from "../lib/reducer";

const ESTIMATED_CARD_HEIGHT = 56; // px — average; per-card ResizeObserver corrects in @tanstack
const OVERSCAN = 5;

export function useTreeVirtualizer(
  tree: RichCardTree,
  collapsed: ReadonlySet<string>,
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const visibleIds = useMemo(
    () => visibleIdsInOrder(tree, collapsed),
    [tree, collapsed],
  );

  const virtualizer = useVirtualizer({
    count: enabled ? visibleIds.length : 0,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ESTIMATED_CARD_HEIGHT,
    overscan: OVERSCAN,
    enabled,
  });

  return { virtualizer, visibleIds };
}

/**
 * Resolve `virtualize` prop value (`true | false | 'auto'`) into a definitive boolean.
 * 'auto' enables when the tree exceeds 500 nodes.
 */
export function resolveVirtualize(
  virtualize: boolean | "auto" | undefined,
  nodeCount: number,
): boolean {
  if (virtualize === true) return true;
  if (virtualize === "auto") return nodeCount > 500;
  return false;
}

/**
 * Count the total nodes in a tree (cheap O(n) walk).
 */
export function countNodes(tree: RichCardTree): number {
  let n = 1;
  for (const c of tree.children) n += countNodes(c);
  return n;
}
