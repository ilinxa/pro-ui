"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Optional default search bar — sibling export. Hosts can skip and wire their own input
 * directly into the `search` prop of RichCard.
 *
 * Bindings:
 *   F3 / Shift+F3 → next / previous match (handled by host or via the imperative handle)
 */
export function RichCardSearchBar({
  value,
  onChange,
  matchCount,
  activeIndex,
  onNext,
  onPrevious,
  onClear,
  placeholder = "Search cards…",
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  matchCount: number;
  activeIndex: number | null;
  onNext: () => void;
  onPrevious: () => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}) {
  const hasMatches = matchCount > 0;
  const noMatches = value.length > 0 && matchCount === 0;
  const display =
    activeIndex !== null && hasMatches
      ? `${activeIndex + 1} / ${matchCount}`
      : hasMatches
        ? `${matchCount} matches`
        : noMatches
          ? "no matches"
          : null;

  return (
    <div
      role="search"
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 shadow-sm",
        className,
      )}
    >
      <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search cards"
        onKeyDown={(e) => {
          if (e.key === "F3" || (e.key === "g" && (e.metaKey || e.ctrlKey))) {
            e.preventDefault();
            if (e.shiftKey) onPrevious();
            else onNext();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onClear();
          }
        }}
        className="min-w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
      />
      {display ? (
        <span
          aria-live="polite"
          className={cn(
            "shrink-0 font-mono text-[10px]",
            noMatches ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {display}
        </span>
      ) : null}
      {hasMatches ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 border-l border-border pl-1">
          <button
            type="button"
            onClick={onPrevious}
            aria-label="Previous match"
            className="inline-flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronUp className="size-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next match"
            className="inline-flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown className="size-3" aria-hidden="true" />
          </button>
        </span>
      ) : null}
      {value.length > 0 ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
