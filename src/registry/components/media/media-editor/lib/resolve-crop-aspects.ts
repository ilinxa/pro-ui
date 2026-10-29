import type { AspectRatio, CanvasAspect, CropAspect } from "../types";
import { isValidCropAspect } from "./crop-aspect";

const ALL_ASPECTS: readonly AspectRatio[] = [
  "9:16",
  "1:1",
  "16:9",
  "4:5",
  "free",
];

// Module-level on purpose: this only dedupes a DEV warning (a re-render of the
// editor must not repeat it). It never affects the returned value, so sharing
// it across instances is harmless - at worst a second editor with the same bad
// value stays quiet.
const warnedInvalid = new Set<string>();

function deriveDefault(aspect: CanvasAspect): CropAspect[] {
  if (aspect === "free") return [...ALL_ASPECTS];
  return [aspect];
}

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
 *     Invalid entries are dropped (one dev-only warning per distinct invalid
 *     value, ever - module-level dedupe) and duplicates removed; if every
 *     entry is invalid the default derivation is used. An explicit empty array stays empty.
 */
export function resolveCropAspects(
  aspect: CanvasAspect,
  cropAspectsOverride: CropAspect[] | undefined,
): CropAspect[] {
  if (cropAspectsOverride === undefined) return deriveDefault(aspect);
  if (cropAspectsOverride.length === 0) return [];

  const valid: CropAspect[] = [];
  for (const entry of cropAspectsOverride as unknown[]) {
    if (isValidCropAspect(entry)) {
      if (!valid.includes(entry)) valid.push(entry);
      continue;
    }
    const key = String(entry);
    if (process.env.NODE_ENV !== "production" && !warnedInvalid.has(key)) {
      warnedInvalid.add(key);
      console.warn(`media-editor: ignoring invalid cropAspects entry ${key}`);
    }
  }
  return valid.length > 0 ? valid : deriveDefault(aspect);
}
