"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import {
  GanttTimeline01,
  GanttTimelineAxis,
  GanttTimelineBody,
  GanttTimelineGutter,
  GanttTimelineRoot,
  GanttTimelineSkeleton,
  GanttFullCardTooltip,
} from "./";
import type { GanttTimelineHandle, TodoItem } from "./";
import {
  GANTT_DUMMY,
  GANTT_LABEL_OPTIONS,
  GANTT_PRIORITY_OPTIONS,
  GANTT_STATUS_OPTIONS,
} from "./dummy-data";

export default function GanttTimeline01Demo() {
  const handle = useRef<GanttTimelineHandle>(null);
  const [clicked, setClicked] = useState<TodoItem | null>(null);

  return (
    <Tabs defaultValue="timeline" className="w-full gap-4">
      <SwipeTabsList>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="composed">Composed (lighter)</TabsTrigger>
        <TabsTrigger value="states">States</TabsTrigger>
        <TabsTrigger value="full-card">Full-card tooltip</TabsTrigger>
      </SwipeTabsList>

      {/* 1 — full assembly + imperative handle */}
      <TabsContent value="timeline" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => handle.current?.scrollToToday()}>
            Scroll to today
          </Button>
          <Button size="sm" variant="outline" onClick={() => handle.current?.zoomToFit()}>
            Fit all
          </Button>
          <Button size="sm" variant="outline" onClick={() => handle.current?.expandAll()}>
            Expand all
          </Button>
          <Button size="sm" variant="outline" onClick={() => handle.current?.collapseAll()}>
            Collapse all
          </Button>
          <Button size="sm" variant="outline" onClick={() => handle.current?.scrollToItem("m-1")}>
            Jump to launch
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {clicked ? `Clicked: ${clicked.name}` : "Drag to pan · ⌘/ctrl-wheel or pinch to zoom · click a bar"}
          </span>
        </div>
        <GanttTimeline01
          ref={handle}
          data={GANTT_DUMMY}
          statusOptions={GANTT_STATUS_OPTIONS}
          priorityOptions={GANTT_PRIORITY_OPTIONS}
          labelOptions={GANTT_LABEL_OPTIONS}
          showWeekendShading
          defaultZoom="week"
          now={new Date("2026-06-20T12:00:00.000Z")}
          onTaskClick={setClicked}
          aria-label="Q3 plan timeline"
        />
      </TabsContent>

      {/* 2 — hand-assembled subset proving the compound (Root + parts, no toolbar) */}
      <TabsContent value="composed">
        <GanttTimelineRoot
          data={GANTT_DUMMY}
          statusOptions={GANTT_STATUS_OPTIONS}
          labelOptions={GANTT_LABEL_OPTIONS}
          defaultZoom="day"
          now={new Date("2026-06-20T12:00:00.000Z")}
          className="overflow-hidden rounded-lg border border-border bg-card"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium text-foreground">Sprint board</span>
            <span className="text-xs text-muted-foreground">
              Root + Gutter + Body — no toolbar, custom header
            </span>
          </div>
          <GanttTimelineAxis />
          <div className="flex h-105">
            <GanttTimelineGutter />
            <GanttTimelineBody />
          </div>
        </GanttTimelineRoot>
      </TabsContent>

      {/* 3 — empty / loading / gestures-off */}
      <TabsContent value="states" className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Loading skeleton</p>
          <GanttTimelineSkeleton rows={6} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Empty</p>
          <GanttTimeline01 data={[]} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Gestures disabled (toolbar + keyboard still work)
          </p>
          <GanttTimeline01
            data={GANTT_DUMMY}
            statusOptions={GANTT_STATUS_OPTIONS}
            disableGestures
            now={new Date("2026-06-20T12:00:00.000Z")}
          />
        </div>
      </TabsContent>

      {/* 4 — full-card tooltip (lazy-loads todo-rich-card) */}
      <TabsContent value="full-card" className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Hover a bar — <code className="font-mono">renderTooltip</code> embeds the full
          <code className="font-mono"> todo-rich-card</code> (lazy-loaded only here).
        </p>
        <GanttTimeline01
          data={GANTT_DUMMY}
          statusOptions={GANTT_STATUS_OPTIONS}
          labelOptions={GANTT_LABEL_OPTIONS}
          defaultZoom="week"
          now={new Date("2026-06-20T12:00:00.000Z")}
          renderTooltip={(item) => <GanttFullCardTooltip item={item} />}
        />
      </TabsContent>
    </Tabs>
  );
}
