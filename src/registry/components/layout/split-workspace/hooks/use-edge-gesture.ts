"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Action } from "../lib/reducer";
import type { Rect } from "../lib/geometry";
import { clampRatio } from "../lib/geometry";
import type { SplitOrientation } from "../types";

type EdgeDragState = {
  splitPath: number[];
  orientation: SplitOrientation;
  bounds: Rect;
  startRatio: number;
  startClient: { x: number; y: number };
};

export function useEdgeGesture(opts: {
  rootRef: React.RefObject<HTMLElement | null>;
  minAreaSize: { width: number; height: number };
  dispatch: React.Dispatch<Action>;
}) {
  const { rootRef, minAreaSize, dispatch } = opts;
  const [active, setActive] = useState(false);
  const dragRef = useRef<EdgeDragState | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRatioRef = useRef<number | null>(null);

  const beginEdgeDrag = useCallback(
    (
      splitPath: number[],
      orientation: SplitOrientation,
      bounds: Rect,
      startRatio: number,
      clientX: number,
      clientY: number,
      pointerId: number,
    ) => {
      const root = rootRef.current;
      if (!root) return;
      dragRef.current = {
        splitPath,
        orientation,
        bounds,
        startRatio,
        startClient: { x: clientX, y: clientY },
      };
      setActive(true);
      try {
        root.setPointerCapture(pointerId);
      } catch {
        // ignore
      }
    },
    [rootRef],
  );

  useEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    if (!root) return;

    const flush = () => {
      rafRef.current = null;
      const next = pendingRatioRef.current;
      pendingRatioRef.current = null;
      const drag = dragRef.current;
      if (!drag || next === null) return;
      dispatch({ type: "resize", splitPath: drag.splitPath, ratio: next });
    };

    const handleMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startClient.x;
      const dy = e.clientY - drag.startClient.y;
      let nextRatio: number;
      if (drag.orientation === "vertical") {
        const offset = dx;
        const aWidth = drag.bounds.width * drag.startRatio + offset;
        nextRatio = clampRatio(
          aWidth / drag.bounds.width,
          drag.bounds.width,
          minAreaSize.width,
          minAreaSize.width,
        );
      } else {
        const offset = dy;
        const aHeight = drag.bounds.height * drag.startRatio + offset;
        nextRatio = clampRatio(
          aHeight / drag.bounds.height,
          drag.bounds.height,
          minAreaSize.height,
          minAreaSize.height,
        );
      }
      pendingRatioRef.current = nextRatio;
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(flush);
      }
    };

    const handleUp = (e: PointerEvent) => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        flush();
      }
      try {
        root.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragRef.current = null;
      setActive(false);
    };

    const handleCancel = () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      dragRef.current = null;
      setActive(false);
    };

    root.addEventListener("pointermove", handleMove);
    root.addEventListener("pointerup", handleUp);
    root.addEventListener("pointercancel", handleCancel);
    return () => {
      root.removeEventListener("pointermove", handleMove);
      root.removeEventListener("pointerup", handleUp);
      root.removeEventListener("pointercancel", handleCancel);
    };
  }, [active, rootRef, dispatch, minAreaSize.width, minAreaSize.height]);

  return { beginEdgeDrag, isResizing: active };
}
