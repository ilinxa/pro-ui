import type Konva from "konva";
import type { CropRect } from "../types";

export interface ExportPhotoOptions {
  stage: Konva.Stage;
  cropRect?: CropRect | null;
  /** Pixel ratio multiplier. Default 2 for retina sharpness. */
  pixelRatio?: number;
  mimeType?: "image/jpeg" | "image/png";
  quality?: number;
}

/**
 * Export the Konva stage to a Blob at the crop rect (or full stage if none).
 *
 * Uses stage.toCanvas() with x/y/width/height to write only the crop region.
 * stage.toBlob() is not available in all Konva versions; the canvas →
 * toBlob() path is more portable.
 */
export function exportPhotoBlob(opts: ExportPhotoOptions): Promise<Blob> {
  const {
    stage,
    cropRect,
    pixelRatio = 2,
    mimeType = "image/jpeg",
    quality = 0.92,
  } = opts;

  const region = cropRect ?? {
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
  };

  const canvas = stage.toCanvas({
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    pixelRatio,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(new Error("Canvas.toBlob returned null")),
      mimeType,
      quality,
    );
  });
}

/**
 * Export a text-only mode capture from a DOM element using html-to-canvas?
 * No — text-mode renders via a styled <div> with the gradient + text. We
 * reuse the Konva editor when text-mode is captured-to-image. For now this
 * is a placeholder — text-only export lands fully in C13 alongside the
 * text-only canvas component.
 */
export async function exportTextOnlyBlob(
  source: HTMLElement,
  width: number,
  height: number,
): Promise<Blob> {
  // SVG-foreignObject technique: serialise the element into an SVG with
  // <foreignObject>, then draw the SVG onto a canvas. This avoids a
  // third-party html-to-canvas dependency.
  const xml = new XMLSerializer().serializeToString(source);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${xml}</foreignObject></svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Text-mode SVG render failed"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context unavailable");
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob null"))),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
