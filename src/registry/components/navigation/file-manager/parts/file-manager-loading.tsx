"use client";

import { useFileManager } from "../hooks/use-file-manager-context";

export function FileManagerLoading() {
  const { labels } = useFileManager();
  return (
    <div
      className="grid gap-2 p-3"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
      }}
      role="status"
      aria-label={labels.loading}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2 p-2">
          <div
            className="h-12 w-12 animate-pulse rounded-md bg-muted"
            style={{ animationDelay: `${i * 80}ms` }}
          />
          <div
            className="h-3 w-3/4 animate-pulse rounded-sm bg-muted"
            style={{ animationDelay: `${i * 80 + 40}ms` }}
          />
        </div>
      ))}
    </div>
  );
}
