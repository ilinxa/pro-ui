import type Konva from "konva";
import type { CropRect } from "../types";
import { MAX_OUTPUT_PIXELS } from "./export-geometry";
import {
  BASE_IMAGE_NODE_NAME,
  TRANSFORMER_NODE_NAME,
  UI_LAYER_NAME,
} from "./placement";

/**
 * Resolve any CSS colour (`var(--x)`, `oklch(...)`, named, ...) to a concrete
 * canvas fill via computed style. Returns null (and warns once per call, dev
 * only) when the value is invalid or resolves to nothing - the export then has
 * no fill, never a silent opaque black.
 */
function resolveFillColor(value: string, host: Element | null): string | null {
  if (typeof document === "undefined" || !document.body) return value;
  const el = document.createElement("span");
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  el.style.backgroundColor = value;
  const warn = () => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `media-editor: ignoring unresolvable export backgroundColor ${JSON.stringify(value)}`,
      );
    }
  };
  // A browser drops an invalid colour on assignment.
  if (el.style.backgroundColor === "") {
    warn();
    return null;
  }
  (host ?? document.body).appendChild(el);
  try {
    const computed = window.getComputedStyle(el).backgroundColor.trim();
    if (computed === "") {
      warn();
      return null;
    }
    // Both `rgba(0, 0, 0, 0)` and the space syntax `rgb(0 0 0 / 0)`.
    if (/^(transparent|rgba?\(\s*0[\s,]+0[\s,]+0\s*[,/]\s*0%?\s*\))$/i.test(computed)) {
      // Legitimately transparent, or a `var()` that resolved to nothing.
      if (/var\(/i.test(value)) warn();
      return null;
    }
    return computed;
  } finally {
    el.remove();
  }
}

/**
 * Prepare the stage for an export render and return the undo. Hides the
 * selection UI (Transformer handles must not be baked in) and, for a cached
 * base image, re-caches it at the export pixel ratio: Konva's cache is a
 * bitmap taken at the screen ratio, and drawing it at a higher ratio would
 * up-scale it. The ratio is capped so the cache canvas stays within the output
 * pixel limit. Tolerates partial stages (stubs).
 */
function prepareExportScene(stage: Konva.Stage, pixelRatio: number): () => void {
  const undo: Array<() => void> = [];
  const hidden = new Set<Konva.Node>();
  for (const sel of [`.${UI_LAYER_NAME}`, `.${TRANSFORMER_NODE_NAME}`]) {
    const found = typeof stage.find === "function" ? stage.find(sel) : [];
    for (const node of Array.from(found as ArrayLike<Konva.Node>)) hidden.add(node);
  }
  for (const node of hidden) {
    const was = node.visible();
    node.visible(false);
    undo.push(() => node.visible(was));
  }

  const image =
    typeof stage.findOne === "function"
      ? stage.findOne<Konva.Image>(`.${BASE_IMAGE_NODE_NAME}`)
      : undefined;
  if (image && typeof image.isCached === "function" && image.isCached()) {
    const area = Math.max(1, Math.ceil(image.width()) * Math.ceil(image.height()));
    const ratio = Math.min(pixelRatio, Math.sqrt(MAX_OUTPUT_PIXELS / area));
    image.clearCache();
    image.cache({ pixelRatio: ratio });
    undo.push(() => {
      image.clearCache();
      image.cache();
    });
  }
  return () => {
    for (const fn of undo.reverse()) fn();
  };
}

/** Run `render` (sync) against the export-prepared stage; always restores. */
function withExportScene<T>(
  stage: Konva.Stage,
  pixelRatio: number,
  render: () => T,
): T {
  const restore = prepareExportScene(stage, pixelRatio);
  try {
    return render();
  } finally {
    restore();
  }
}

