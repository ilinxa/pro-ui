export const PDF_VIEWER_MIN_SCALE = 0.25;
export const PDF_VIEWER_MAX_SCALE = 5;
export const PDF_VIEWER_ZOOM_STEP = 1.2;

export function clampScale(scale: number): number {
  if (Number.isNaN(scale) || !Number.isFinite(scale)) return 1;
  return Math.max(PDF_VIEWER_MIN_SCALE, Math.min(PDF_VIEWER_MAX_SCALE, scale));
}

export function nextZoomIn(scale: number): number {
  return clampScale(scale * PDF_VIEWER_ZOOM_STEP);
}

export function nextZoomOut(scale: number): number {
  return clampScale(scale / PDF_VIEWER_ZOOM_STEP);
}
