"use client";

import { cn } from "@/lib/utils";
import { FILTER_ORDER } from "../lib/filter-category";
import { useMediaLibrary } from "../hooks/use-media-library";
import type { MediaFilterCategory } from "../types";

/** Small category dots mirroring the reference design (semantic, not the brand accent). */
const DOT: Record<MediaFilterCategory, string> = {
  all: "bg-muted-foreground/50",
  images: "bg-violet-500",
  video: "bg-orange-500",
  pdfs: "bg-red-500",
  docs: "bg-sky-500",
};

/** Tier B — type-filter chips with live counts. */
export function MediaLibraryTypeFilters({ className }: { className?: string }) {
  const { filter, setFilter, filterCounts, labels } = useMediaLibrary();

  const labelFor: Record<MediaFilterCategory, string> = {
    all: labels.filterAll,
    images: labels.filterImages,
    video: labels.filterVideo,
    pdfs: labels.filterPdfs,
    docs: labels.filterDocs,
  };

  return (
    <div
      role="group"
      aria-label={labels.filesHeading}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {FILTER_ORDER.map((cat) => {
        const active = filter === cat;
        return (
          <button
            key={cat}
            type="button"
            aria-pressed={active}
            onClick={() => setFilter(cat)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary/15 font-medium text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span className={cn("size-2 rounded-full", DOT[cat])} aria-hidden="true" />
            {labelFor[cat]}
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                active ? "text-foreground/70" : "text-muted-foreground/70",
              )}
            >
              {filterCounts[cat]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
