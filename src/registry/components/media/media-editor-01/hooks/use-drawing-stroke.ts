"use client";

import { useCallback, useRef, useState } from "react";
import type { DrawingStroke } from "../types";

export interface UseDrawingStrokeOptions {
  color: string;
  brushSize: number;
  mode: "draw" | "erase";
  /** Fires once when the user lifts the pointer — receives the completed stroke. */
  onStrokeComplete: (stroke: DrawingStroke) => void;
}

export interface UseDrawingStrokeResult {
  /** In-progress stroke (rendered live until pointer-up). */
  currentStroke: DrawingStroke | null;
  /** Bind onto Stage pointer events when draw tool is active. */
  beginAt: (x: number, y: number) => void;
  extendTo: (x: number, y: number) => void;
  end: () => void;
  cancel: () => void;
}

/**
 * Pointer-frame collector for a single freehand stroke.
 *
 * The composer-editor wires Stage pointer events into beginAt/extendTo/end
 * when the draw tool is active. Each completed stroke is dispatched once via
 * `onStrokeComplete` — the parent records that as a single undo command (one
 * command per stroke, not one per pointer frame).
 */
export function useDrawingStroke(
  options: UseDrawingStrokeOptions,
): UseDrawingStrokeResult {
  const { color, brushSize, mode, onStrokeComplete } = options;
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(
    null,
  );
  const strokeRef = useRef<DrawingStroke | null>(null);

  const beginAt = useCallback(
    (x: number, y: number) => {
      const id = `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const next: DrawingStroke = {
        id,
        points: [x, y],
        color,
        brushSize,
        mode,
      };
      strokeRef.current = next;
      setCurrentStroke(next);
    },
    [color, brushSize, mode],
  );

  const extendTo = useCallback((x: number, y: number) => {
    const s = strokeRef.current;
    if (!s) return;
    s.points.push(x, y);
    // Re-render — clone the points array so React notices.
    setCurrentStroke({ ...s, points: [...s.points] });
  }, []);

  const end = useCallback(() => {
    const s = strokeRef.current;
    strokeRef.current = null;
    setCurrentStroke(null);
    if (!s || s.points.length < 4) return; // ignore single-point taps
    onStrokeComplete(s);
  }, [onStrokeComplete]);

  const cancel = useCallback(() => {
    strokeRef.current = null;
    setCurrentStroke(null);
  }, []);

  return { currentStroke, beginAt, extendTo, end, cancel };
}
