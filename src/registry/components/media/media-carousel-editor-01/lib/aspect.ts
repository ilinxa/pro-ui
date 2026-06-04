import type { AspectRatio, MediaCarouselItem } from "../types";

const RATIOS: { aspect: Exclude<AspectRatio, "free">; value: number }[] = [
  { aspect: "9:16", value: 9 / 16 },
  { aspect: "4:5", value: 4 / 5 },
  { aspect: "1:1", value: 1 },
  { aspect: "16:9", value: 16 / 9 },
];

/**
 * Resolve the carousel's shared aspect (Instagram behaviour): an explicit prop
 * wins; `"auto"` derives from item 1's natural ratio (nearest of the four
 * standard ratios); falls back to `"1:1"` until item 1's dimensions are known.
 */
export function resolveAspect(
  items: MediaCarouselItem[],
  prop: AspectRatio | "auto",
): AspectRatio {
  if (prop !== "auto") return prop;
  const first = items[0];
  if (!first?.width || !first?.height) return "1:1";
  const ratio = first.width / first.height;
  let best: Exclude<AspectRatio, "free"> = "1:1";
  let bestDiff = Infinity;
  for (const cand of RATIOS) {
    const diff = Math.abs(cand.value - ratio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = cand.aspect;
    }
  }
  return best;
}

/**
 * CSS `aspect-ratio` value for a frame. `"free"` falls back to a 1:1 frame so the
 * rail + main preview keep a consistent footprint.
 */
export function aspectToCss(aspect: AspectRatio): string {
  switch (aspect) {
    case "9:16":
      return "9 / 16";
    case "4:5":
      return "4 / 5";
    case "16:9":
      return "16 / 9";
    case "1:1":
    case "free":
    default:
      return "1 / 1";
  }
}
