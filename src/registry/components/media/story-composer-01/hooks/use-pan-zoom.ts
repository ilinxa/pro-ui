"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from "react";

export interface PanZoomTransform {
  scale: number;
  x: number;
  y: number;
}

export interface UsePanZoomOptions {
  /**
   * Container element receiving the gestures. The wheel listener is attached
   * here as a NATIVE non-passive listener so `e.preventDefault()` actually
   * blocks the browser's default Ctrl+wheel page-zoom. React's `onWheel` is
   * registered as passive in modern browsers and can't preventDefault.
   */
  targetRef: RefObject<HTMLElement | null>;
  /** When false, all gestures + keys are no-ops. Default true. */
  enabled?: boolean;
  /** When true, the hook listens to window keydown (arrows / +/- / 0). Default true. */
  bindKeyboard?: boolean;
  /** Min zoom. Default 1 (full-screen fit baseline). */
  minScale?: number;
  /** Max zoom. Default 4. */
  maxScale?: number;
  /** Keyboard pan step in px. Default 32. */
  panStep?: number;
  /** Keyboard zoom step (multiplicative). Default 1.15. */
  zoomStep?: number;
}

export interface UsePanZoomResult {
  transform: PanZoomTransform;
  /** Whether the transform is at the identity (1× / 0,0) — drives the "reset" CTA. */
  isIdentity: boolean;
  /** Attach to a wrapper element receiving the gestures. */
  handlers: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onPointerCancel: (e: PointerEvent) => void;
  };
  reset: () => void;
  /** Programmatic zoom. `center` is in container coordinates. */
  zoomBy: (factor: number, center?: { x: number; y: number }) => void;
}

interface PointerInfo {
  id: number;
  x: number;
  y: number;
}

/**
 * Pan + pinch-zoom hook for the Konva editor.
 *
 * Touch:
 *   - 2-finger pinch → zoom anchored to the midpoint
 *   - 2-finger pan → translate by the midpoint delta
 *   - Single finger is NOT consumed (text/sticker/drawing keep their pointer
 *     events; pan-zoom only engages when a second pointer joins)
 *
 * Desktop:
 *   - Plain wheel over the canvas → zoom anchored to the cursor. The wheel
 *     listener is attached natively with `passive: false` + always
 *     preventDefaults, so the browser's Ctrl+wheel page-zoom doesn't ALSO
 *     zoom the page when the cursor is over the canvas. Trackpad pinch
 *     (which browsers report as wheel.ctrlKey=true) is covered too.
 *   - Vertical scroll over non-canvas areas works normally — the listener
 *     is scoped to the targetRef element.
 *
 * Keyboard (when bindKeyboard=true and no text input focused):
 *   - Arrow keys → pan (step = panStep)
 *   - + / =  → zoom in
 *   - - / _  → zoom out
 *   - 0      → reset
 *
 * Transform is returned for the consumer to apply (e.g. as Konva.Stage
 * scale + position props).
 */
