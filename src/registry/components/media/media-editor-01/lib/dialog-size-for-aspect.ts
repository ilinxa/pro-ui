import type { AspectRatio } from "../types";

export interface DialogSize {
  width: number;
  height: number;
}

/**
 * Aspect → desktop dialog size derivation per description §6.
 *
 * Mobile (< md breakpoint) always falls back to fullscreen; the size returned
 * here only takes effect at the `md:` breakpoint.
 *
 * v0.1 does NOT expose a width-override prop — consumers needing custom sizing
 * pass `presentation="inline"` and own the wrapper.
 */
const DIALOG_SIZE_FOR_ASPECT: Record<AspectRatio, DialogSize> = {
  "9:16": { width: 400, height: 711 }, // true 9:16 portrait
  "1:1": { width: 600, height: 600 },
  "16:9": { width: 800, height: 450 },
  "4:5": { width: 500, height: 625 },
  free: { width: 800, height: 600 }, // sensible default; no lock applied
};

export function dialogSizeForAspect(aspect: AspectRatio): DialogSize {
  return DIALOG_SIZE_FOR_ASPECT[aspect];
}
