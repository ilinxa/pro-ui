import type { KeyboardEvent } from "react";

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function tabbablesIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) => !el.closest("[inert]") && !el.closest('[aria-hidden="true"]'),
  );
}

/**
 * Keeps Tab / Shift+Tab inside a layer (bottom sheet, actions menu): from the
 * last tabbable Tab wraps to the first, and Shift+Tab from the first (or from
 * the layer itself) wraps to the last. Spread as the layer root's `onKeyDown`.
 *
 * The dialog's own focus scope can't do this here: everything behind the layer
 * is `inert`, but the scope's first / last candidates ignore `inert`, so Tab
 * from the layer's last control would leave the page instead of wrapping.
 */
export function wrapTabWithinLayer(e: KeyboardEvent<HTMLElement>) {
  if (e.key !== "Tab" || e.defaultPrevented) return;
  const root = e.currentTarget;
  const items = tabbablesIn(root);
  const active = document.activeElement;
  if (items.length === 0) {
    e.preventDefault();
    root.focus({ preventScroll: true });
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && (active === first || active === root)) {
    e.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus({ preventScroll: true });
  }
}
