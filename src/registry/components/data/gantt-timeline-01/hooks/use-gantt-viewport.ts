"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GanttViewport, GanttZoom } from "../types";
import { MS, pxPerMsForZoom, timeAt, zoomForPxPerMs } from "../lib/time-scale";

type Args = {
  dataExtent: { startMs: number; endMs: number };
  bodyWidth: number;
  defaultZoom: GanttZoom;
  controlledZoom?: GanttZoom;
  onZoomChange?: (z: GanttZoom) => void;
  minZoom: GanttZoom;
  maxZoom: GanttZoom;
  onViewportChange?: (w: { from: string; to: string }) => void;
  range?: { from: string; to: string };
  nowMs: number;
};

const FRICTION = 0.94;
const MIN_VELOCITY = 0.012; // px/ms

/** Client-only; momentum honors the user's reduced-motion preference (plan §9/§10). */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export type GanttViewportApi = {
  viewport: GanttViewport;
  minPxPerMs: number;
  maxPxPerMs: number;
  namedZoom: GanttZoom;
  onPan: (deltaPx: number) => void;
  onZoomAt: (factor: number, focalPx: number) => void;
  zoomBy: (factor: number) => void;
  setZoomLevel: (z: GanttZoom) => void;
  zoomToFit: () => void;
  scrollToMs: (ms: number) => void;
  scrollToToday: () => void;
  pageBy: (dir: -1 | 1) => void;
  beginPan: () => void;
  endPanWithVelocity: (velocityPxPerMs: number) => void;
};

