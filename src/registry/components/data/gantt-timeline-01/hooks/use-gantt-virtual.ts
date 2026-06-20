"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { RefObject } from "react";
import type { GanttRenderItem } from "../types";

/**
 * Row virtualization (mirrors todo-tree's `use-tree-virtual`). Virtualizes when
 * the row count crosses `threshold` AND a scroll element exists; otherwise
 * returns every row at its natural offset (the gutter-only / small-list
 * fallback). Both the gutter and the body consume the returned `renderItems`,
 * so they share one source of truth and stay vertically aligned.
 */
export function useGanttVirtual(args: {
  count: number;
  scrollRef: RefObject<HTMLDivElement | null>;
  rowHeight: number;
  threshold?: number;
}): { renderItems: GanttRenderItem[]; totalSize: number; measure: () => void } {
  const { count, scrollRef, rowHeight, threshold = 60 } = args;
  const active = count >= threshold;

  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
    enabled: active,
  });

  if (active) {
    const renderItems: GanttRenderItem[] = virtualizer
      .getVirtualItems()
      .map((vi) => ({ index: vi.index, start: vi.start }));
    return {
      renderItems,
      totalSize: virtualizer.getTotalSize(),
      measure: () => virtualizer.measure(),
    };
  }

  const renderItems: GanttRenderItem[] = Array.from(
    { length: count },
    (_, index) => ({ index, start: index * rowHeight }),
  );
  return { renderItems, totalSize: count * rowHeight, measure: () => {} };
}
