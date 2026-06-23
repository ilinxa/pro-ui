"use client";

import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { format, isSameDay, isSameMonth, startOfDay } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar-context";
import { layoutMonthWeek, occurrencesOnDay } from "../lib/segments";
import { monthGrid } from "../lib/date-range";
import {
  CalendarEventBar,
  CalendarEventChip,
  EventHoverWrap,
} from "./calendar-event";
import { DraggableEventWrap } from "./calendar-edit-affordances";
import type { CalendarOccurrence, TodoItem } from "../types";

const DEFAULT_CAP = 3;
const LANE_H = "1.3rem";

/** One month-grid day cell (Tier C). Renders the cell chrome + day number +
 *  the "+N more" affordance; spanning events are overlaid by the view. The
 *  editable view passes `dropRef`/`isOver` (a @dnd-kit droppable) + a create
 *  click; read-only consumers omit them and the cell stays context-free. */
export function MonthDayCell({
  day,
  outside,
  today,
  hidden,
  hiddenItems,
  onDayClick,
  onDayDoubleClick,
  onShowMore,
  dropRef,
  isOver,
  creatable,
}: {
  day: Date;
  outside: boolean;
  today: boolean;
  hidden: number;
  hiddenItems: CalendarOccurrence[];
  onDayClick?: (d: Date) => void;
  onDayDoubleClick?: (d: Date, e: ReactMouseEvent) => void;
  onShowMore?: (d: Date, items: TodoItem[]) => void;
  dropRef?: (el: HTMLElement | null) => void;
  isOver?: boolean;
  creatable?: boolean;
}) {
  return (
    <div
      ref={dropRef}
      role="gridcell"
      // Editable cells are keyboard-focusable; the root's delegated handler reads
      // `data-day-ms` so Enter on a focused empty day opens the quick-composer.
      tabIndex={creatable ? 0 : undefined}
      data-day-ms={creatable ? startOfDay(day).getTime() : undefined}
      onClick={onDayClick ? () => onDayClick(day) : undefined}
      onDoubleClick={onDayDoubleClick ? (e) => onDayDoubleClick(day, e) : undefined}
      className={cn(
        "relative min-h-27 border-r border-border outline-none last:border-r-0",
        (onDayClick || creatable) && "cursor-pointer",
        creatable &&
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        outside && "bg-muted/30",
        isOver && "bg-primary/10 ring-1 ring-inset ring-primary/40",
      )}
    >
      <div className="flex items-center justify-end p-1">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
            outside ? "text-muted-foreground" : "text-foreground",
            today && "bg-primary font-semibold text-primary-foreground",
          )}
        >
          {format(day, "d")}
        </span>
      </div>
      {hidden > 0 ? (
        <div className="absolute inset-x-1 bottom-1">
          {onShowMore ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShowMore(day, hiddenItems.map((o) => o.item));
              }}
              className="w-full rounded-sm px-1 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              +{hidden} more
            </button>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full rounded-sm px-1 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  +{hidden} more
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-2">
                <p className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">
                  {format(day, "EEEE, MMM d")}
                </p>
                <DayList day={day} items={hiddenItems} />
              </PopoverContent>
            </Popover>
          )}
        </div>
      ) : null}
    </div>
  );
}

function DayList({
  items,
}: {
  day: Date;
  items: CalendarOccurrence[];
}) {
  const { select, onTaskClick } = useCalendar();
  return (
    <div className="flex flex-col gap-1">
      {items.map((occ) => (
        <CalendarEventChip
          key={occ.id}
          occ={occ}
          onClick={() => {
            select(occ.id);
            onTaskClick?.(occ.item);
          }}
        />
      ))}
    </div>
  );
}

