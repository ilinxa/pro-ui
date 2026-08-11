import type { AspectRatio } from "../types";

const ALL_ASPECTS: readonly AspectRatio[] = [
  "9:16",
  "1:1",
  "16:9",
  "4:5",
  "free",
];

/**
 * Crop tool's `cropAspects` default-derivation per description §4 "crop" row:
 *
 *   - If parent `aspect !== "free"` (canvas IS locked):
 *       default cropAspects = [aspect] — crop tool offers sub-region selection
 *       WITHIN the locked aspect only.
 *
 *   - If parent `aspect === "free"` (no canvas lock):
 *       default cropAspects = ["9:16","1:1","16:9","4:5","free"] — full menu.
 *
 *   - If consumer passes `cropAspects` explicitly, that overrides the default.
 */
export function resolveCropAspects(
  aspect: AspectRatio,
  cropAspectsOverride: AspectRatio[] | undefined,
): AspectRatio[] {
  if (cropAspectsOverride !== undefined) return cropAspectsOverride;
  if (aspect === "free") return [...ALL_ASPECTS];
  return [aspect];
}
