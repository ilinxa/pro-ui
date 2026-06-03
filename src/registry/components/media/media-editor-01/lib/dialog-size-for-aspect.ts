import type { AspectRatio } from "../types";

export interface DialogDims {
  /** CSS `aspect-ratio` value, e.g. `"9 / 16"`. */
  aspectRatio: string;
  /** Drives which dimension is the viewport-relative driver. */
  orientation: "portrait" | "landscape";
}

/**
 * Aspect → desktop dialog sizing hints per description §6.
 *
 * Mobile (< md breakpoint) always falls back to fullscreen; these hints only
 * take effect at the `md:` breakpoint, where the dialog is constructed as a
 * viewport-relative box constrained by `aspect-ratio` — height-driven for
 * portrait aspects, width-driven for landscape. The CSS in media-editor-01.tsx
 * sets the driver dimension to a viewport-relative size (e.g. `85dvh`) and
 * lets `aspect-ratio` compute the other.
 *
 * v0.1 does NOT expose a width-override prop — consumers needing custom sizing
 * pass `presentation="inline"` and own the wrapper.
 */
const DIALOG_DIMS_FOR_ASPECT: Record<AspectRatio, DialogDims> = {
  "9:16": { aspectRatio: "9 / 16", orientation: "portrait" },
  "1:1": { aspectRatio: "1 / 1", orientation: "portrait" },
  "16:9": { aspectRatio: "16 / 9", orientation: "landscape" },
  "4:5": { aspectRatio: "4 / 5", orientation: "portrait" },
  free: { aspectRatio: "4 / 3", orientation: "landscape" },
};

export function dialogDimsForAspect(aspect: AspectRatio): DialogDims {
  return DIALOG_DIMS_FOR_ASPECT[aspect];
}
