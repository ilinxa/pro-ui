"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock: same-category cross-procomp via relative + specific-file path.
import { useDoubleTap } from "../../video-player-01/hooks/use-double-tap";
import { SlideRenderer } from "./slide-renderer";
import type {
  LinearAspect,
  MediaCarousel01Labels,
  MediaCarousel01Variant,
  MediaItem,
  RenderItemContext,
} from "../types";

interface SingleItemProps {
  item: MediaItem;
  renderItem?: (item: MediaItem, ctx: RenderItemContext) => ReactNode;
  onDoubleTap?: (item: MediaItem, index: number) => void;
  labels: Required<MediaCarousel01Labels>;
  variant: MediaCarousel01Variant;
  aspect: LinearAspect;
  className?: string;
  slideClassName?: string;
}

/**
 * Single-item shortcut — bypass Embla entirely.
 *
 * Lives in its own component so `useDoubleTap` is called unconditionally
 * within it (own hook count, distinct from `<CarouselTrack>`). Switching
 * between single-item and carousel modes happens via component swap at
 * the root, not conditional hook calls.
 */
export function SingleItem({
  item,
  renderItem,
  onDoubleTap,
  labels,
  variant,
  aspect,
  className,
  slideClassName,
}: SingleItemProps) {
  const handleDoubleTap = useDoubleTap(
    onDoubleTap ? () => onDoubleTap(item, 0) : undefined,
  );

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden bg-muted",
        className,
      )}
      onClick={handleDoubleTap}
      aria-label={labels.carouselLabel}
    >
      <SlideRenderer
        item={item}
        ctx={{ isActive: true, index: 0 }}
        renderItem={renderItem}
        // Already handled at wrapper level; don't double-fire.
        onDoubleTap={undefined}
        variant={variant}
        aspect={aspect}
        slideClassName={slideClassName}
        isSingleItem
      />
    </div>
  );
}
