"use client";

import { useEffect, useState, type RefObject } from "react";

export interface StageSize {
  width: number;
  height: number;
}

/**
 * Stage size for a measured container. With a fixed `ratio` (width / height)
 * the stage is the largest ratio box inside the measured box; its LONGER side
 * is rounded and the shorter side derived from it (rounded), so the short-side
 * error stays under 1 px whatever the ratio (rounding the width and deriving
 * the height scales the error by 1 / ratio). Each side is clamped to the
 * rounded measured size, so the stage is never larger than its box. An
 * unmeasured height (0) leaves the width as the only constraint. Without a
 * ratio the measured size is used as is.
 */
export function stageSizeFor(
  width: number,
  height: number,
  ratio?: number | null,
): StageSize {
  const w = Math.round(width);
  const h = Math.round(height);
  if (ratio && Number.isFinite(ratio) && ratio > 0 && w > 0) {
    const fitW = height > 0 ? Math.min(width, height * ratio) : width;
    const clampW = w;
    const clampH = h > 0 ? h : Infinity;
    if (ratio >= 1) {
      const sw = Math.round(fitW);
      return { width: Math.min(sw, clampW), height: Math.min(Math.round(sw / ratio), clampH) };
    }
    const sh = Math.round(fitW / ratio);
    return { width: Math.min(Math.round(sh * ratio), clampW), height: Math.min(sh, clampH) };
  }
  return { width: w, height: h };
}

/**
 * Observe the container element's content box and return its size in px.
 *
 * Konva.Stage needs explicit `width` + `height` props in pixels — it can't
 * track CSS sizing on its own. This hook bridges that gap via ResizeObserver.
 * `ratio` (optional, width / height) makes the stage take that ratio exactly.
 */
export function useKonvaStageSize(
  ref: RefObject<HTMLElement | null>,
  ratio?: number | null,
): StageSize {
  const [size, setSize] = useState<StageSize>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Seed from the initial bounding rect so first paint isn't 0×0.
    const rect = el.getBoundingClientRect();
    setSize(stageSizeFor(rect.width, rect.height, ratio));

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      // Prefer contentBoxSize when available (Safari 13.4+, Chrome 84+).
      const box = Array.isArray(entry.contentBoxSize)
        ? entry.contentBoxSize[0]
        : entry.contentBoxSize;
      const width = box
        ? box.inlineSize
        : entry.contentRect.width;
      const height = box
        ? box.blockSize
        : entry.contentRect.height;
      setSize(stageSizeFor(width, height, ratio));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, ratio]);

  return size;
}
