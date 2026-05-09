"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  PDF_VIEWER_MAX_SCALE,
  PDF_VIEWER_MIN_SCALE,
  clampScale,
  nextZoomIn,
  nextZoomOut,
} from "../lib/clamp-scale";
import {
  computeFitPageScale,
  computeFitWidthScale,
} from "../lib/compute-fit-scale";
import type { PdfFitMode, PdfRotation } from "../types";

export interface UsePdfZoomArgs {
  containerRef: { current: HTMLElement | null };
  basePageWidth: number;
  basePageHeight: number;
  rotation: PdfRotation;
  initialScale: number | "fit-width" | "fit-page";
  onScaleChange?: (args: { scale: number; fitMode: PdfFitMode }) => void;
}

export interface UsePdfZoomReturn {
  scale: number;
  fitMode: PdfFitMode;
  setScale: (next: number | "fit-width" | "fit-page") => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

interface PendingZoomTarget {
  cursorX: number;
  cursorY: number;
  docX: number;
  docY: number;
  oldScale: number;
}

/**
 * Manages numeric scale + fit-mode for the viewer. Handles ctrl/cmd + wheel
 * zoom (cursor-anchored) and 2-finger pinch zoom (midpoint-anchored).
 */
export function usePdfZoom(args: UsePdfZoomArgs): UsePdfZoomReturn {
  const {
    containerRef,
    basePageWidth,
    basePageHeight,
    rotation,
    initialScale,
    onScaleChange,
  } = args;

  const [fitMode, setFitMode] = useState<PdfFitMode>(
    initialScale === "fit-width" || initialScale === "fit-page"
      ? initialScale
      : null,
  );
  const [scale, setScaleState] = useState<number>(
    typeof initialScale === "number" ? clampScale(initialScale) : 1,
  );

  const pendingTargetRef = useRef<PendingZoomTarget | null>(null);
  const onScaleChangeRef = useRef(onScaleChange);
  useEffect(() => {
    onScaleChangeRef.current = onScaleChange;
  }, [onScaleChange]);

  const recomputeFitScale = useCallback(
    (mode: "fit-width" | "fit-page"): number => {
      const container = containerRef.current;
      if (!container || basePageWidth <= 0 || basePageHeight <= 0) return 1;
      const inputs = {
        containerWidth: container.clientWidth,
        containerHeight: container.clientHeight,
        pageWidth: basePageWidth,
        pageHeight: basePageHeight,
        rotation,
      };
      return mode === "fit-width"
        ? computeFitWidthScale(inputs)
        : computeFitPageScale(inputs);
    },
    [containerRef, basePageWidth, basePageHeight, rotation],
  );

  // Apply fit-mode scale on mount, on rotation change, and on container resize.
  useEffect(() => {
    if (!fitMode) return;
    const container = containerRef.current;
    if (!container) return;

    const apply = () => {
      const next = recomputeFitScale(fitMode);
      setScaleState(next);
    };
    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(container);
    return () => ro.disconnect();
  }, [fitMode, recomputeFitScale, containerRef]);

  // Notify parent when scale or fitMode actually changes.
  const lastNotifiedRef = useRef<{ scale: number; fitMode: PdfFitMode }>({
    scale,
    fitMode,
  });
  useEffect(() => {
    if (
      lastNotifiedRef.current.scale !== scale ||
      lastNotifiedRef.current.fitMode !== fitMode
    ) {
      lastNotifiedRef.current = { scale, fitMode };
      onScaleChangeRef.current?.({ scale, fitMode });
    }
  }, [scale, fitMode]);

  // After scale change from a cursor-anchored zoom, restore scroll so the
  // cursor stays over the same point in the document.
  useLayoutEffect(() => {
    const target = pendingTargetRef.current;
    if (!target) return;
    pendingTargetRef.current = null;

    const container = containerRef.current;
    if (!container) return;
    const factor = scale / target.oldScale;
    container.scrollLeft = target.docX * factor - target.cursorX;
    container.scrollTop = target.docY * factor - target.cursorY;
  }, [scale, containerRef]);

  const setScale = useCallback(
    (next: number | "fit-width" | "fit-page") => {
      if (next === "fit-width" || next === "fit-page") {
        setFitMode(next);
        // recompute via effect
        return;
      }
      setFitMode(null);
      setScaleState(clampScale(next));
    },
    [],
  );

  const zoomIn = useCallback(() => {
    setFitMode(null);
    setScaleState((s) => nextZoomIn(s));
  }, []);
  const zoomOut = useCallback(() => {
    setFitMode(null);
    setScaleState((s) => nextZoomOut(s));
  }, []);
  const resetZoom = useCallback(() => {
    setFitMode(null);
    setScaleState(1);
  }, []);

  // Wheel-zoom (Ctrl/Cmd + wheel). Cursor-anchored.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const docX = container.scrollLeft + cursorX;
      const docY = container.scrollTop + cursorY;
      pendingTargetRef.current = {
        cursorX,
        cursorY,
        docX,
        docY,
        oldScale: scale,
      };
      setFitMode(null);
      setScaleState((current) => {
        const target = e.deltaY > 0 ? nextZoomOut(current) : nextZoomIn(current);
        return target;
      });
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [containerRef, scale]);

  // Pinch-zoom on touch devices via Pointer Events.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pointers = new Map<number, { x: number; y: number }>();
    let initialDistance = 0;
    let initialScale = scale;
    let initialMid = { x: 0, y: 0 };
    let initialDocPoint = { x: 0, y: 0 };

    const distance = () => {
      const pts = Array.from(pointers.values());
      if (pts.length < 2) return 0;
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      return Math.hypot(dx, dy);
    };

    const midpoint = () => {
      const pts = Array.from(pointers.values());
      if (pts.length < 2) return { x: 0, y: 0 };
      return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        initialDistance = distance();
        initialScale = scale;
        const rect = container.getBoundingClientRect();
        const mid = midpoint();
        initialMid = {
          x: mid.x - rect.left,
          y: mid.y - rect.top,
        };
        initialDocPoint = {
          x: container.scrollLeft + initialMid.x,
          y: container.scrollTop + initialMid.y,
        };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && initialDistance > 0) {
        e.preventDefault();
        const newDistance = distance();
        const ratio = newDistance / initialDistance;
        const next = clampScale(initialScale * ratio);
        pendingTargetRef.current = {
          cursorX: initialMid.x,
          cursorY: initialMid.y,
          docX: initialDocPoint.x,
          docY: initialDocPoint.y,
          oldScale: initialScale,
        };
        setFitMode(null);
        setScaleState(next);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) {
        initialDistance = 0;
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove, { passive: false });
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
    };
  }, [containerRef, scale]);

  return {
    scale,
    fitMode,
    setScale,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}

export const PDF_VIEWER_SCALE_BOUNDS = {
  min: PDF_VIEWER_MIN_SCALE,
  max: PDF_VIEWER_MAX_SCALE,
};
