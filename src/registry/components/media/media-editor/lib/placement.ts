import type Konva from "konva";

/** Name given to the base image node in `EditorCanvas`, so placement can find it. */
export const BASE_IMAGE_NODE_NAME = "media-editor-base-image";

/** Names of the selection UI (layer + Transformer); exports hide them. */
export const UI_LAYER_NAME = "media-editor-ui-layer";
export const TRANSFORMER_NODE_NAME = "media-editor-transformer";

export interface PlacementPoint {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Centre of the part of the image the user can currently see, in stage
 * coordinates (the space overlay `x` / `y` live in). The visible part is the
 * image rect intersected with the viewport after pan / zoom. With no image
 * yet, or the image panned fully out of view, it is the viewport centre.
 * `null` when the stage has not mounted.
 */
export function visibleImageCenter(stage: Konva.Stage | null): PlacementPoint | null {
  const area = visibleImageArea(stage);
  return area ? { x: area.x + area.width / 2, y: area.y + area.height / 2 } : null;
}

/**
 * The part of the image the user can currently see, in stage coordinates
 * (see `visibleImageCenter`). `null` when the stage has not mounted.
 */
export function visibleImageArea(
  stage: Konva.Stage | null,
): { x: number; y: number; width: number; height: number } | null {
  if (!stage) return null;
  const scale = stage.scaleX() || 1;
  const viewport: Rect = {
    x: -stage.x() / scale,
    y: -stage.y() / scale,
    width: stage.width() / scale,
    height: stage.height() / scale,
  };
  const node = stage.findOne(`.${BASE_IMAGE_NODE_NAME}`);
  const image: Rect | null = node
    ? { x: node.x(), y: node.y(), width: node.width(), height: node.height() }
    : null;
  const visible = image ? intersect(image, viewport) : null;
  return visible ?? viewport;
}

/**
 * Top-left (and, when needed, a smaller font size) for a new text box centred
 * on `area`, so the whole box starts inside it: a box wider than 90 % of the
 * area is scaled down (never below 12 px), then the position is clamped.
 * `measure` returns the box for a font size.
 */
export function fitTextInArea(
  area: { x: number; y: number; width: number; height: number },
  fontSize: number,
  measure: (size: number) => { width: number; height: number },
): { x: number; y: number; fontSize: number } {
  let size = fontSize;
  let box = measure(size);
  const maxWidth = area.width * 0.9;
  if (box.width > maxWidth && box.width > 0) {
    size = Math.max(12, Math.floor((size * maxWidth) / box.width));
    box = measure(size);
  }
  const clamp = (v: number, min: number, span: number, len: number) =>
    len >= span ? min : Math.min(Math.max(v, min), min + span - len);
  return {
    x: clamp(area.x + area.width / 2 - box.width / 2, area.x, area.width, box.width),
    y: clamp(area.y + area.height / 2 - box.height / 2, area.y, area.height, box.height),
    fontSize: size,
  };
}

function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right <= x || bottom <= y) return null;
  return { x, y, width: right - x, height: bottom - y };
}

const isJsdom = () =>
  typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);

let measureContext: CanvasRenderingContext2D | null | undefined;

const resolvedFamilies = new Map<string, string>();

/** `var(--x, a, b)` becomes `a, b` (the var() fallback list); else the input. */
function varFallbackList(value: string): string {
  const out = value.replace(
    /var\(\s*--[^,()]+,\s*((?:[^()]|\([^()]*\))*)\)/g,
    "$1",
  );
  return out.includes("var(") ? "sans-serif" : out;
}

/**
 * A canvas rejects a `font` string containing `var()` (Chromium falls back to
 * `10px sans-serif`), so a token-bearing family must become a concrete family
 * list before it reaches Konva or `measureText`. Resolved through computed
 * style, cached per value; SSR-safe; falls back to the `var()` fallback list.
 * The stored value (`TextOverlay.fontFamily`) stays the token.
 */
export function resolveCanvasFontFamily(family: string): string {
  if (!family.includes("var(")) return family;
  const cached = resolvedFamilies.get(family);
  if (cached !== undefined) return cached;
  let result = varFallbackList(family);
  if (typeof document !== "undefined" && document.body) {
    const el = document.createElement("span");
    el.style.position = "absolute";
    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
    el.style.fontFamily = family;
    document.body.appendChild(el);
    try {
      const computed = window.getComputedStyle(el).fontFamily;
      if (computed && !computed.includes("var(")) result = computed;
    } finally {
      el.remove();
    }
  }
  resolvedFamilies.set(family, result);
  return result;
}

/** Quote family names that contain spaces, the way Konva builds its font string. */
function cssFontFamily(family: string): string {
  return family
    .split(",")
    .map((f) => {
      const name = f.trim();
      return /\s/.test(name) && !/^["']/.test(name) ? `"${name}"` : name;
    })
    .join(", ");
}

/**
 * Size of a Konva text node with default padding / line height (1), measured
 * the way Konva measures it (canvas `measureText`). Without a 2D context
 * (jsdom, SSR) it falls back to an estimate of 0.6em per character.
 */
export function measureTextBox(
  text: string,
  fontFamily: string,
  fontSize: number,
): { width: number; height: number } {
  const lines = text.split("\n");
  if (measureContext === undefined) {
    measureContext =
      typeof document === "undefined" || isJsdom()
        ? null
        : document.createElement("canvas").getContext("2d");
  }
  let width: number;
  if (measureContext) {
    measureContext.font = `${fontSize}px ${cssFontFamily(resolveCanvasFontFamily(fontFamily))}`;
    width = Math.max(...lines.map((l) => measureContext!.measureText(l).width));
  } else {
    width = Math.max(...lines.map((l) => l.length)) * fontSize * 0.6;
  }
  return { width, height: lines.length * fontSize };
}

/** Used only if an overlay is added before the stage has mounted. */
export const FALLBACK_PLACEMENT: PlacementPoint = { x: 100, y: 200 };
