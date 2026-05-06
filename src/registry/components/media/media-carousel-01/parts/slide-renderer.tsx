"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VideoPlayer01 } from "@/registry/components/media/video-player-01";
import type {
  LinearAspect,
  MediaCarousel01Variant,
  MediaItem,
  RenderItemContext,
} from "../types";

interface SlideRendererProps {
  item: MediaItem;
  ctx: RenderItemContext;
  renderItem?: (item: MediaItem, ctx: RenderItemContext) => ReactNode;
  onDoubleTap?: (item: MediaItem, index: number) => void;
  variant: MediaCarousel01Variant;
  aspect: LinearAspect;
  slideClassName?: string;
  /** True when this is the single-item shortcut. */
  isSingleItem?: boolean;
}

const ASPECT_CLASS: Record<LinearAspect, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  auto: "",
};

/**
 * Renders a single slide. Three paths:
 *   1. `renderItem` provided → consumer takes over.
 *   2. `item.type === "image"` → built-in <img> handler.
 *   3. `item.type === "video"` → built-in <VideoPlayer01> handler with isActive propagation.
 *
 * The video handler is a deliberate cross-folder import — see Q-P1 in the plan
 * doc and the project memory note on the refined sealed-folder rule.
 */
export function SlideRenderer({
  item,
  ctx,
  renderItem,
  onDoubleTap,
  variant,
  aspect,
  slideClassName,
  isSingleItem = false,
}: SlideRendererProps) {
  // Aspect ratio: gallery + single-item are always square; linear uses prop.
  const aspectClass =
    variant === "gallery" || isSingleItem
      ? "aspect-square"
      : ASPECT_CLASS[aspect];

  if (renderItem) {
    return (
      <div className={cn(aspectClass, "overflow-hidden", slideClassName)}>
        {renderItem(item, ctx)}
      </div>
    );
  }

  if (item.type === "image") {
    return (
      <div className={cn(aspectClass, "overflow-hidden", slideClassName)}>
        <img
          src={item.url}
          alt={item.alt ?? ""}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn(aspectClass, "overflow-hidden", slideClassName)}>
      <VideoPlayer01
        src={item.url}
        poster={item.poster}
        isActive={ctx.isActive}
        onDoubleTap={
          onDoubleTap ? () => onDoubleTap(item, ctx.index) : undefined
        }
      />
    </div>
  );
}
