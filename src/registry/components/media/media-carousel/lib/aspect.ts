import type { CSSProperties } from "react";
import type { MediaCarouselAspect, MediaItem } from "../types";

export const DEFAULT_MIN_RATIO = 4 / 5;
export const DEFAULT_MAX_RATIO = 1.91;

const FIXED_CLASS: Record<Exclude<MediaCarouselAspect, "natural-clamped">, string> = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  auto: "",
};

/** `w / h` clamped to `[min, max]`; `null` when the size is unknown or invalid. */
export function clampRatio(
  width: number | undefined,
  height: number | undefined,
  min: number,
  max: number,
): number | null {
  if (!width || !height || !Number.isFinite(width / height) || width <= 0 || height <= 0) return null;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.min(hi, Math.max(lo, width / height));
}

/** The intrinsic size an item declares, if any. */
export function declaredRatio(item: MediaItem | undefined, min: number, max: number): number | null {
  return item ? clampRatio(item.width, item.height, min, max) : null;
}

export interface FrameStyle {
  className: string;
  style?: CSSProperties;
}

/**
 * The slide frame: a fixed aspect class, or for `natural-clamped` an inline `aspect-ratio`
 * (`ratio` = the clamped natural ratio; square until it is known).
 */
export function frameFor(aspect: MediaCarouselAspect, ratio: number | null): FrameStyle {
  if (aspect !== "natural-clamped") return { className: FIXED_CLASS[aspect] };
  if (ratio === null) return { className: "aspect-square" };
  return { className: "", style: { aspectRatio: String(ratio) } };
}
