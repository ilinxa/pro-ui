import type { CarouselAspectRatio, CarouselCropRect, MediaCarouselItem } from "../types";

/** An aspect with `"auto"` and `"original"` already turned into a concrete value. */
export type ResolvedAspect = Exclude<CarouselAspectRatio, "original">;

export interface AspectResolution {
  /** Named ratio, `"free"` or `"W:H"`; never `"auto"` / `"original"`. */
  aspect: ResolvedAspect;
  /** `aspect` as width / height; `null` for `"free"`. */
  ratio: number | null;
  /** The setting was an invalid `"W:H"` and fell back to `"1:1"`. */
  invalid: boolean;
}

const STANDARD: ResolvedAspect[] = ["9:16", "4:5", "1:1", "16:9"];

function parsePart(part: string | undefined): number | null {
  if (part === undefined || part === "" || part !== part.trim()) return null;
  const n = Number(part);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** `"W:H"` → `[w, h]`; same grammar as media-editor's crop aspect (no whitespace in a part). */
function parseParts(value: string): [number, number] | null {
  const parts = value.split(":");
  if (parts.length !== 2) return null;
  const w = parsePart(parts[0]);
  const h = parsePart(parts[1]);
  if (w === null || h === null) return null;
  const ratio = w / h;
  return Number.isFinite(ratio) && ratio > 0 ? [w, h] : null;
}

/** `"W:H"` → width / height; `null` for anything that is not two finite positive numbers. */
export function parseRatio(value: string): number | null {
  const parts = parseParts(value);
  return parts ? parts[0] / parts[1] : null;
}

/** A valid `"W:H"` rewritten from its parsed numbers; `null` when it is not a ratio. */
function normaliseRatio(value: string): string | null {
  const parts = parseParts(value);
  return parts ? `${parts[0]}:${parts[1]}` : null;
}

/** True for a value the shared aspect can take (`"auto"` excluded: it is a setting, not an option). */
export function isValidAspect(value: string): value is CarouselAspectRatio {
  return value === "free" || value === "original" || parseRatio(value) !== null;
}

function itemRatio(first: MediaCarouselItem | undefined): number | null {
  if (!first?.width || !first?.height) return null;
  return first.width / first.height;
}

/**
 * Resolve the carousel's shared aspect. An explicit value wins; `"auto"` is the
 * nearest of `options` (named / `"W:H"` entries, else the four standard ratios) to
 * item 1's ratio, `"1:1"` until it is known; `"original"` is item 1's own ratio as
 * `"W:H"` (1:1 until known); `"free"` keeps each item as it is (no crop, 1:1 frame).
 */
export function resolveAspect(
  items: MediaCarouselItem[],
  setting: CarouselAspectRatio | "auto",
  options?: readonly CarouselAspectRatio[],
): AspectResolution {
  if (setting === "free") return { aspect: "free", ratio: null, invalid: false };
  if (setting === "original") {
    const w = items[0]?.width;
    const h = items[0]?.height;
    if (!w || !h) return { aspect: "1:1", ratio: 1, invalid: false };
    return { aspect: `${w}:${h}` as ResolvedAspect, ratio: w / h, invalid: false };
  }
  if (setting === "auto") {
    const r = itemRatio(items[0]);
    if (r === null) return { aspect: "1:1", ratio: 1, invalid: false };
    const named = (options ?? []).filter(
      (o): o is ResolvedAspect => o !== "free" && o !== "original" && parseRatio(o) !== null,
    );
    const candidates = named.length > 0 ? named : STANDARD;
    let best = candidates[0];
    let bestDiff = Infinity;
    for (const cand of candidates) {
      const diff = Math.abs((parseRatio(cand) as number) - r);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = cand;
      }
    }
    return { aspect: best, ratio: parseRatio(best), invalid: false };
  }
  const ratio = parseRatio(setting);
  const normal = normaliseRatio(setting);
  if (ratio === null || normal === null) return { aspect: "1:1", ratio: 1, invalid: true };
  return { aspect: normal as ResolvedAspect, ratio, invalid: false };
}

/**
 * CSS `aspect-ratio` value for a frame. `"free"` (and an unresolved `"original"`)
 * falls back to a 1:1 frame so the rail + main preview keep a consistent footprint.
 */
export function aspectToCss(aspect: CarouselAspectRatio): string {
  if (aspect === "free" || aspect === "original") return "1 / 1";
  const parts = parseParts(aspect);
  return parts ? `${parts[0]} / ${parts[1]}` : "1 / 1";
}

const THUMB_BOX_W = 7.5;
const THUMB_BOX_H = 4;
const THUMB_MIN_W = 2;

/** Width of a rail thumb (rem): the exact ratio inside a 7.5 x 4 rem box (min 2 rem wide). */
export function thumbWidthRem(ratio: number | null): number {
  const r = ratio ?? 1;
  return Math.max(THUMB_MIN_W, Math.min(THUMB_BOX_W, THUMB_BOX_H * r));
}

/** Height of a rail thumb (rem): 4 up to the box's own ratio, `width / ratio` for wider ones. */
export function thumbHeightRem(ratio: number | null): number {
  const r = ratio ?? 1;
  if (THUMB_BOX_H * r <= THUMB_BOX_W) return THUMB_BOX_H;
  return THUMB_BOX_W / r;
}

/**
 * The largest centred rectangle of `ratio` (width / height) inside `width` × `height`,
 * in integer pixels. The full rectangle when the ratio already matches within rounding.
 */
export function centredCropRect(width: number, height: number, ratio: number): CarouselCropRect {
  return offsetCropRect(width, height, ratio);
}

/** A cropOffset axis clamped to [0, 1]; missing / non-finite = centred. */
export function clampOffset(n: number | undefined): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

/**
 * The same rectangle as `centredCropRect`, positioned by a focal point (`ox` / `oy`
 * from 0 to 1 over the overflow; 0.5 = centred). The ONE maths for the shown region
 * (`object-position`) and `export()`'s `crop`.
 */
export function offsetCropRect(
  width: number,
  height: number,
  ratio: number,
  offset?: { x: number; y: number },
): CarouselCropRect {
  const full: CarouselCropRect = { x: 0, y: 0, width, height };
  if (!(width > 0) || !(height > 0) || !(ratio > 0) || !Number.isFinite(ratio)) return full;
  // Relative error, so a tiny image (2 x 1 at ratio 1) is not read as "already matching".
  if (Math.abs(width / height - ratio) / ratio < 0.002) return full;
  let w = width;
  let h = height;
  if (width / height > ratio) w = Math.min(width, Math.max(1, Math.round(height * ratio)));
  else h = Math.min(height, Math.max(1, Math.round(width / ratio)));
  const ox = clampOffset(offset?.x);
  const oy = clampOffset(offset?.y);
  return { x: Math.floor((width - w) * ox), y: Math.floor((height - h) * oy), width: w, height: h };
}
