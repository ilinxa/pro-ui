import type {
  CropRect,
  DrawingStroke,
  PlacedSticker,
  StateFrame,
  TextOverlay,
} from "../types";

/** The coordinate-bearing part of the editor state. */
export interface FrameMappable {
  textOverlays: TextOverlay[];
  stickers: PlacedSticker[];
  drawingStrokes: DrawingStroke[];
  crop: CropRect | null;
}

/** x' = ax + x * kx; y' = ay + y * ky; sizes (font, scale, brush) * ks. */
interface Transform {
  ax: number;
  ay: number;
  kx: number;
  ky: number;
  ks: number;
}

const pos = (n: number | undefined): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;

function isIdentity(t: Transform): boolean {
  return t.ax === 0 && t.ay === 0 && t.kx === 1 && t.ky === 1 && t.ks === 1;
}

function frameTransform(from: StateFrame, to: StateFrame): Transform | null {
  if (
    !pos(from.stageWidth) ||
    !pos(from.stageHeight) ||
    !pos(to.stageWidth) ||
    !pos(to.stageHeight)
  ) {
    return null;
  }
  const fm = from.media;
  const tm = to.media;
  if (fm && tm) {
    if (!pos(fm.width) || !pos(tm.width)) return null;
    const k = tm.width / fm.width;
    return {
      ax: tm.x - fm.x * k,
      ay: tm.y - fm.y * k,
      kx: k,
      ky: k,
      ks: k,
    };
  }
  const sx = to.stageWidth / from.stageWidth;
  const sy = to.stageHeight / from.stageHeight;
  return { ax: 0, ay: 0, kx: sx, ky: sy, ks: Math.min(sx, sy) };
}

function apply<T extends FrameMappable>(
  state: T,
  t: Transform,
  crop: CropRect | null,
): T {
  return {
    ...state,
    textOverlays: state.textOverlays.map((o) => ({
      ...o,
      x: t.ax + o.x * t.kx,
      y: t.ay + o.y * t.ky,
      fontSize: o.fontSize * t.ks,
    })),
    stickers: state.stickers.map((s) => ({
      ...s,
      x: t.ax + s.x * t.kx,
      y: t.ay + s.y * t.ky,
      scale: s.scale * t.ks,
    })),
    drawingStrokes: state.drawingStrokes.map((s) => ({
      ...s,
      points: s.points.map((v, i) =>
        i % 2 === 0 ? t.ax + v * t.kx : t.ay + v * t.ky,
      ),
      brushSize: s.brushSize * t.ks,
    })),
    crop,
  };
}

function mapRect(r: CropRect, t: Transform): CropRect {
  return {
    x: t.ax + r.x * t.kx,
    y: t.ay + r.y * t.ky,
    width: r.width * t.kx,
    height: r.height * t.ky,
  };
}

/**
 * Map coordinates recorded in `from` onto `to`. When both frames carry a
 * `media` rect the mapping is uniform (k = to.media.width / from.media.width,
 * origin at the media rect); otherwise x scales by the stage-width ratio, y by
 * the stage-height ratio, and sizes by the smaller of the two. Positions,
 * stroke points and the crop rect move; `fontSize`, sticker `scale` and stroke
 * `brushSize` scale by the size factor. Returns `state` itself (same
 * reference) when the frames are equal or either is degenerate (0 size).
 */
export function mapToFrame<T extends FrameMappable>(
  state: T,
  from: StateFrame,
  to: StateFrame,
): T {
  const t = frameTransform(from, to);
  if (!t || isIdentity(t)) return state;
  return apply(state, t, state.crop ? mapRect(state.crop, t) : null);
}

/**
 * Remap for a crop Apply: the content inside `cropInMedia` (stage px, already
 * intersected with the photo's displayed rect) is shown afterwards at
 * `newMedia` (the cropped photo's displayed rect). Same scaling rules as
 * `mapToFrame`; the returned `crop` is `null`.
 */
export function remapForCrop<T extends FrameMappable>(
  state: T,
  cropInMedia: CropRect,
  newMedia: CropRect,
): T {
  if (!pos(cropInMedia.width) || !pos(newMedia.width)) {
    return state.crop === null ? state : { ...state, crop: null };
  }
  const k = newMedia.width / cropInMedia.width;
  const t: Transform = {
    ax: newMedia.x - cropInMedia.x * k,
    ay: newMedia.y - cropInMedia.y * k,
    kx: k,
    ky: k,
    ks: k,
  };
  if (isIdentity(t)) {
    return state.crop === null ? state : { ...state, crop: null };
  }
  return apply(state, t, null);
}