/** Editable droppable wrapper around a day cell (Tier B — editable only). */
function DroppableDayCell(props: {
  day: Date;
  outside: boolean;
  today: boolean;
  hidden: number;
  hiddenItems: CalendarOccurrence[];
  onShowMore?: (d: Date, items: TodoItem[]) => void;
}) {
  const { createItem, quickCompose, openComposer } = useCalendar();
  const dayMs = startOfDay(props.day).getTime();
  const { setNodeRef, isOver } = useDroppable({
    id: `day:${dayMs}`,
    data: { dayMs },
  });
  return (
    <MonthDayCell
      {...props}
      dropRef={setNodeRef}
      isOver={isOver}
      creatable
      onDayDoubleClick={(d, e) => {
        const startMs = startOfDay(d).getTime();
        if (quickCompose) {
          openComposer({
            date: new Date(startMs),
            allDay: true,
            defaultEnd: new Date(startMs),
            x: e.clientX,
            y: e.clientY,
          });
        } else {
          createItem(null, undefined, { startMs, allDay: true });
        }
      }}
    />
  );
}

/** Month view (Tier B). 7-column weekday grid; multi-day spanning bars + chips
 *  in lanes, "+N more" overflow per day. Editable: drag-to-reschedule (whole
 *  days), all-day bar resize, click-to-create, hover-delete. */
export function CalendarMonthView({ className }: { className?: string }) {
  const ctx = useCalendar();
  const {
    focusDate,
    weekStartsOn,
    occurrences,
    nowMs,
    maxEventsPerCell,
    selectedId,
    select,
    onTaskClick,
    onDateClick,
    onShowMore,
    renderTooltip,
    editable,
    can,
    resizePreview,
  } = ctx;

  const weeks = monthGrid(focusDate, weekStartsOn);
  const weeksCount = weeks.length;
  const nowDate = new Date(nowMs);

  // F-04 — height-responsive overflow cap: derive how many event lanes fit in a
  // measured week-row, so a taller calendar shows more events before "+N more".
  // `maxEventsPerCell` overrides (no measuring). rAF-coalesced ResizeObserver
  // (gantt G8); state is set only inside the rAF (never directly in the effect).
  const rowsRef = useRef<HTMLDivElement>(null);
  const [responsiveCap, setResponsiveCap] = useState(DEFAULT_CAP);
  useEffect(() => {
    const el = rowsRef.current;
    if (!el || maxEventsPerCell != null) return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rowH = el.clientHeight / Math.max(1, weeksCount);
        const root =
          parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const laneH = root * 1.3 + 2; // LANE_H (1.3rem) + the grid's gap-y-0.5
        const next = Math.max(1, Math.floor((rowH - 34) / laneH)); // 34 ≈ day-number row
        setResponsiveCap((prev) => (prev === next ? prev : next));
      });
    });
    ro.observe(el);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [maxEventsPerCell, weeksCount]);

  const cap = maxEventsPerCell ?? responsiveCap;
  // Apply the live resize preview to the occurrence being dragged.
  const occs = resizePreview
    ? occurrences.map((o) =>
        o.id === resizePreview.id
          ? { ...o, startMs: resizePreview.startMs, endMs: resizePreview.endMs }
          : o,
      )
    : occurrences;

  const activate = (occ: CalendarOccurrence) => {
    select(occ.id);
    onTaskClick?.(occ.item);
  };

  return (
    <div role="grid" className={cn("flex h-full flex-col", className)}>
      {/* weekday header */}
      <div role="row" className="grid grid-cols-7 border-b border-border">
        {weeks[0].map((d) => (
          <div
            key={d.toISOString()}
            role="columnheader"
            className="border-r border-border px-2 py-1.5 text-xs font-medium text-muted-foreground last:border-r-0"
          >
            {format(d, "EEE")}
          </div>
        ))}
      </div>

      {/* week rows — share the available height so the overflow cap is responsive */}
      <div ref={rowsRef} className="flex min-h-0 flex-1 flex-col">
        {weeks.map((week) => (
          <MonthWeekRow
            key={week[0].toISOString()}
            week={week}
            cap={cap}
            occurrences={occs}
            focusDate={focusDate}
            nowDate={nowDate}
            selectedId={selectedId}
            editable={editable}
            can={can}
            onDateClick={onDateClick}
            onShowMore={onShowMore}
            renderTooltip={renderTooltip}
            activate={activate}
          />
        ))}
      </div>
    </div>
  );
}