export function usePanZoom(
  options: UsePanZoomOptions,
): UsePanZoomResult {
  const {
    targetRef,
    enabled = true,
    bindKeyboard = true,
    minScale = 1,
    maxScale = 4,
    panStep = 32,
    zoomStep = 1.15,
  } = options;

  const [transform, setTransform] = useState<PanZoomTransform>({
    scale: 1,
    x: 0,
    y: 0,
  });
  const pointersRef = useRef<PointerInfo[]>([]);
  const pinchStartRef = useRef<{
    dist: number;
    midX: number;
    midY: number;
    transform: PanZoomTransform;
  } | null>(null);

  const clamp = useCallback(
    (s: number) => Math.max(minScale, Math.min(maxScale, s)),
    [minScale, maxScale],
  );

  const reset = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  // Zoom by `factor` around `center` (in container coordinates).
  const zoomBy = useCallback(
    (factor: number, center?: { x: number; y: number }) => {
      setTransform((prev) => {
        const nextScale = clamp(prev.scale * factor);
        if (nextScale === prev.scale) return prev;
        const cx = center?.x ?? 0;
        const cy = center?.y ?? 0;
        // Keep the world point under the cursor stationary:
        //   world = (screen - pos) / scale
        //   newPos = screen - world * newScale
        const worldX = (cx - prev.x) / prev.scale;
        const worldY = (cy - prev.y) / prev.scale;
        return {
          scale: nextScale,
          x: cx - worldX * nextScale,
          y: cy - worldY * nextScale,
        };
      });
    },
    [clamp],
  );

  const panBy = useCallback((dx: number, dy: number) => {
    setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  // ─── Pointer / pinch gestures ────────────────────────────────────────

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!enabled) return;
      pointersRef.current = [
        ...pointersRef.current.filter((p) => p.id !== e.pointerId),
        { id: e.pointerId, x: e.clientX, y: e.clientY },
      ];
      if (pointersRef.current.length === 2) {
        const [a, b] = pointersRef.current;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        pinchStartRef.current = {
          dist: Math.hypot(dx, dy),
          midX: (a.x + b.x) / 2,
          midY: (a.y + b.y) / 2,
          transform,
        };
      }
    },
    [enabled, transform],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!enabled) return;
      const ptrs = pointersRef.current;
      const idx = ptrs.findIndex((p) => p.id === e.pointerId);
      if (idx === -1) return;
      ptrs[idx] = { id: e.pointerId, x: e.clientX, y: e.clientY };

      if (ptrs.length === 2 && pinchStartRef.current) {
        const [a, b] = ptrs;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const start = pinchStartRef.current;

        const rawScale = (start.transform.scale * dist) / start.dist;
        const nextScale = clamp(rawScale);

        // Anchor the start midpoint's world coords under the current midpoint.
        const worldX = (start.midX - start.transform.x) / start.transform.scale;
        const worldY = (start.midY - start.transform.y) / start.transform.scale;
        setTransform({
          scale: nextScale,
          x: midX - worldX * nextScale,
          y: midY - worldY * nextScale,
        });
      }
    },
    [clamp, enabled],
  );

  const onPointerUp = useCallback((e: PointerEvent) => {
    pointersRef.current = pointersRef.current.filter(
      (p) => p.id !== e.pointerId,
    );
    if (pointersRef.current.length < 2) pinchStartRef.current = null;
  }, []);

  const onPointerCancel = onPointerUp;

  // ─── Wheel (native non-passive — beats browser page-zoom) ────────────
  // Plain wheel (no modifier) zooms when over the canvas. Always
  // preventDefaults so the browser doesn't also zoom the page.

  useEffect(() => {
    if (!enabled) return;
    const el = targetRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const center = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const factor = e.deltaY < 0 ? zoomStep : 1 / zoomStep;
      zoomBy(factor, center);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [enabled, targetRef, zoomBy, zoomStep]);

  // ─── Keyboard ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !bindKeyboard || typeof window === "undefined") return;
    const handler = (e: KeyboardEvent) => {
      // Don't hijack while typing.
      const tgt = e.target as HTMLElement | null;
      if (
        tgt?.tagName === "INPUT" ||
        tgt?.tagName === "TEXTAREA" ||
        tgt?.isContentEditable
      ) {
        return;
      }
      // Arrow keys move the IMAGE in the arrow's direction (the natural
      // mental model when you're looking at media you want to reposition),
      // not the viewport. ArrowRight ⇒ image shifts right ⇒ transform.x +.
      switch (e.key) {
        case "ArrowLeft":
          panBy(-panStep, 0);
          e.preventDefault();
          break;
        case "ArrowRight":
          panBy(panStep, 0);
          e.preventDefault();
          break;
        case "ArrowUp":
          panBy(0, -panStep);
          e.preventDefault();
          break;
        case "ArrowDown":
          panBy(0, panStep);
          e.preventDefault();
          break;
        case "+":
        case "=":
          zoomBy(zoomStep);
          e.preventDefault();
          break;
        case "-":
        case "_":
          zoomBy(1 / zoomStep);
          e.preventDefault();
          break;
        case "0":
          reset();
          e.preventDefault();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bindKeyboard, enabled, panBy, panStep, reset, zoomBy, zoomStep]);

  return {
    transform,
    isIdentity:
      transform.scale === 1 && transform.x === 0 && transform.y === 0,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    reset,
    zoomBy,
  };
}
