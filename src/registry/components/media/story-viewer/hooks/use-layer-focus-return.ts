"use client";

import { type RefObject, useEffect, useRef } from "react";

export interface UseLayerFocusReturnOptions {
  /** The layer's root element (sheet, menu, list). Read when the layer opens. */
  layerRef: RefObject<HTMLElement | null>;
  /** Moves focus into the layer once it is open (after the opener was remembered). */
  onOpenFocus?: () => void;
}

const CONTROL =
  'button, a[href], [role="button"], [tabindex]:not([tabindex="-1"]), input, select, textarea, summary';

/**
 * 0.7.1 - one focus hand-off for every layer inside the viewer (comments / share sheet, actions
 * menu, viewers list). On open it remembers the opener — the focused element, or, on Safari /
 * macOS Firefox where a clicked button takes no focus, the control last pressed while the layer
 * was closed — and moves focus in. On close it puts focus back on the opener, but only when focus
 * was lost (on `body`, on the viewer dialog itself, or inside the layer) and the opener is not
 * `inert`; it checks again over three frames because a browser drops focus out of an element that
 * turns `inert` after this effect runs.
 */
export function useLayerFocusReturn(open: boolean, options: UseLayerFocusReturnOptions): void {
  const { layerRef } = options;
  const onOpenFocusRef = useRef(options.onOpenFocus);
  useEffect(() => {
    onOpenFocusRef.current = options.onOpenFocus;
  });
  const openerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<Element | null>(null);
  const lastPressedRef = useRef<HTMLElement | null>(null);

  // While closed, remember the last control pressed (the opener when nothing takes focus).
  useEffect(() => {
    if (open) return undefined;
    const onPress = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      const control = target?.closest<HTMLElement>(CONTROL) ?? null;
      // The tap zones sit in an `aria-hidden` wrapper: never an opener.
      lastPressedRef.current = control && !control.closest('[aria-hidden="true"]') ? control : null;
    };
    document.addEventListener("pointerdown", onPress, true);
    return () => document.removeEventListener("pointerdown", onPress, true);
  }, [open]);

  useEffect(() => {
    if (open) {
      const layer = layerRef.current;
      const dialog = layer?.parentElement?.closest('[role="dialog"]') ?? null;
      dialogRef.current = dialog;
      const active = document.activeElement;
      const pressed = lastPressedRef.current;
      lastPressedRef.current = null;
      const usable = (el: Element | null): el is HTMLElement =>
        el instanceof HTMLElement &&
        el !== document.body &&
        el !== dialog &&
        el.isConnected &&
        !layer?.contains(el);
      openerRef.current = usable(active) ? active : usable(pressed) ? pressed : null;
      onOpenFocusRef.current?.();
      return undefined;
    }
    const opener = openerRef.current;
    const dialog = dialogRef.current;
    openerRef.current = null;
    if (!opener) return undefined;
    const restore = () => {
      const active = document.activeElement;
      const layer = layerRef.current;
      const lost =
        !active ||
        active === document.body ||
        active === dialog ||
        (!!layer && layer.contains(active));
      if (lost && opener.isConnected && !opener.closest("[inert]")) {
        opener.focus({ preventScroll: true });
      }
    };
    restore();
    let frame = 0;
    let tries = 0;
    const again = () => {
      restore();
      if (++tries < 3) frame = requestAnimationFrame(again);
    };
    frame = requestAnimationFrame(again);
    return () => cancelAnimationFrame(frame);
  }, [open, layerRef]);
}
