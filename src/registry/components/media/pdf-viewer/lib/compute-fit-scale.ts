import { clampScale } from "./clamp-scale";

export interface FitInputs {
  containerWidth: number;
  containerHeight: number;
  pageWidth: number;
  pageHeight: number;
  rotation?: 0 | 90 | 180 | 270;
  /** Horizontal padding to subtract from container width before fitting. */
  horizontalPadding?: number;
  /** Vertical padding to subtract from container height before fitting (toolbar etc). */
  verticalPadding?: number;
}

function rotatedSize(
  width: number,
  height: number,
  rotation: number,
): [number, number] {
  return rotation % 180 === 0 ? [width, height] : [height, width];
}

export function computeFitWidthScale(inputs: FitInputs): number {
  const rotation = inputs.rotation ?? 0;
  const [pw] = rotatedSize(inputs.pageWidth, inputs.pageHeight, rotation);
  const horizontalPadding = inputs.horizontalPadding ?? 32;
  const usable = Math.max(0, inputs.containerWidth - horizontalPadding);
  if (pw <= 0 || usable <= 0) return 1;
  return clampScale(usable / pw);
}

export function computeFitPageScale(inputs: FitInputs): number {
  const rotation = inputs.rotation ?? 0;
  const [pw, ph] = rotatedSize(
    inputs.pageWidth,
    inputs.pageHeight,
    rotation,
  );
  const horizontalPadding = inputs.horizontalPadding ?? 32;
  const verticalPadding = inputs.verticalPadding ?? 32;
  const usableW = Math.max(0, inputs.containerWidth - horizontalPadding);
  const usableH = Math.max(0, inputs.containerHeight - verticalPadding);
  if (pw <= 0 || ph <= 0 || usableW <= 0 || usableH <= 0) return 1;
  return clampScale(Math.min(usableW / pw, usableH / ph));
}
