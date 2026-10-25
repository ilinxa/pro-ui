import type { KeyboardEvent } from "react";

/** Elements a keyboard user can land on inside a consumer overlay. */
export const OVERLAY_FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const isJsdom = () =>
  typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);

/** Not `[hidden]`, not `display:none` / `visibility:hidden`, and laid out. */
function isReachable(el: HTMLElement, host: HTMLElement): boolean {
  if (el.closest("[hidden]")) return false;
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === "none") return false;
    if (n === el && cs.visibility === "hidden") return false;
    if (n === host) break;
  }
  // jsdom has no layout: every element reports zero rects there.
  if (!isJsdom() && el.getClientRects().length === 0) return false;
  return true;
}

/** The overlay's focusable, reachable descendants in DOM order. */
export function overlayTabbables(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>(OVERLAY_FOCUSABLE)).filter(
    (el) => isReachable(el, host),
  );
}

/** First reachable focusable inside the overlay, else the host itself. */
export function focusOverlay(host: HTMLElement) {
  (overlayTabbables(host)[0] ?? host).focus({ preventScroll: true });
}

/**
 * Keeps Tab / Shift+Tab inside the overlay. The rest of the editor is `inert`,
 * but a dialog's own focus scope ignores `inert` when it picks its first / last
 * candidate, so Tab from the overlay's last control would otherwise stick (or
 * leave the page) instead of wrapping.
 */
export function wrapTabWithinOverlay(e: KeyboardEvent<HTMLElement>) {
  if (e.key !== "Tab" || e.defaultPrevented) return;
  const host = e.currentTarget;
  const items = overlayTabbables(host);
  const active = document.activeElement;
  if (items.length === 0) {
    e.preventDefault();
    host.focus({ preventScroll: true });
    return;
  }
  const first = items[0]!;
  const last = items[items.length - 1]!;
  if (e.shiftKey && (active === first || active === host)) {
    e.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus({ preventScroll: true });
  }
}
