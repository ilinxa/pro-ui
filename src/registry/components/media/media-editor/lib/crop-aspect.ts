import type { AspectRatio, CanvasAspect, CropAspect } from "../types";

const NAMED: Record<AspectRatio, number | null> = {
  "9:16": 9 / 16,
  "1:1": 1,
  "16:9": 16 / 9,
  "4:5": 4 / 5,
  free: null,
};

function isNamed(value: string): value is AspectRatio {
  return Object.prototype.hasOwnProperty.call(NAMED, value);
}

function parsePositive(part: string): number | null {
  if (part === "" || part !== part.trim()) return null;
  const n = Number(part);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Parse "W:H" (finite positive numbers) into its width / height ratio. */
function parseCustom(value: string): number | null {
  const parts = value.split(":");
  if (parts.length !== 2) return null;
  const w = parsePositive(parts[0]);
  const h = parsePositive(parts[1]);
  if (w === null || h === null) return null;
  const ratio = w / h;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
}

/** True for every `AspectRatio`, `"original"`, and `"W:H"` with finite positive numbers. */
export function isValidCropAspect(value: unknown): value is CropAspect {
  if (typeof value !== "string") return false;
  if (value === "original") return true;
  if (isNamed(value)) return true;
  return parseCustom(value) !== null;
}

/**
 * Width / height ratio for a crop aspect. `null` = free (no lock).
 * `"original"` uses `mediaRatio` (the loaded photo's width / height); when that
 * is unknown it is `null` (free) until the photo has loaded.
 */
export function cropAspectToRatio(
  aspect: CropAspect,
  mediaRatio: number | null,
): number | null {
  if (aspect === "original") {
    return mediaRatio !== null && Number.isFinite(mediaRatio) && mediaRatio > 0
      ? mediaRatio
      : null;
  }
  if (isNamed(aspect)) return NAMED[aspect];
  return parseCustom(aspect);
}

/**
 * Validates the canvas `aspect` prop (0.7.0): a named `AspectRatio` or `"W:H"`
 * with finite positive numbers. `"original"` and anything else is invalid.
 */
export function isValidCanvasAspect(value: unknown): value is CanvasAspect {
  return value !== "original" && isValidCropAspect(value);
}

/** Width / height of a canvas aspect; `null` for `"free"`. */
export function canvasAspectToRatio(aspect: CanvasAspect): number | null {
  return cropAspectToRatio(aspect, null);
}
