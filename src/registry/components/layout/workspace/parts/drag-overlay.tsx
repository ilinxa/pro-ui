"use client";

import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon } from "lucide-react";
import type { CornerDragState } from "../hooks/use-corner-gesture";
import type { LeafRect } from "../lib/geometry";

export function DragOverlay({
  dragState,
  leaves,
}: {
  dragState: CornerDragState | null;
  leaves: LeafRect[];
}) {
  if (!dragState) return null;
  const intent = dragState.intent;

  if (intent.kind === "split") {
    const isVertical = intent.orientation === "vertical";
    const origin = leaves.find((l) => l.areaId === dragState.originAreaId);
    if (!origin) return null;
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute z-40 bg-primary/60"
        style={
          isVertical
            ? {
                left: intent.position.x - 1,
                top: origin.y,
                width: 2,
                height: origin.height,
              }
            : {
                left: origin.x,
                top: intent.position.y - 1,
                width: origin.width,
                height: 2,
              }
        }
      />
    );
  }

  if (intent.kind === "merge") {
    const origin = leaves.find((l) => l.areaId === dragState.originAreaId);
    const target = leaves.find((l) => l.areaId === intent.targetAreaId);
    if (!origin || !target) return null;
    let direction: "left" | "right" | "up" | "down" = "right";
    if (target.x > origin.x + origin.width / 2) direction = "right";
    else if (target.x + target.width < origin.x + origin.width / 2)
      direction = "left";
    else if (target.y > origin.y + origin.height / 2) direction = "down";
    else direction = "up";

    const Icon =
      direction === "right"
        ? ArrowRightIcon
        : direction === "left"
          ? ArrowLeftIcon
          : direction === "down"
            ? ArrowDownIcon
            : ArrowUpIcon;

    return (
      <div
        aria-hidden
        className="pointer-events-none absolute z-40 flex items-center justify-center rounded-sm bg-destructive/15 ring-2 ring-destructive"
        style={{
          left: target.x,
          top: target.y,
          width: target.width,
          height: target.height,
        }}
      >
        <div className="rounded-full bg-destructive p-2 text-destructive-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
      </div>
    );
  }

  return null;
}
