"use client";

import { useFileManager } from "../hooks/use-file-manager-context";
import { formatBytes } from "../lib/format";

export function FileManagerStatusBar() {
  const { state, visibleCount, totalSize, labels } = useFileManager();
  const selectedCount = state.selectedIds.size;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-7 shrink-0 items-center gap-3 border-t border-border/60 bg-card/40 px-3 text-xs text-muted-foreground"
    >
      <span>
        {visibleCount} {labels.itemCount}
      </span>
      {selectedCount > 0 ? (
        <span>
          {selectedCount} {labels.itemCountSelected}
        </span>
      ) : null}
      {totalSize > 0 ? (
        <span className="ml-auto font-mono">
          {formatBytes(totalSize)} {labels.totalSize}
        </span>
      ) : null}
    </div>
  );
}