/** One week row — split out so it can own a stable ref for resize geometry. */
function MonthWeekRow({
  week,
  cap,
  occurrences,
  focusDate,
  nowDate,
  selectedId,
  editable,
  can,
  onDateClick,
  onShowMore,
  renderTooltip,
  activate,
}: {
  week: Date[];
  cap: number;
  occurrences: CalendarOccurrence[];
  focusDate: Date;
  nowDate: Date;
  selectedId: string | null;
  editable: boolean;
  can: ReturnType<typeof useCalendar>["can"];
  onDateClick?: (d: Date) => void;
  onShowMore?: (d: Date, items: TodoItem[]) => void;
  renderTooltip?: ReturnType<typeof useCalendar>["renderTooltip"];
  activate: (occ: CalendarOccurrence) => void;
}) {
  const weekRef = useRef<HTMLDivElement | null>(null);
  const layout = layoutMonthWeek(week, occurrences, cap);

  return (
    <div
      ref={weekRef}
      role="row"
      className="relative grid min-h-0 flex-1 grid-cols-7 border-b border-border last:border-b-0"
    >
      {week.map((day, col) => {
        const onDay = occurrencesOnDay(occurrences, day);
        const hiddenItems = onDay.filter(
          (o) => !layout.segments.some((s) => s.occ.id === o.id),
        );
        const cellProps = {
          day,
          outside: !isSameMonth(day, focusDate),
          today: isSameDay(day, nowDate),
          hidden: layout.overflow[col],
          hiddenItems,
          onShowMore,
        };
        return editable ? (
          <DroppableDayCell key={day.toISOString()} {...cellProps} />
        ) : (
          <MonthDayCell
            key={day.toISOString()}
            {...cellProps}
            onDayClick={onDateClick}
          />
        );
      })}

      {/* events overlay (bars + chips), placed by lane */}
      <div
        className="pointer-events-none absolute inset-x-0 top-8 grid grid-cols-7 gap-x-px gap-y-0.5 px-px"
        style={
          {
            gridTemplateRows: `repeat(${cap}, minmax(0, ${LANE_H}))`,
          } as CSSProperties
        }
      >
        {layout.segments.map((seg) => {
          const tooltip = renderTooltip
            ? renderTooltip(seg.occ.item, seg.occ)
            : undefined;
          const isBar = seg.spanning || seg.occ.allDay;
          const Event = isBar ? (
            <CalendarEventBar
              occ={seg.occ}
              selected={selectedId === seg.occ.id}
              continuesLeft={seg.continuesLeft}
              continuesRight={seg.continuesRight}
              onClick={() => activate(seg.occ)}
            />
          ) : (
            <CalendarEventChip
              occ={seg.occ}
              selected={selectedId === seg.occ.id}
              onClick={() => activate(seg.occ)}
            />
          );
          const canDrag = editable && can("move", seg.occ.item);
          // All-day bars (incl. single-day) get day-resize grips → drag an edge
          // to extend across days. Clipped (continues-left/right) bars can't.
          const resizable =
            editable &&
            seg.occ.allDay &&
            !seg.continuesLeft &&
            !seg.continuesRight &&
            can("resize", seg.occ.item);
          return (
            <div
              key={seg.occ.id}
              className="pointer-events-auto min-w-0"
              style={{
                gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}`,
                gridRow: seg.lane + 1,
              }}
            >
              {editable ? (
                <DraggableEventWrap
                  occ={seg.occ}
                  canDrag={canDrag}
                  resizable={resizable}
                  containerRef={weekRef}
                  cols={week}
                >
                  {Event}
                </DraggableEventWrap>
              ) : (
                <EventHoverWrap tooltip={tooltip}>{Event}</EventHoverWrap>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
