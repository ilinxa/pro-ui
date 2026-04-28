import type { SplitOrientation } from "../types";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LeafRect = Rect & {
  areaId: string;
  componentId: string;
  depth: number;
};

export type SplitDividerRect = {
  splitPath: number[];
  orientation: SplitOrientation;
  x: number;
  y: number;
  length: number;
};

export function inferDragOrientation(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
): SplitOrientation {
  const dx = Math.abs(currentX - startX);
  const dy = Math.abs(currentY - startY);
  return dx >= dy ? "vertical" : "horizontal";
}

export function pointInRect(px: number, py: number, rect: Rect): boolean {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

export function rectsShareFullEdge(a: Rect, b: Rect): SplitOrientation | null {
  const eps = 0.5;
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  if (Math.abs(aRight - b.x) < eps || Math.abs(bRight - a.x) < eps) {
    if (Math.abs(a.y - b.y) < eps && Math.abs(aBottom - bBottom) < eps) {
      return "vertical";
    }
  }
  if (Math.abs(aBottom - b.y) < eps || Math.abs(bBottom - a.y) < eps) {
    if (Math.abs(a.x - b.x) < eps && Math.abs(aRight - bRight) < eps) {
      return "horizontal";
    }
  }
  return null;
}

export function clampRatio(
  ratio: number,
  totalSize: number,
  minA: number,
  minB: number,
): number {
  if (totalSize <= minA + minB) return 0.5;
  const minRatio = minA / totalSize;
  const maxRatio = (totalSize - minB) / totalSize;
  return Math.max(minRatio, Math.min(maxRatio, ratio));
}
