"use client";

import { useFileTree } from "../hooks/use-file-tree-context";

export function FileTreeLoading() {
  const { labels } = useFileTree();
  return (
    <div
      className="flex flex-col gap-1 px-2 py-2"
      role="status"
      aria-label={labels.loading}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-1 py-1"
          style={{ paddingLeft: `${(i % 3) * 12 + 8}px` }}
        >
          <div className="size-3.5 animate-pulse rounded-sm bg-muted" />
          <div
            className="h-3 animate-pulse rounded-sm bg-muted"
            style={{ width: `${60 + (i * 7) % 30}%` }}
          />
        </div>
      ))}
    </div>
  );
}
