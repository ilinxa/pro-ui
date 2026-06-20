"use client";

import { CalendarClock, Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useGanttTimeline } from "../hooks/use-gantt-context";
import type { GanttZoom } from "../types";

const ZOOMS: { value: GanttZoom; label: string }[] = [
  { value: "hour", label: "H" },
  { value: "day", label: "D" },
  { value: "week", label: "W" },
  { value: "month", label: "M" },
  { value: "quarter", label: "Q" },
];

export function GanttTimelineToolbar({ className }: { className?: string }) {
  const { namedZoom, setZoomLevel, zoomBy, zoomToFit, scrollToToday } =
    useGanttTimeline();
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 border-b border-border bg-card px-2 py-1.5",
        className,
      )}
    >
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={scrollToToday}
      >
        <CalendarClock className="size-3.5" /> Today
      </Button>
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-7"
        aria-label="Zoom out"
        onClick={() => zoomBy(0.7)}
      >
        <Minus className="size-3.5" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-7"
        aria-label="Zoom in"
        onClick={() => zoomBy(1 / 0.7)}
      >
        <Plus className="size-3.5" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={zoomToFit}
      >
        <Maximize2 className="size-3.5" /> Fit
      </Button>
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <div
        role="group"
        aria-label="Zoom level"
        className="ml-auto inline-flex overflow-hidden rounded-md border border-border"
      >
        {ZOOMS.map((z) => (
          <button
            key={z.value}
            type="button"
            aria-pressed={namedZoom === z.value}
            onClick={() => setZoomLevel(z.value)}
            className={cn(
              "h-7 w-7 text-xs font-medium transition-colors",
              namedZoom === z.value
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {z.label}
          </button>
        ))}
      </div>
    </div>
  );
}