export function useGanttViewport(args: Args): GanttViewportApi {
  const {
    dataExtent,
    bodyWidth,
    defaultZoom,
    controlledZoom,
    onZoomChange,
    minZoom,
    maxZoom,
    onViewportChange,
    range,
    nowMs,
  } = args;

  // hour = most zoomed-in (largest pxPerMs); quarter = most zoomed-out.
  const maxPxPerMs = pxPerMsForZoom(minZoom);
  const minPxPerMs = pxPerMsForZoom(maxZoom);

  const [viewport, setViewport] = useState<GanttViewport>(() => ({
    originMs: dataExtent.startMs,
    pxPerMs: pxPerMsForZoom(defaultZoom),
  }));

  const clampPx = useCallback(
    (px: number) => Math.min(maxPxPerMs, Math.max(minPxPerMs, px)),
    [maxPxPerMs, minPxPerMs],
  );

  const clampOrigin = useCallback(
    (originMs: number, px: number, soft: boolean): number => {
      const visMs = bodyWidth / px;
      const pad = visMs * 0.5;
      const min = dataExtent.startMs - pad;
      const max = dataExtent.endMs + pad - visMs;
      if (max < min) {
        // Data narrower than the viewport — center it.
        return (dataExtent.startMs + dataExtent.endMs) / 2 - visMs / 2;
      }
      if (originMs < min) return soft ? min + (originMs - min) * 0.25 : min;
      if (originMs > max) return soft ? max + (originMs - max) * 0.25 : max;
      return originMs;
    },
    [bodyWidth, dataExtent.startMs, dataExtent.endMs],
  );

  /* ── momentum ── */
  const velRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const vcRafRef = useRef<number | null>(null);

  const onPan = useCallback(
    (deltaPx: number) => {
      setViewport((vp) => {
        const proposed = vp.originMs - deltaPx / vp.pxPerMs;
        return { ...vp, originMs: clampOrigin(proposed, vp.pxPerMs, true) };
      });
    },
    [clampOrigin],
  );

  const stopMomentum = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    velRef.current = 0;
  }, []);

  const beginPan = useCallback(() => stopMomentum(), [stopMomentum]);

  const endPanWithVelocity = useCallback(
    (velocityPxPerMs: number) => {
      stopMomentum();
      // No inertia fling when the user prefers reduced motion (plan §9/§10).
      if (prefersReducedMotion()) return;
      if (Math.abs(velocityPxPerMs) < MIN_VELOCITY) return;
      velRef.current = velocityPxPerMs;
      lastTsRef.current = 0;
      // hoisted declaration so the rAF loop can self-reference without a TDZ read
      function tick(ts: number) {
        const dt = lastTsRef.current ? ts - lastTsRef.current : 16;
        lastTsRef.current = ts;
        const v = velRef.current;
        if (Math.abs(v) < MIN_VELOCITY) {
          rafRef.current = null;
          return;
        }
        onPan(v * dt);
        velRef.current = v * FRICTION;
        rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [onPan, stopMomentum],
  );

  useEffect(() => () => stopMomentum(), [stopMomentum]);

  /* ── zoom ── */
  const onZoomAt = useCallback(
    (factor: number, focalPx: number) => {
      setViewport((vp) => {
        const focalTime = timeAt(vp, focalPx);
        const newPx = clampPx(vp.pxPerMs * factor);
        const newOrigin = focalTime - focalPx / newPx;
        return { originMs: clampOrigin(newOrigin, newPx, false), pxPerMs: newPx };
      });
    },
    [clampPx, clampOrigin],
  );

  const zoomBy = useCallback(
    (factor: number) => onZoomAt(factor, bodyWidth / 2),
    [onZoomAt, bodyWidth],
  );

  const setZoomLevel = useCallback(
    (z: GanttZoom) => {
      setViewport((vp) => {
        const newPx = clampPx(pxPerMsForZoom(z));
        const centerTime = timeAt(vp, bodyWidth / 2);
        const newOrigin = centerTime - bodyWidth / 2 / newPx;
        return { originMs: clampOrigin(newOrigin, newPx, false), pxPerMs: newPx };
      });
      onZoomChange?.(z);
    },
    [clampPx, clampOrigin, bodyWidth, onZoomChange],
  );

  const zoomToFit = useCallback(() => {
    const dataSpan = dataExtent.endMs - dataExtent.startMs;
    const pad = dataSpan * 0.04 || MS.day;
    const span = dataSpan + pad * 2;
    const px = clampPx(bodyWidth / Math.max(span, 1));
    setViewport({
      originMs: clampOrigin(dataExtent.startMs - pad, px, false),
      pxPerMs: px,
    });
  }, [clampPx, clampOrigin, bodyWidth, dataExtent.startMs, dataExtent.endMs]);

  const scrollToMs = useCallback(
    (ms: number) => {
      setViewport((vp) => {
        const origin = ms - bodyWidth / 2 / vp.pxPerMs;
        return { ...vp, originMs: clampOrigin(origin, vp.pxPerMs, false) };
      });
    },
    [clampOrigin, bodyWidth],
  );

  const scrollToToday = useCallback(() => scrollToMs(nowMs), [scrollToMs, nowMs]);

  const pageBy = useCallback(
    (dir: -1 | 1) => onPan(-dir * bodyWidth * 0.9),
    [onPan, bodyWidth],
  );

  /* ── first-paint fit (cap zoom-in at defaultZoom; honor explicit range) ── */
  const initializedRef = useRef(false);
  useEffect(() => {
    if (bodyWidth <= 0 || initializedRef.current) return;
    initializedRef.current = true;
    if (range) {
      const from = Date.parse(range.from);
      const to = Date.parse(range.to);
      if (Number.isFinite(from) && Number.isFinite(to) && to > from) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setViewport({ originMs: from, pxPerMs: clampPx(bodyWidth / (to - from)) });
        return;
      }
    }
    const dataSpan = dataExtent.endMs - dataExtent.startMs;
    const pad = dataSpan * 0.04 || MS.day;
    const span = dataSpan + pad * 2;
    const fitPx = span > 0 ? bodyWidth / span : pxPerMsForZoom(defaultZoom);
    const px = clampPx(Math.min(pxPerMsForZoom(defaultZoom), fitPx));
    const visMs = bodyWidth / px;
    const origin =
      visMs >= dataSpan
        ? (dataExtent.startMs + dataExtent.endMs) / 2 - visMs / 2
        : dataExtent.startMs - pad;
    setViewport({ originMs: origin, pxPerMs: px });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyWidth]);

  /* ── controlled zoom sync ── */
  useEffect(() => {
    if (controlledZoom == null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewport((vp) => {
      const newPx = clampPx(pxPerMsForZoom(controlledZoom));
      if (Math.abs(newPx - vp.pxPerMs) < 1e-12) return vp;
      const centerTime = timeAt(vp, bodyWidth / 2);
      return { originMs: centerTime - bodyWidth / 2 / newPx, pxPerMs: newPx };
    });
  }, [controlledZoom, clampPx, bodyWidth]);

  /* ── viewport-change echo (rAF-throttled: coalesce multiple commits per frame) ── */
  useEffect(() => {
    if (!onViewportChange || bodyWidth <= 0) return;
    if (vcRafRef.current != null) cancelAnimationFrame(vcRafRef.current);
    vcRafRef.current = requestAnimationFrame(() => {
      vcRafRef.current = null;
      onViewportChange({
        from: new Date(timeAt(viewport, 0)).toISOString(),
        to: new Date(timeAt(viewport, bodyWidth)).toISOString(),
      });
    });
    return () => {
      if (vcRafRef.current != null) {
        cancelAnimationFrame(vcRafRef.current);
        vcRafRef.current = null;
      }
    };
  }, [viewport, bodyWidth, onViewportChange]);

  const namedZoom = controlledZoom ?? zoomForPxPerMs(viewport.pxPerMs);

  return {
    viewport,
    minPxPerMs,
    maxPxPerMs,
    namedZoom,
    onPan,
    onZoomAt,
    zoomBy,
    setZoomLevel,
    zoomToFit,
    scrollToMs,
    scrollToToday,
    pageBy,
    beginPan,
    endPanWithVelocity,
  };
}
