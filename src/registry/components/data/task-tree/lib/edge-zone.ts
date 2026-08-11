/**
 * Compute the drop zone for a pointer over a row's bounding box.
 *
 * Top / bottom 8px → sibling drop indicator (reorder).
 * Middle → reparent drop indicator (drop into children).
 *
 * Cap from description doc L6: top + bottom bands are capped at 8px so the
 * "middle" zone always wins for typical 52px rows, even at coarse coordinates.
 */

export type EdgeZone = "top" | "middle" | "bottom";

export const EDGE_BAND_PX = 8;

export function computeEdgeZone(
  pointerY: number,
  rowTop: number,
  rowHeight: number,
): EdgeZone {
  const relative = pointerY - rowTop;
  if (relative < EDGE_BAND_PX) return "top";
  if (relative > rowHeight - EDGE_BAND_PX) return "bottom";
  return "middle";
}
