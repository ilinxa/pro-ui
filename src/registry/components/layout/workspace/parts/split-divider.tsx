"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { SplitOrientation } from "../types";

export function SplitDivider({
  orientation,
  x,
  y,
  length,
  ratioPercent,
  onPointerDown,
  onKeyResize,
}: {
  orientation: SplitOrientation;
  x: number;
  y: number;
  length: number;
  ratioPercent: number;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onKeyResize?: (delta: number) => void;
}) {
  const isVertical = orientation === "vertical";
  const ref = useRef<HTMLDivElement>(null);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onKeyResize) return;
    let delta = 0;
    if (isVertical) {
      if (e.key === "ArrowRight") delta = 1;
      else if (e.key === "ArrowLeft") delta = -1;
      else return;
    } else {
      if (e.key === "ArrowDown") delta = 1;
      else if (e.key === "ArrowUp") delta = -1;
      else return;
    }
    e.preventDefault();
    onKeyResize(delta);
  };
  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={-1}
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      aria-valuenow={Math.round(ratioPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      onPointerDown={(e) => {
        e.preventDefault();
        ref.current?.focus();
        onPointerDown(e);
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute z-20 touch-none select-none bg-transparent transition-colors hover:bg-primary/40 focus-visible:bg-primary/40 focus-visible:outline-none",
        isVertical ? "cursor-col-resize" : "cursor-row-resize",
      )}
      style={
        isVertical
          ? {
              left: x - 3,
              top: y,
              width: 6,
              height: length,
            }
          : {
              left: x,
              top: y - 3,
              width: length,
              height: 6,
            }
      }
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute bg-border",
          isVertical
            ? "left-1/2 top-0 h-full w-px -translate-x-1/2"
            : "left-0 top-1/2 h-px w-full -translate-y-1/2",
        )}
      />
    </div>
  );
}
