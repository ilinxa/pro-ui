"use client";

import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { getItemRects, rectanglesIntersect, type Rect } from "../lib/intersect";

interface UseMarqueeArgs {
  enabled: boolean;
  /** Apply the marquee's current selection. `additive` = shift held (add to existing). */
  applySelection: (ids: string[], additive: boolean) => void;
  /** Snapshot the current selection at marquee-start so additive mode can restore + extend. */
  snapshotSelection: () => Set<string>;
  /** Container element used for both rect query + scrolling. */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export interface MarqueeRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface UseMarqueeResult {
  rect: MarqueeRect | null;
  active: boolean;
  /** Bind to the content pane's pointer-down — only fires when pointer-down lands on whitespace. */
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
}

export function useMarquee(args: UseMarqueeArgs): UseMarqueeResult {
  const { enabled, applySelection, snapshotSelection, containerRef } = args;

  const [rect, setRect] = useState<MarqueeRect | null>(null);
  const [active, setActive] = useState(false);
  const startRef = useRef<{
    x: number;
    y: number;
    additive: boolean;
    snapshot: Set<string>;
  } | null>(null);

  // Stable refs to handlers so cleanup matches the registered listener.
  const moveHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);
  const upHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      if (e.button !== 0) return;
      const additive = e.shiftKey;
      const initialSelection = additive
        ? snapshotSelection()
        : new Set<string>();
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        additive,
        snapshot: initialSelection,
      };
      setActive(true);

      const handleMove = (moveEvent: PointerEvent) => {
        const start = startRef.current;
        const container = containerRef.current;
        if (!start || !container) return;
        const containerRect = container.getBoundingClientRect();
        const left = Math.min(start.x, moveEvent.clientX);
        const top = Math.min(start.y, moveEvent.clientY);
        const right = Math.max(start.x, moveEvent.clientX);
        const bottom = Math.max(start.y, moveEvent.clientY);
        setRect({
          left: left - containerRect.left,
          top: top - containerRect.top + container.scrollTop,
          width: right - left,
          height: bottom - top,
        });
        const marqueeRect: Rect = { left, top, right, bottom };
        const itemRects = getItemRects(container);
        const hit = new Set<string>();
        for (const [id, ir] of itemRects) {
          if (rectanglesIntersect(marqueeRect, ir)) hit.add(id);
        }
        const ids = Array.from(hit);
        applySelection(
          start.additive
            ? Array.from(new Set([...start.snapshot, ...ids]))
            : ids,
          start.additive,
        );
      };

      const handleUp = () => {
        startRef.current = null;
        setActive(false);
        setRect(null);
        if (moveHandlerRef.current)
          window.removeEventListener("pointermove", moveHandlerRef.current);
        if (upHandlerRef.current) {
          window.removeEventListener("pointerup", upHandlerRef.current);
          window.removeEventListener("pointercancel", upHandlerRef.current);
        }
        moveHandlerRef.current = null;
        upHandlerRef.current = null;
      };

      moveHandlerRef.current = handleMove;
      upHandlerRef.current = handleUp;
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
    },
    [enabled, snapshotSelection, applySelection, containerRef],
  );

  return { rect, active, onPointerDown };
}
