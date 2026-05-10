export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** AABB rectangle intersection. */
export function rectanglesIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

/**
 * Collect bounding rects of every item currently rendered inside `scroller`,
 * keyed by `data-item-id`. Used by the marquee hook to determine which items
 * the rectangle currently covers.
 *
 * Rects are in viewport coordinates (`getBoundingClientRect`); callers
 * comparing against the marquee rectangle should use the same coordinate
 * space.
 */
export function getItemRects(
  scroller: HTMLElement | null,
): Map<string, Rect> {
  const out = new Map<string, Rect>();
  if (!scroller) return out;
  const items = scroller.querySelectorAll<HTMLElement>("[data-item-id]");
  for (const el of items) {
    const id = el.getAttribute("data-item-id");
    if (!id) continue;
    const rect = el.getBoundingClientRect();
    out.set(id, {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    });
  }
  return out;
}