export interface ExportPhotoOptions {
  stage: Konva.Stage;
  cropRect?: CropRect | null;
  /** Pixel ratio multiplier. Default 2 for retina sharpness. */
  pixelRatio?: number;
  /** Default "image/jpeg" per Q-P3 lock. PNG and WebP also supported. */
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
  /** 0..1; default 0.9 per Q-P3. Only meaningful for jpeg / webp. */
  quality?: number;
  /** Fires (0) at start and (1) at end. Two-tick contract for image export. */
  onProgress?: (progress: number) => void;
  /** Fill painted under the stage content before encoding (any CSS colour). Default none. */
  backgroundColor?: string;
}

// SLICE A — stub signature fixed by the architect (U2, 0.6.0).
export interface RenderPhotoOptions {
  stage: Konva.Stage;
  /** Stage region to render, CSS px. */
  rect: CropRect;
  /** Output px per CSS px (from computeExportGeometry). */
  pixelRatio: number;
  /** Exact output size (from computeExportGeometry); the render is scaled to it. */
  width: number;
  height: number;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
  backgroundColor?: string;
  onProgress?: (progress: number) => void;
}

/**
 * Konva sizes its canvas with `floor(size * pixelRatio)`, the geometry rounds.
 * A product like 2999.9999999999995 (float error in `natural / mediaWidth`)
 * therefore comes out one pixel short and the whole image gets resampled by
 * target / (target - 1). Nudge the ratio up by a few ulps when a product sits
 * just under the integer it rounds to.
 */
export function snapPixelRatio(
  rect: { width: number; height: number },
  pixelRatio: number,
): number {
  let ratio = pixelRatio;
  for (const size of [rect.width, rect.height]) {
    const target = Math.round(size * ratio);
    if (target < 1 || Math.abs(size * ratio - target) > 1e-6) continue;
    for (let i = 0; i < 16 && Math.floor(size * ratio) < target; i++) {
      ratio *= 1 + 1e-13;
    }
  }
  return ratio;
}

/**
 * Render a stage region to a blob of exactly `width` x `height` pixels, with
 * an optional background fill, under the same two-tick progress contract.
 */
export function renderPhoto(
  opts: RenderPhotoOptions,
): Promise<{ blob: Blob; width: number; height: number }> {
  const {
    stage,
    rect,
    pixelRatio,
    width,
    height,
    mimeType = "image/jpeg",
    quality = 0.9,
    backgroundColor,
    onProgress,
  } = opts;

  onProgress?.(0);

  const ratio = snapPixelRatio(rect, pixelRatio);
  const source = withExportScene(stage, ratio, () =>
    stage.toCanvas({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      pixelRatio: ratio,
    }),
  );
  const fill = backgroundColor
    ? resolveFillColor(
        backgroundColor,
        typeof stage.container === "function" ? stage.container() : null,
      )
    : null;

  const targetW = Math.max(1, Math.round(width));
  const targetH = Math.max(1, Math.round(height));
  let out: HTMLCanvasElement;
  if (source.width === targetW && source.height === targetH) {
    // Already the target size: encode the Konva canvas itself (one canvas in
    // memory). The fill goes BEHIND the existing pixels.
    out = source;
    if (fill) {
      const ctx = out.getContext("2d");
      if (!ctx) return Promise.reject(new Error("2D context unavailable"));
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, out.width, out.height);
    }
  } else {
    out = document.createElement("canvas");
    out.width = targetW;
    out.height = targetH;
    const ctx = out.getContext("2d");
    if (!ctx) {
      return Promise.reject(new Error("2D context unavailable"));
    }
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, out.width, out.height);
    }
    if (
      Math.abs(source.width - targetW) <= 1 &&
      Math.abs(source.height - targetH) <= 1
    ) {
      // Off by a rounding pixel: copy 1:1 (crop / pad) instead of resampling
      // the whole picture, which would smear every edge.
      const w = Math.min(source.width, targetW);
      const h = Math.min(source.height, targetH);
      ctx.drawImage(source as CanvasImageSource, 0, 0, w, h, 0, 0, w, h);
    } else {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        source as CanvasImageSource,
        0,
        0,
        source.width,
        source.height,
        0,
        0,
        out.width,
        out.height,
      );
    }
  }

  return new Promise((resolve, reject) => {
    out.toBlob(
      (blob) => {
        if (blob) {
          onProgress?.(1);
          resolve({ blob, width: out.width, height: out.height });
        } else {
          reject(new Error("Canvas.toBlob returned null"));
        }
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Export the Konva stage to a Blob at the crop rect (or full stage if none).
 *
 * Uses stage.toCanvas() with x/y/width/height to write only the crop region.
 * stage.toBlob() is not available in all Konva versions; the canvas →
 * toBlob() path is more portable.
 *
 * Progress emits twice for jpeg/png/webp (start=0, end=1) per the
 * ExportImageOpts.onProgress contract. WebP encoders in some browsers may
 * yield mid-encode but we don't expose those intermediate ticks.
 */
export function exportPhotoBlob(opts: ExportPhotoOptions): Promise<Blob> {
  const {
    stage,
    cropRect,
    pixelRatio = 2,
    mimeType = "image/jpeg",
    quality = 0.9,
    onProgress,
    backgroundColor,
  } = opts;

  const region = cropRect ?? {
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
  };

  if (backgroundColor) {
    return renderPhoto({
      stage,
      rect: region,
      pixelRatio,
      width: Math.max(1, Math.round(region.width * pixelRatio)),
      height: Math.max(1, Math.round(region.height * pixelRatio)),
      mimeType,
      quality,
      backgroundColor,
      onProgress,
    }).then((r) => r.blob);
  }

  onProgress?.(0);

  const canvas = withExportScene(stage, pixelRatio, () =>
    stage.toCanvas({
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      pixelRatio,
    }),
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          onProgress?.(1);
          resolve(b);
        } else {
          reject(new Error("Canvas.toBlob returned null"));
        }
      },
      mimeType,
      quality,
    );
  });
}

