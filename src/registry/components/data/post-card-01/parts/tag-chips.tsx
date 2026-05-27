"use client";

import { cn } from "@/lib/utils";

export interface TagChipsProps {
  /** Hashtag list (rendered as `#{tag}` buttons). */
  tags: string[];
  /** Click handler for each chip. When omitted, chips render as disabled buttons. */
  onTagClick?: (tag: string) => void;
  /** Class for the outer flex wrapper. */
  className?: string;
  /** Class for individual chip buttons. */
  chipClassName?: string;
}

/**
 * Sealed RSC-compatible tag-chip row rendered as a sibling to the post content
 * body (NOT inside `<ExpandableText01>`'s clamping — auto-rendered by the 4
 * variants when `post.tags?.length > 0` per F-Plan-7 closure).
 *
 * Sub-exported from `post-card-01/index.ts` for hosts wanting to render the
 * chips elsewhere (e.g. above the header, beside the location chip).
 */
export function TagChips({
  tags,
  onTagClick,
  className,
  chipClassName,
}: TagChipsProps) {
  if (tags.length === 0) return null;
  return (
    <div
      className={cn(
        "relative z-10 flex flex-wrap items-center gap-1.5",
        className,
      )}
    >
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
          disabled={!onTagClick}
          className={cn(
            "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
            onTagClick &&
              "transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !onTagClick && "cursor-default",
            chipClassName,
          )}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}

TagChips.displayName = "TagChips";
