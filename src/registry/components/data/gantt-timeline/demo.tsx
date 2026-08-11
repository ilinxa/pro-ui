"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import {
  GanttTimeline,
  GanttTimelineAxis,
  GanttTimelineBody,
  GanttTimelineGutter,
  GanttTimelineRoot,
  GanttTimelineSkeleton,
  GanttFullCardTooltip,
} from "./";
import type { GanttTimelineHandle, TaskItem } from "./";
import {
  GANTT_DUMMY,
  GANTT_LABEL_OPTIONS,
  GANTT_PRIORITY_OPTIONS,
  GANTT_STATUS_OPTIONS,
} from "./dummy-data";

export default function GanttTimelineDemo() {
  const handle = useRef<GanttTimelineHandle>(null);
  const [clicked, setClicked] = useState<TaskItem | null>(null);

  return (
    <Tabs defaultValue="timeline" className="w-full gap-4">
      <SwipeTabsList>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="editable">Editable</TabsTrigger>
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
        <GanttTimeline
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

      {/* 1b — editable: full CRUD + drag/resize + reparent + a consumer-owned undo stack */}
      <TabsContent value="editable">
        <EditableDemo />
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
          <GanttTimeline data={[]} />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Gestures disabled (toolbar + keyboard still work)
          </p>
          <GanttTimeline
            data={GANTT_DUMMY}
            statusOptions={GANTT_STATUS_OPTIONS}
            disableGestures
            now={new Date("2026-06-20T12:00:00.000Z")}
          />
        </div>
      </TabsContent>

      {/* 4 — full-card tooltip (lazy-loads task-card) */}
      <TabsContent value="full-card" className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Hover a bar — <code className="font-mono">renderTooltip</code> embeds the full
          <code className="font-mono"> task-card</code> (lazy-loaded only here).
        </p>
        <GanttTimeline
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

/**
 * Editable example. Data is controlled — the host owns it and echoes `onChange`.
 * Undo/redo is therefore free: a plain history stack of the forests `onChange`
 * hands over (the v0.2 D19 recipe).
 */
function EditableDemo() {
  const [hist, setHist] = useState<{ stack: TaskItem[][]; cursor: number }>({
    stack: [GANTT_DUMMY],
    cursor: 0,
  });
  const data = hist.stack[hist.cursor];
  const push = (next: TaskItem[]) =>
    setHist((h) => ({
      stack: [...h.stack.slice(0, h.cursor + 1), next],
      cursor: h.cursor + 1,
    }));
  const undo = () =>
    setHist((h) => ({ ...h, cursor: Math.max(0, h.cursor - 1) }));
  const redo = () =>
    setHist((h) => ({
      ...h,
      cursor: Math.min(h.stack.length - 1, h.cursor + 1),
    }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={hist.cursor === 0}
          onClick={undo}
        >
          Undo
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={hist.cursor === hist.stack.length - 1}
          onClick={redo}
        >
          Redo
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          Drag a bar to move · drag edges to resize · drag a summary bracket to
          move the whole group · toggle <strong>Draw</strong>, then drag an empty
          row to create (off = pan) · double-click or right-click a bar to edit ·
          drag the gutter grip to reparent · ＋ / trash on row hover · Delete key
        </span>
      </div>
      <GanttTimeline
        data={data}
        editable
        statusOptions={GANTT_STATUS_OPTIONS}
        priorityOptions={GANTT_PRIORITY_OPTIONS}
        labelOptions={GANTT_LABEL_OPTIONS}
        defaultZoom="week"
        now={new Date("2026-06-20T12:00:00.000Z")}
        onChange={push}
        aria-label="Editable Q3 plan timeline"
      />
    </div>
  );
}