/** Copy every computed style property from `src` onto `dst` inline. The
 * serialized SVG has no stylesheet, so class-driven styles (Tailwind) would
 * otherwise be lost in the rasterized output. The text-only surface is tiny
 * (a handful of nodes), so the full property walk is cheap. */
function inlineComputedStyles(src: Element, dst: HTMLElement): void {
  const cs = window.getComputedStyle(src);
  for (let i = 0; i < cs.length; i++) {
    const prop = cs.item(i);
    dst.style.setProperty(prop, cs.getPropertyValue(prop));
  }
}

/** Clone `source` for serialization: inline computed styles on every element
 * and swap textareas for divs carrying their live `.value` (a controlled
 * textarea's value lives on the DOM property, which XMLSerializer drops). */
function prepareExportClone(
  source: HTMLElement,
  width: number,
  height: number,
): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  const srcNodes: Element[] = [source, ...source.querySelectorAll("*")];
  const dstNodes: Element[] = [clone, ...clone.querySelectorAll("*")];
  for (let i = 0; i < srcNodes.length; i++) {
    const src = srcNodes[i];
    const dst = dstNodes[i] as HTMLElement;
    if (src instanceof HTMLTextAreaElement) {
      const div = clone.ownerDocument.createElement("div");
      div.textContent = src.value;
      inlineComputedStyles(src, div);
      div.style.whiteSpace = "pre-wrap";
      div.style.overflow = "hidden";
      dst.replaceWith(div);
    } else {
      inlineComputedStyles(src, dst);
    }
  }
  // Pin the root to the export dimensions (the live element is positioned by
  // its parent, which isn't serialized).
  clone.style.position = "static";
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  return clone;
}

/**
 * Export a text-only mode capture from the styled DOM surface.
 *
 * SVG-foreignObject technique: clone the element (computed styles inlined,
 * textarea values materialized), serialise it into an SVG, then draw the SVG
 * onto a 2× canvas. Avoids a third-party html-to-canvas dependency.
 *
 * @deprecated Use the Canvas 2D path (`exportTextCardBlob` in
 * `./text-card-export`): it honours format / quality / pixel ratio and does not
 * depend on SVG `foreignObject`. This function keeps working unchanged.
 */
export async function exportTextOnlyBlob(
  source: HTMLElement,
  width: number,
  height: number,
): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(
    prepareExportClone(source, width, height),
  );
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
