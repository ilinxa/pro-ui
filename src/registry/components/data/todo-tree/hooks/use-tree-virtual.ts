"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { RefObject } from "react";
import type { TodoTreeVisibleRow } from "../types";

export type TodoTreeVirtualizeMode = "auto" | "always" | "never";

interface UseTreeVirtualArgs {
  rows: ReadonlyArray<TodoTreeVisibleRow>;
  scrollRef: RefObject<HTMLDivElement | null>;
  mode: TodoTreeVirtualizeMode;
  /** Threshold for "auto" mode — count of TOTAL rows (not visible) per R9. */
  threshold: number;
  /** Fixed row height. Default 52px for the 2-line layout (Q-P2). */
  rowHeight: number;
  /**
   * When true, virtualization auto-suspends regardless of mode — drag is the
   * canonical use case (R7 mitigation: virtualizer + DnD scroll snap fights).
   */
  suspended?: boolean;
}

export interface UseTreeVirtualResult {
  /** True when virtualization is active for this render. */
  active: boolean;
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, HTMLDivElement>>;
}

/**
 * Virtualizer wrapper around `@tanstack/react-virtual`. Threshold check uses
 * TOTAL items count (not visible) per R9 so the filter doesn't defeat the
 * optimization — a filter that hides 90% of rows on a 1000-item tree still
 * benefits from virtualization on the unfiltered sibling.
 */
export function useTreeVirtual(args: UseTreeVirtualArgs): UseTreeVirtualResult {
  const { rows, scrollRef, mode, threshold, rowHeight, suspended } = args;

  const active =
    !suspended &&
    (mode === "always" || (mode === "auto" && rows.length >= threshold));

  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
    enabled: active,
  });

  return { active, virtualizer };
}
