import type Konva from "konva";

/** Name given to the base image node in `EditorCanvas`, so placement can find it. */
export const BASE_IMAGE_NODE_NAME = "media-editor-base-image";

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
  const area = visible ?? viewport;
  return { x: area.x + area.width / 2, y: area.y + area.height / 2 };
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
    measureContext.font = `${fontSize}px ${cssFontFamily(fontFamily)}`;
    width = Math.max(...lines.map((l) => measureContext!.measureText(l).width));
  } else {
    width = Math.max(...lines.map((l) => l.length)) * fontSize * 0.6;
  }
  return { width, height: lines.length * fontSize };
}

/** Used only if an overlay is added before the stage has mounted. */
export const FALLBACK_PLACEMENT: PlacementPoint = { x: 100, y: 200 };
