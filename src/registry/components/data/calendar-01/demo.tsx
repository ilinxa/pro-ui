"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import {
  Calendar01,
  Calendar01Root,
  CalendarAgendaView,
  CalendarFullCardTooltip,
  CalendarMonthView,
  CalendarSkeleton,
  CalendarToolbar,
  useCalendar,
} from "./";
import type { CalendarHandle, TodoItem } from "./";
import {
  buildCalendarDummyData,
  CALENDAR_LABEL_OPTIONS,
  CALENDAR_PRIORITY_OPTIONS,
  CALENDAR_STATUS_OPTIONS,
} from "./dummy-data";

/** Distinct accent per status → the event color tracks the status (not time). */
const STATUS_COLORS: Record<string, string> = {
  todo: "oklch(0.62 0.13 255)", // blue — not started
  "in-progress": "var(--primary)", // signal-lime — active
  blocked: "var(--destructive)", // red — blocked
  done: "var(--muted-foreground)", // grey — done
};
const isHighPriority = (item: TodoItem) => item.priority === "high";

/** Inline view switcher for the hand-assembled "lighter" subset. */
function ComposedBody() {
  const { view } = useCalendar();
  return view === "agenda" ? <CalendarAgendaView /> : <CalendarMonthView />;
}

export default function Calendar01Demo() {
  const handle = useRef<CalendarHandle>(null);
  const [clicked, setClicked] = useState<TodoItem | null>(null);
  const [today] = useState(() => new Date());
  const data = useMemo(() => buildCalendarDummyData(today), [today]);
  // Editable tab is controlled: edits echo back into local state.
  const [editData, setEditData] = useState<TodoItem[]>(() =>
    buildCalendarDummyData(today),
  );
  const [lastEdit, setLastEdit] = useState<string>("");

  return (
    <Tabs defaultValue="calendar" className="w-full gap-4">
      <SwipeTabsList>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="editable">Editable</TabsTrigger>
        <TabsTrigger value="composed">Lighter (composed)</TabsTrigger>
        <TabsTrigger value="fullcard">Full-card tooltip</TabsTrigger>
        <TabsTrigger value="states">States</TabsTrigger>
      </SwipeTabsList>

      {/* 1 — full assembly + imperative handle + mini-nav */}
      <TabsContent value="calendar" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handle.current?.goToToday()}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handle.current?.setView("week")}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handle.current?.setView("day")}
          >
            Day
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {clicked
              ? `Clicked: ${clicked.name}`
              : "Switch views · M/W/D/A · ←/→ navigate · click an event"}
          </span>
        </div>
        <Calendar01
          ref={handle}
          data={data}
          statusOptions={CALENDAR_STATUS_OPTIONS}
          priorityOptions={CALENDAR_PRIORITY_OPTIONS}
          statusColors={STATUS_COLORS}
          flagPriority={isHighPriority}
          defaultView="month"
          now={today}
          showMiniNav
          onTaskClick={setClicked}
        />
      </TabsContent>

      {/* 1b — EDITABLE (v0.2.0): controlled data echoed via onChange */}
      <TabsContent value="editable" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            <strong>Drag</strong> to reschedule · <strong>drag an edge</strong> to
            resize · <strong>double-click</strong> (or drag) empty space →
            quick-create · <strong>right-click</strong> an event for actions ·
            select → <strong>Edit</strong> in the panel. Switch to{" "}
            <strong>Week/Day</strong> for time editing.
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {lastEdit || `${editData.length} root items`}
          </span>
        </div>
        <Calendar01
          editable
          data={editData}
          onChange={setEditData}
          statusOptions={CALENDAR_STATUS_OPTIONS}
          priorityOptions={CALENDAR_PRIORITY_OPTIONS}
          labelOptions={CALENDAR_LABEL_OPTIONS}
          statusColors={STATUS_COLORS}
          flagPriority={isHighPriority}
          defaultView="month"
          now={today}
          showInspector
          onItemAdded={(e) => setLastEdit(`Added: ${e.item.name}`)}
          onItemRemoved={(e) => setLastEdit(`Removed: ${e.removed.name}`)}
          onFieldEdited={(e) => setLastEdit(`Edited ${e.key} on ${e.itemId}`)}
        />
      </TabsContent>

      {/* 2 — hand-assembled subset (month + agenda; week/day time-grid never pulled) */}
      <TabsContent value="composed" className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Hand-assembled <code>Calendar01Root</code> + <code>CalendarToolbar</code>{" "}
          + month/agenda only — the week/day time-grid code never enters this
          bundle.
        </p>
        <Calendar01Root
          data={data}
          statusOptions={CALENDAR_STATUS_OPTIONS}
          priorityOptions={CALENDAR_PRIORITY_OPTIONS}
          statusColors={STATUS_COLORS}
          flagPriority={isHighPriority}
          now={today}
          defaultView="month"
          views={["month", "agenda"]}
        >
          <CalendarToolbar />
          <ComposedBody />
        </Calendar01Root>
      </TabsContent>

      {/* 3 — rich full-card hover tooltip (lazy todo-rich-card) */}
      <TabsContent value="fullcard" className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Hover an event → the full <code>TodoRichCard</code> (lazy-loaded; the
          default tooltip is a native title).
        </p>
        <Calendar01
          data={data}
          statusOptions={CALENDAR_STATUS_OPTIONS}
          priorityOptions={CALENDAR_PRIORITY_OPTIONS}
          statusColors={STATUS_COLORS}
          flagPriority={isHighPriority}
          now={today}
          defaultView="month"
          renderTooltip={(item) => (
            <CalendarFullCardTooltip
              item={item}
              statusOptions={CALENDAR_STATUS_OPTIONS}
            />
          )}
        />
      </TabsContent>

      {/* 4 — empty + loading */}
      <TabsContent value="states" className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Empty</p>
          <Calendar01
            data={[]}
            statusOptions={CALENDAR_STATUS_OPTIONS}
            now={today}
            defaultView="agenda"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Loading</p>
          <div className="rounded-lg border border-border bg-card">
            <CalendarSkeleton />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
