"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaLibrary } from "../hooks/use-media-library";

/** Tier B — breadcrumb path bar. Walks the current folder's `parentId` chain. */
export function MediaLibraryBreadcrumbs({ className }: { className?: string }) {
  const { path, navigateTo, labels } = useMediaLibrary();

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex flex-wrap items-center gap-0.5 text-sm", className)}
    >
      <button
        type="button"
        onClick={() => navigateTo(null)}
        aria-current={path.length === 0 ? "page" : undefined}
        className={cn(
          "rounded px-1.5 py-0.5 font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          path.length === 0 ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {labels.libraryHeading}
      </button>
      {path.map((node, i) => {
        const isLast = i === path.length - 1;
        return (
          <span key={node.id} className="flex items-center gap-0.5">
            <ChevronRight
              className="size-3.5 shrink-0 text-muted-foreground/50"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => navigateTo(node.id)}
              aria-current={isLast ? "page" : undefined}
              className={cn(
                "max-w-[12rem] truncate rounded px-1.5 py-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isLast ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {node.name}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
