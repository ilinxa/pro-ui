"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { GanttTimelineHandle, GanttTimelineProps } from "./types";
import { GanttTimelineRoot } from "./parts/gantt-timeline-root";
import { GanttTimelineToolbar } from "./parts/gantt-timeline-toolbar";
import { GanttTimelineAxis } from "./parts/gantt-timeline-axis";
import { GanttTimelineGutter } from "./parts/gantt-timeline-gutter";
import { GanttTimelineBody } from "./parts/gantt-timeline-body";

/**
 * Tier A — batteries-included assembly. `Root` + the parts gated by `showToolbar`.
 * Contains no logic the parts don't; a hand-assembly (Root + any subset of parts)
 * gets identical behavior.
 */
export const GanttTimeline01 = forwardRef<
  GanttTimelineHandle,
  GanttTimelineProps
>(function GanttTimeline01(props, ref) {
  const { showToolbar = true, className, data, ...rest } = props;

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-80 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 text-center",
          className,
        )}
      >
        <p className="text-sm font-medium text-foreground">No tasks to schedule</p>
        <p className="text-xs text-muted-foreground">
          Pass a <code className="font-mono">TodoItem[]</code> to{" "}
          <code className="font-mono">data</code> to render the timeline.
        </p>
      </div>
    );
  }

  return (
    <GanttTimelineRoot
      ref={ref}
      data={data}
      {...rest}
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      {showToolbar ? <GanttTimelineToolbar /> : null}
      <GanttTimelineAxis />
      <div className="flex h-[clamp(280px,52vh,560px)]">
        <GanttTimelineGutter />
        <GanttTimelineBody />
      </div>
    </GanttTimelineRoot>
  );
});
