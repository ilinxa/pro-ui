/**
 * 0.6.0 (SV19) - reading direction at the point of use. The viewer renders in a portal, so the
 * direction comes from the nearest `[dir]` ancestor (or the computed style), read at event time.
 */
export function isRtlElement(el: Element | null | undefined): boolean {
  if (!el) return false;
  const attr = el.closest("[dir='rtl'], [dir='ltr']")?.getAttribute("dir");
  if (attr) return attr === "rtl";
  try {
    return getComputedStyle(el).direction === "rtl";
  } catch {
    return false;
  }
}
