"use client";

import { cn } from "@/lib/utils";
import type { SplitOrientation } from "../types";

export function SplitDivider({
  orientation,
  x,
  y,
  length,
  ratioPercent,
  onPointerDown,
}: {
  orientation: SplitOrientation;
  x: number;
  y: number;
  length: number;
  ratioPercent: number;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  const isVertical = orientation === "vertical";
  return (
    <div
      role="separator"
      aria-orientation={isVertical ? "vertical" : "horizontal"}
      aria-valuenow={Math.round(ratioPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      onPointerDown={(e) => {
        e.preventDefault();
        onPointerDown(e);
      }}
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
