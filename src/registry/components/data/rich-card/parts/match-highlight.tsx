import { Fragment } from "react";
import { cn } from "@/lib/utils";

export type HighlightRange = { start: number; length: number };

/**
 * Wraps matched substrings in <mark>. Active ranges get a distinct style.
 * Non-matched portions render as plain text.
 *
 * Used by every text-rendering location in the tree to display search hits.
 * When `ranges` is empty, this is a transparent passthrough.
 */
export function MatchHighlight({
  text,
  ranges,
  activeRange,
  className,
}: {
  text: string;
  ranges: readonly HighlightRange[];
  activeRange?: HighlightRange;
  className?: string;
}) {
  if (ranges.length === 0) {
    return className ? <span className={className}>{text}</span> : <>{text}</>;
  }
  // Sort and merge ranges
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const segments: Array<{
    start: number;
    end: number;
    highlight: boolean;
    isActive: boolean;
  }> = [];
  let cursor = 0;
  for (const r of sorted) {
    if (r.start < cursor) continue; // skip overlapping
    if (r.start > cursor) {
      segments.push({ start: cursor, end: r.start, highlight: false, isActive: false });
    }
    const isActive =
      activeRange !== undefined &&
      activeRange.start === r.start &&
      activeRange.length === r.length;
    segments.push({
      start: r.start,
      end: r.start + r.length,
      highlight: true,
      isActive,
    });
    cursor = r.start + r.length;
  }
  if (cursor < text.length) {
    segments.push({ start: cursor, end: text.length, highlight: false, isActive: false });
  }
  return (
    <span className={className}>
      {segments.map((s, i) => {
        const slice = text.slice(s.start, s.end);
        if (!s.highlight) return <Fragment key={i}>{slice}</Fragment>;
        return (
          <mark
            key={i}
            className={cn(
              "rounded-sm bg-amber-200/70 text-foreground dark:bg-amber-500/30",
              s.isActive && "bg-amber-400 text-foreground dark:bg-amber-400/80",
            )}
          >
            {slice}
          </mark>
        );
      })}
    </span>
  );
}
