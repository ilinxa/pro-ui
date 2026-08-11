"use client";

import { cn } from "@/lib/utils";
import { useGanttTimeline } from "../hooks/use-gantt-context";
import type { GanttViewport } from "../types";
import {
  addUnit,
  isWeekend,
  majorLabel,
  minorLabel,
  pickScales,
  ticks,
  x,
} from "../lib/time-scale";

const OVERSCAN_PX = 260;

/** Tier C — dumb two-tier header from a viewport. */
export function AxisHeader({
  viewport,
  bodyWidth,
  gutterWidth,
  showWeekendShading,
  className,
}: {
  viewport: GanttViewport;
  bodyWidth: number;
  gutterWidth: number;
  showWeekendShading?: boolean;
  className?: string;
}) {
  const { minor, major } = pickScales(viewport.pxPerMs);
  const fromMs = viewport.originMs - OVERSCAN_PX / viewport.pxPerMs;
  const toMs = viewport.originMs + (bodyWidth + OVERSCAN_PX) / viewport.pxPerMs;
  const ready = bodyWidth > 0;
  const minorTicks = ready ? ticks(minor, fromMs, toMs) : [];
  const majorTicks = ready ? ticks(major, fromMs, toMs) : [];
  const weekendsOn =
    showWeekendShading && (minor === "hour" || minor === "day");

  return (
    <div className={cn("flex select-none border-b bg-card", className)}>
      <div className="shrink-0 border-r border-border" style={{ width: gutterWidth }} />
      <div className="relative grow overflow-hidden" style={{ height: 46 }}>
        {weekendsOn
          ? minorTicks
              .filter((t) => isWeekend(t))
              .map((t) => {
                const left = x(viewport, t);
                const w = x(viewport, addUnit(minor, t)) - left;
                return (
                  <div
                    key={`w${t}`}
                    aria-hidden
                    className="absolute inset-y-0 bg-muted/50"
                    style={{ left, width: w }}
                  />
                );
              })
          : null}
        {majorTicks.map((t) => {
          const left = x(viewport, t);
          const w = x(viewport, addUnit(major, t)) - left;
          return (
            <div
              key={`M${t}`}
              className="absolute top-0 flex h-6 items-center overflow-hidden whitespace-nowrap border-r border-border/60 px-2 text-xs font-medium text-foreground"
              style={{ left, width: w }}
            >
              {majorLabel(major, t)}
            </div>
          );
        })}
        {minorTicks.map((t) => {
          const left = x(viewport, t);
          const w = x(viewport, addUnit(minor, t)) - left;
          return (
            <div
              key={`m${t}`}
              className="absolute bottom-0 flex h-5 items-center justify-center overflow-hidden border-r border-border/40 text-[10px] tabular-nums text-muted-foreground"
              style={{ left, width: w }}
            >
              {minorLabel(minor, t)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Tier B — context-connected axis. */
export function GanttTimelineAxis({ className }: { className?: string }) {
  const { viewport, bodyWidth, gutterWidth, showWeekendShading } =
    useGanttTimeline();
  return (
    <AxisHeader
      viewport={viewport}
      bodyWidth={bodyWidth}
      gutterWidth={gutterWidth}
      showWeekendShading={showWeekendShading}
      className={className}
    />
  );
}
