"use client";

import { useEffect, useState, type RefObject } from "react";

export interface StageSize {
  width: number;
  height: number;
}

/**
 * Observe the container element's content box and return its size in px.
 *
 * Konva.Stage needs explicit `width` + `height` props in pixels — it can't
 * track CSS sizing on its own. This hook bridges that gap via ResizeObserver.
 */
export function useKonvaStageSize(
  ref: RefObject<HTMLElement | null>,
): StageSize {
  const [size, setSize] = useState<StageSize>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Seed from the initial bounding rect so first paint isn't 0×0.
    const rect = el.getBoundingClientRect();
    setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });

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
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
