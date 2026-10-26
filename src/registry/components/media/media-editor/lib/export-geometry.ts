import type { CropRect, ExportImageOpts } from "../types";

export interface ExportGeometryInput {
  /** Stage size, CSS px. */
  stage: { width: number; height: number };
  /** The photo's displayed rect on the stage, CSS px (null: no photo). */
  media: CropRect | null;
  /** The crop frame while one is set, CSS px. */
  crop: CropRect | null;
  /** The photo's natural width in pixels (for the `region: "media"` default). */
  naturalWidth?: number;
  opts: Pick<
    ExportImageOpts,
    "region" | "pixelRatio" | "width" | "height" | "maxEdge"
  >;
}

export interface ExportGeometry {
  /** Stage region to render, CSS px. */
  rect: CropRect;
  /** Pixel ratio to render it at (output px per CSS px). */
  pixelRatio: number;
  /** Output size in pixels (integers, ≥ 1). */
  width: number;
  height: number;
}

const DEFAULT_PIXEL_RATIO = 2;

/** Longer-edge cap for the natural-resolution default (`region: "media"`). */
export const NATURAL_MAX_EDGE = 4096;
/** Total output pixels any export may have (the iOS canvas area limit). */
export const MAX_OUTPUT_PIXELS = 16_777_216;

const good = (n: number | undefined): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;

const toPx = (n: number) => Math.max(1, Math.round(n));

function intersect(a: CropRect, b: CropRect): CropRect {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return { x, y, width: right - x, height: bottom - y };
}

/**
 * Resolve the export region and output size, following the `ExportImageOpts`
 * docs: region "stage" = crop ?? whole stage; region "media" = media ∩ crop
 * (media alone without crop). Size: width/height (both → region centre-trimmed
 * to that aspect) > maxEdge cap > pixelRatio (default 2; for region "media"
 * with no size option, naturalWidth / media.width, longer edge capped at 4096).
 * Every result is capped at 16_777_216 total pixels (uniform scale-down). Throws
 * a `RangeError` when the region is empty (no photo for "media", zero-size stage).
 */
export function computeExportGeometry(
  input: ExportGeometryInput,
): ExportGeometry {
  return capPixels(resolveGeometry(input));
}

/** Scale a result down uniformly so it stays within MAX_OUTPUT_PIXELS. */
function capPixels(g: ExportGeometry): ExportGeometry {
  if (g.width * g.height <= MAX_OUTPUT_PIXELS) return g;
  const s = Math.sqrt(MAX_OUTPUT_PIXELS / (g.width * g.height));
  // floor keeps width * height <= MAX_OUTPUT_PIXELS
  return {
    rect: g.rect,
    pixelRatio: g.pixelRatio * s,
    width: Math.max(1, Math.floor(g.width * s)),
    height: Math.max(1, Math.floor(g.height * s)),
  };
}

function resolveGeometry(input: ExportGeometryInput): ExportGeometry {
  const { stage, media, crop, naturalWidth, opts } = input;
  if (!good(stage.width) || !good(stage.height)) {
    throw new RangeError("media-editor: cannot export, the canvas has no size");
  }
  const region = opts.region ?? "stage";

  let rect: CropRect;
  if (region === "media") {
    if (!media || !good(media.width) || !good(media.height)) {
      throw new RangeError(
        "media-editor: cannot export region 'media', no photo is shown",
      );
    }
    rect = crop ? intersect(media, crop) : { ...media };
  } else {
    rect = crop
      ? { ...crop }
      : { x: 0, y: 0, width: stage.width, height: stage.height };
  }
  if (!good(rect.width) || !good(rect.height)) {
    throw new RangeError(
      "media-editor: cannot export, the export region is empty",
    );
  }

  const wantW = good(opts.width) ? opts.width : undefined;
  const wantH = good(opts.height) ? opts.height : undefined;

  if (wantW !== undefined && wantH !== undefined) {
    const target = wantW / wantH;
    const have = rect.width / rect.height;
    if (have > target) {
      const w = rect.height * target;
      rect = {
        x: rect.x + (rect.width - w) / 2,
        y: rect.y,
        width: w,
        height: rect.height,
      };
    } else if (have < target) {
      const h = rect.width / target;
      rect = {
        x: rect.x,
        y: rect.y + (rect.height - h) / 2,
        width: rect.width,
        height: h,
      };
    }
    const width = toPx(wantW);
    return { rect, pixelRatio: width / rect.width, width, height: toPx(wantH) };
  }
  if (wantW !== undefined) {
    const width = toPx(wantW);
    return {
      rect,
      pixelRatio: width / rect.width,
      width,
      height: toPx((width * rect.height) / rect.width),
    };
  }
  if (wantH !== undefined) {
    const height = toPx(wantH);
    return {
      rect,
      pixelRatio: height / rect.height,
      width: toPx((height * rect.width) / rect.height),
      height,
    };
  }

  let pixelRatio: number;
  if (good(opts.pixelRatio)) {
    pixelRatio = opts.pixelRatio;
  } else if (region === "media" && media && good(naturalWidth)) {
    pixelRatio = naturalWidth / media.width;
    // The photo's own resolution, but never beyond NATURAL_MAX_EDGE.
    const longest = Math.max(rect.width, rect.height) * pixelRatio;
    if (longest > NATURAL_MAX_EDGE) pixelRatio *= NATURAL_MAX_EDGE / longest;
  } else {
    pixelRatio = DEFAULT_PIXEL_RATIO;
  }

  let width = toPx(rect.width * pixelRatio);
  let height = toPx(rect.height * pixelRatio);
  if (good(opts.maxEdge)) {
    const longest = Math.max(width, height);
    if (longest > opts.maxEdge) {
      const scale = opts.maxEdge / longest;
      pixelRatio *= scale;
      width = toPx(width * scale);
      height = toPx(height * scale);
    }
  }
  return { rect, pixelRatio, width, height };
}
