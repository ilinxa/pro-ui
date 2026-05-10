"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { RefObject } from "react";
import type { FileTreeRow, FileTreeVirtualizeMode } from "../types";

interface UseTreeVirtualArgs {
  rows: FileTreeRow[];
  scrollRef: RefObject<HTMLDivElement | null>;
  mode: FileTreeVirtualizeMode;
  threshold: number;
  rowHeight: number;
}

export interface UseTreeVirtualResult {
  /** `true` when virtualization is active. */
  active: boolean;
  /** Virtualizer instance — only meaningful when `active`. */
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, HTMLDivElement>>;
}

export function useTreeVirtual(
  args: UseTreeVirtualArgs,
): UseTreeVirtualResult {
  const { rows, scrollRef, mode, threshold, rowHeight } = args;
  const active =
    mode === "always" || (mode === "auto" && rows.length >= threshold);

  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
    enabled: active,
  });

  return { active, virtualizer };
}
