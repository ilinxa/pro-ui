"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
// F-S1 lock: same-category cross-procomp via relative + specific-file path.
import { VideoPlayer } from "../../video-player/video-player";
import type { MediaRecovery } from "../hooks/use-media-recovery";
import type { FrameStyle } from "../lib/aspect";
import type { VideoPlayerLabels } from "../../video-player/types";
import type { MediaItem, RenderItemContext } from "../types";

interface SlideRendererProps {
  item: MediaItem;
  ctx: RenderItemContext;
  renderItem?: (item: MediaItem, ctx: RenderItemContext) => ReactNode;
  onDoubleTap?: (item: MediaItem, index: number) => void;
  /** Frame ratio (class or inline `aspect-ratio`), resolved by the root. */
  frame: FrameStyle;
  recovery: MediaRecovery;
  /** Set when the root still needs this item's natural size (`natural-clamped`, no dimensions). */
  onNaturalSize?: (width: number, height: number) => void;
  slideClassName?: string;
  /** BCP 47 locale for the built-in video player's time text. */
  locale?: string;
  /** `labels.video`, merged over the player defaults. */
  videoLabels?: VideoPlayerLabels;
}

/**
 * Renders a single slide. Three paths:
 *   1. `renderItem` provided → consumer takes over.
 *   2. `item.type === "image"` → built-in <img> handler.
 *   3. `item.type === "video"` → built-in <VideoPlayer>; plays only while `isActive && inView`.
 *
 * The video handler is a deliberate cross-folder import — see Q-P1 in the plan
 * doc and the project memory note on the refined sealed-folder rule.
 */
export function SlideRenderer({
  item,
  ctx,
  renderItem,
  onDoubleTap,
  frame,
  recovery,
  onNaturalSize,
  slideClassName,
  locale,
  videoLabels,
}: SlideRendererProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const src = recovery.urlFor(item);
  const reportError = recovery.onError;
  // A video item's `alt` names its player and wins over `labels.video.videoLabel`.
  const alt = item.type === "video" ? item.alt : undefined;
  const playerLabels = useMemo<VideoPlayerLabels | undefined>(
    () => (alt ? { ...videoLabels, videoLabel: alt } : videoLabels),
    [videoLabels, alt],
  );

  // An image that finished (or failed) before hydration — or was already loaded when it became
  // the first item — fires no event the handlers can see: read its state instead.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !img.complete || !img.getAttribute("src")) return;
    if (img.naturalWidth > 0) {
      onNaturalSize?.(img.naturalWidth, img.naturalHeight);
      return;
    }
    // Width 0 is also a loaded SVG without intrinsic size — only a failed decode is broken.
    if (typeof img.decode !== "function") return;
    // (Asking twice is impossible: recovery asks once per item + URL.)
    img.decode().catch(() => reportError(item));
  },[src, item, onNaturalSize, reportError]);

  const frameClass = cn(frame.className, "overflow-hidden", slideClassName);
  const frameStyle: CSSProperties | undefined = frame.style;

  if (renderItem) {
    return (
      <div className={frameClass} style={frameStyle}>
        {renderItem(item, ctx)}
      </div>
    );
  }

  if (item.type === "image") {
    return (
      <div className={frameClass} style={frameStyle}>
        <img
          ref={imgRef}
          src={src}
          srcSet={src === item.url ? item.srcSet : undefined}
          sizes={src === item.url ? item.sizes : undefined}
          width={item.width}
          height={item.height}
          alt={item.alt ?? ""}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onLoad={
            onNaturalSize
              ? (e) => onNaturalSize(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)
              : undefined
          }
          onError={() => recovery.onError(item)}
        />
      </div>
    );
  }

  return (
    <div ref={frameRef} className={frameClass} style={frameStyle}>
      <VideoPlayer
        src={src}
        poster={item.poster}
        locale={locale}
        labels={playerLabels}
        isActive={ctx.isActive && ctx.inView}
        onDoubleTap={
          onDoubleTap ? () => onDoubleTap(item, ctx.index) : undefined
        }
        onLoadedMetadata={
          onNaturalSize
            ? () => {
                const video = frameRef.current?.querySelector("video");
                if (video) onNaturalSize(video.videoWidth, video.videoHeight);
              }
            : undefined
        }
        // Through the player, so it shows buffering while the URL refreshes and resumes at the
        // same time (VP4). The carousel still asks once per item + URL.
        onMediaError={recovery.enabled ? () => recovery.request(item) : undefined}
      />
    </div>
  );
}
