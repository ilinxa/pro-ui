"use client";

import { cn } from "@/lib/utils";
// Cross-category (data/) static import: the registry rewriter handles it, the registry.json item
// declares `@ilinxa/expandable-text`.
import { ExpandableText } from "@/registry/components/data/expandable-text/expandable-text";
import type { ResolvedMediaCarouselLabels } from "../types";

interface SlideCaptionProps {
  caption: string;
  lines: number;
  className?: string;
  /** Only the active slide's toggle is reachable; an inactive slide is `aria-hidden`. */
  active: boolean;
  labels: Pick<ResolvedMediaCarouselLabels, "captionShowMore" | "captionShowLess">;
}

/**
 * The caption under a slide's frame. Lives inside the slide's `role="group"`, so it is read once
 * with its slide. `inert` on inactive slides keeps the Show more toggle out of the tab order
 * (nothing focusable under `aria-hidden`).
 */
export function SlideCaption({ caption, lines, className, active, labels }: SlideCaptionProps) {
  return (
    <div
      inert={!active}
      className={cn("px-1 pt-2 motion-safe:transition-opacity motion-safe:duration-300", !active && "opacity-60")}
    >
      <ExpandableText
        content={caption}
        maxLines={lines}
        dir="auto"
        labels={{ showMore: labels.captionShowMore, showLess: labels.captionShowLess }}
        contentClassName={cn("text-sm text-foreground", className)}
      />
    </div>
  );
}
