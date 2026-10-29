import type { CSSProperties } from "react";
import type { LinearAspect, MediaCarouselAspect, MediaItem } from "../types";

export const DEFAULT_MIN_RATIO = 4 / 5;
export const DEFAULT_MAX_RATIO = 1.91;

const FIXED_CLASS: Record<LinearAspect, string> = {
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

const warnedAspects = new Set<string>();
const warnedPeek = new Set<string>();

export const DEFAULT_PEEK_RATIO = 0.075;
export const MAX_PEEK_RATIO = 0.45;

/**
 * `peekRatio` sets the slide width (`1 - 2 x peek`): clamp to `[0, 0.45]`, non-finite -> the
 * default; one dev warning per out-of-range value.
 */
export function resolvePeekRatio(value: number): number {
  if (Number.isFinite(value) && value >= 0 && value <= MAX_PEEK_RATIO) return value;
  if (process.env.NODE_ENV !== "production" && !warnedPeek.has(String(value))) {
    warnedPeek.add(String(value));
    console.warn(`[MediaCarousel] peekRatio ${String(value)} is outside [0, ${MAX_PEEK_RATIO}]; it was adjusted.`);
  }
  if (!Number.isFinite(value)) return DEFAULT_PEEK_RATIO;
  return Math.min(MAX_PEEK_RATIO, Math.max(0, value));
}

function parsePositive(part: string): number | null {
  if (part === "" || part !== part.trim()) return null;
  const n = Number(part);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** `"W:H"` -> width / height (the same rule as media-editor's crop aspect); `null` when invalid. */
export function parseRatio(aspect: string): number | null {
  const parts = aspect.split(":");
  if (parts.length !== 2) return null;
  const w = parsePositive(parts[0]!);
  const h = parsePositive(parts[1]!);
  if (w === null || h === null) return null;
  const ratio = w / h;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
}

/**
 * The slide frame: a fixed aspect class, a `"W:H"` inline `aspect-ratio` (invalid -> square,
 * one dev warning), or for `natural-clamped` an inline `aspect-ratio` (`ratio` = the clamped
 * natural ratio; square until it is known).
 */
export function frameFor(aspect: MediaCarouselAspect, ratio: number | null): FrameStyle {
  if (aspect === "natural-clamped") {
    if (ratio === null) return { className: "aspect-square" };
    return { className: "", style: { aspectRatio: String(ratio) } };
  }
  if (Object.hasOwn(FIXED_CLASS, aspect)) return { className: FIXED_CLASS[aspect as LinearAspect] };
  const parsed = parseRatio(aspect);
  if (parsed === null) {
    if (process.env.NODE_ENV !== "production" && !warnedAspects.has(aspect)) {
      warnedAspects.add(aspect);
      console.warn(`[MediaCarousel] Invalid aspect "${aspect}": expected "W:H" with positive numbers; using "square".`);
    }
    return { className: FIXED_CLASS.square };
  }
  return { className: "", style: { aspectRatio: String(parsed) } };
}
