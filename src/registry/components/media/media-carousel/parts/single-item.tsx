"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock: same-category cross-procomp via relative + specific-file path.
import { useDoubleTap } from "../../video-player/hooks/use-double-tap";
import { useInView } from "../hooks/use-environment";
import type { MediaRecovery } from "../hooks/use-media-recovery";
import type { FrameStyle } from "../lib/aspect";
import { SlideRenderer } from "./slide-renderer";
import type {
  MediaItem,
  RenderItemContext,
  ResolvedMediaCarouselLabels,
} from "../types";

interface SingleItemProps {
  item: MediaItem;
  renderItem?: (item: MediaItem, ctx: RenderItemContext) => ReactNode;
  onDoubleTap?: (item: MediaItem, index: number) => void;
  labels: ResolvedMediaCarouselLabels;
  frame: FrameStyle;
  recovery: MediaRecovery;
  onNaturalSize?: (width: number, height: number) => void;
  /** Explicit direction; written on the root so a `renderItem` follows it. */
  dir?: "ltr" | "rtl";
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
  frame,
  recovery,
  onNaturalSize,
  dir,
  className,
  slideClassName,
}: SingleItemProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);
  const handleDoubleTap = useDoubleTap(
    onDoubleTap ? () => onDoubleTap(item, 0) : undefined,
  );

  return (
    <div
      ref={rootRef}
      role="group"
      dir={dir}
      className={cn("relative overflow-hidden bg-muted", className)}
      onClick={handleDoubleTap}
      aria-label={labels.carouselLabel}
    >
      <SlideRenderer
        item={item}
        ctx={{ isActive: true, inView, index: 0 }}
        renderItem={renderItem}
        // Already handled at wrapper level; don't double-fire.
        onDoubleTap={undefined}
        frame={frame}
        recovery={recovery}
        onNaturalSize={onNaturalSize}
        slideClassName={slideClassName}
      />
    </div>
  );
}
