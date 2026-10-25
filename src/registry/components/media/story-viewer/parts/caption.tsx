import type { StoryItem } from "../types";

export interface CaptionProps {
  item: StoryItem;
  /** Lift the caption above the reply / engagement row (viewer mode). */
  raised?: boolean;
}

/**
 * 0.6.0 (SV12) - plain-text caption over the lower part of the media. Always a text node
 * (never HTML) with `dir="auto"` so mixed-direction content lays out correctly.
 */
export function Caption({ item, raised = false }: CaptionProps) {
  if (!item.caption) return null;
  return (
    <div
      data-story-caption=""
      className={`pointer-events-none absolute inset-x-0 z-15 px-4 pt-10 pb-3 bg-linear-to-t from-media-overlay via-media-overlay/50 to-transparent ${
        raised ? "bottom-14" : "bottom-0"
      }`}
    >
      <p
        dir="auto"
        className="line-clamp-4 text-sm leading-snug text-media-overlay-foreground whitespace-pre-line wrap-break-word"
      >
        {item.caption}
      </p>
    </div>
  );
}
