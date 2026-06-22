"use client";

import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import { useEffect, useRef } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar-context";
import { HOURS } from "../lib/date-range";
import { layoutMonthWeek } from "../lib/segments";
import { snapStepMs, snapToStep } from "../lib/edit-mutations";
import { packLanes } from "../lib/lane-pack";
import {
  CalendarEventBar,
  CalendarTimeBlock,
  EventHoverWrap,
  NowIndicator,
} from "./calendar-event";
import { DraggableEventWrap } from "./calendar-edit-affordances";
import { CalendarEventContextMenu } from "./calendar-context-menu";
import type {
  CalendarContextValue,
  CalendarOccurrence,
  CalendarSnap,
} from "../types";

const HOUR_PX = 48;
const DAY_PX = HOUR_PX * 24;
const MS_PER_DAY = 86_400_000;
const BAND_CAP = 99; // the all-day band grows to fit its lanes
const LANE_H = "1.4rem";

/** Left hour-label rail (Tier C). */
export function TimeGutter() {
  return (
    <div className="w-14 shrink-0 select-none" aria-hidden>
      {HOURS.map((h) => (
        <div key={h} style={{ height: HOUR_PX }} className="relative">
          {h > 0 ? (
            <span className="absolute -top-2 right-1.5 text-[0.65rem] tabular-nums text-muted-foreground">
              {format(new Date(2000, 0, 1, h), "h a")}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ───────── native-pointer gestures (the continuous time grid) ───────── */

/** Drag a timed block: vertical = time (delta), horizontal = day (target column). */
function startTimedMove(
  e: ReactPointerEvent,
  occ: CalendarOccurrence,
  gridRef: RefObject<HTMLDivElement | null>,
  columns: Date[],
  snap: CalendarSnap,
  reschedule: CalendarContextValue["rescheduleItem"],
  suppressClick: { current: boolean },
) {
  if (e.button !== 0) return;
  e.stopPropagation(); // keep the column's draw handler out of it
  const grid = gridRef.current;
  if (!grid) return;
  const startX = e.clientX;
  const startY = e.clientY;
  const timeOfDay = occ.startMs - startOfDay(occ.startMs).getTime();
  const dur = occ.endMs - occ.startMs;
  const step = snapStepMs(snap);
  let moved = false;
  const onMove = (ev: PointerEvent) => {
    if (
      !moved &&
      (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4)
    )
      moved = true;
  };
  const onUp = (ev: PointerEvent) => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    if (!moved) return; // a click selects; only a real drag reschedules
    suppressClick.current = true;
    const rect = grid.getBoundingClientRect();
    const n = columns.length;
    const col = Math.max(
      0,
      Math.min(n - 1, Math.floor((ev.clientX - rect.left) / (rect.width / n))),
    );
    const dyMs = ((ev.clientY - startY) / DAY_PX) * MS_PER_DAY;
    const targetDayStart = startOfDay(columns[col]).getTime();
    const newStart = snapToStep(targetDayStart + timeOfDay + dyMs, targetDayStart, step);
    reschedule(occ.id, { startMs: newStart, endMs: newStart + dur, allDay: false }, "move");
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

/** Drag a block's top/bottom edge: set start/end time (snapped). Updates the
 *  live preview each move; commits on release. */
function startTimedResize(
  e: ReactPointerEvent,
  occ: CalendarOccurrence,
  edge: "start" | "end",
  colRef: RefObject<HTMLDivElement | null>,
  dayStartMs: number,
  snap: CalendarSnap,
  reschedule: CalendarContextValue["rescheduleItem"],
  setPreview: CalendarContextValue["setResizePreview"],
) {
  e.stopPropagation();
  e.preventDefault();
  const col = colRef.current;
  if (!col) return;
  const step = snapStepMs(snap);
  const MIN = 60_000;
  const tAt = (clientY: number) => {
    const rect = col.getBoundingClientRect();
    return snapToStep(
      dayStartMs + ((clientY - rect.top) / rect.height) * MS_PER_DAY,
      dayStartMs,
      step,
    );
  };
  const onMove = (ev: PointerEvent) => {
    const t = tAt(ev.clientY);
    if (edge === "start") {
      setPreview({ id: occ.id, startMs: Math.min(t, occ.endMs - MIN), endMs: occ.endMs });
    } else {
      setPreview({ id: occ.id, startMs: occ.startMs, endMs: Math.max(t, occ.startMs + MIN) });
    }
  };
  const onUp = (ev: PointerEvent) => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    setPreview(null);
    const t = tAt(ev.clientY);
    if (edge === "start") reschedule(occ.id, { startMs: t, allDay: false }, "resize");
    else reschedule(occ.id, { endMs: t, allDay: false }, "resize");
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

const COL_MS = (clientY: number, rect: DOMRect, dayStartMs: number, step: number) =>
  snapToStep(
    dayStartMs + ((clientY - rect.top) / rect.height) * MS_PER_DAY,
    dayStartMs,
    step,
  );

/** Request to create over a window — routes through the quick-composer or a
 *  direct create (the column owns the decision via `quickCompose`). */
type RequestCreate = (
  win: { startMs: number; endMs?: number; allDay: boolean },
  x: number,
  y: number,
) => void;

/** Drag across an empty column → create a timed event spanning the range. A
 *  single click does NOT create (that's a double-click); only a real drag does. */
function startDraw(
  e: ReactPointerEvent,
  colRef: RefObject<HTMLDivElement | null>,
  dayStartMs: number,
  snap: CalendarSnap,
  request: RequestCreate,
) {
  if (e.button !== 0) return;
  const col = colRef.current;
  if (!col) return;
  const step = snapStepMs(snap) || 900_000;
  const startMs = COL_MS(e.clientY, col.getBoundingClientRect(), dayStartMs, step);
  const startY = e.clientY;
  let moved = false;
  const onMove = (ev: PointerEvent) => {
    if (!moved && Math.abs(ev.clientY - startY) > 4) moved = true;
  };
  const onUp = (ev: PointerEvent) => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    if (!moved) return; // a click selects/deselects; only a drag creates
    const endMs = COL_MS(ev.clientY, col.getBoundingClientRect(), dayStartMs, step);
    const lo = Math.min(startMs, endMs);
    let hi = Math.max(startMs, endMs);
    if (hi <= lo) hi = lo + (step || 900_000);
    request({ startMs: lo, endMs: hi, allDay: false }, ev.clientX, ev.clientY);
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

/** Double-click an empty slot → create a default 1-hour timed event there. */
function createAtDoubleClick(
  e: ReactMouseEvent,
  colRef: RefObject<HTMLDivElement | null>,
  dayStartMs: number,
  snap: CalendarSnap,
  request: RequestCreate,
) {
  if ((e.target as HTMLElement).closest("button")) return; // not on an event
  const col = colRef.current;
  if (!col) return;
  const step = snapStepMs(snap) || 900_000;
  const startMs = COL_MS(e.clientY, col.getBoundingClientRect(), dayStartMs, step);
  request(
    { startMs, endMs: startMs + 3_600_000, allDay: false },
    e.clientX,
    e.clientY,
  );
}

/* ───────── all-day band (F-03: column-spanning bars) ───────── */

/** Editable droppable + click-create cell beneath the band overlay. */
function BandDropCell({ day }: { day: Date }) {
  const { createItem, quickCompose, openComposer } = useCalendar();
  const dayMs = startOfDay(day).getTime();
  const { setNodeRef, isOver } = useDroppable({
    id: `band:${dayMs}`,
    data: { dayMs },
  });
  return (
    <div
      ref={setNodeRef}
      // Double-click to create (parity with month/time-grid; honors quickCompose).
      onDoubleClick={(e) => {
        if (quickCompose) {
          openComposer({
            date: new Date(dayMs),
            allDay: true,
            defaultEnd: new Date(dayMs),
            x: e.clientX,
            y: e.clientY,
          });
        } else {
          createItem(null, undefined, { startMs: dayMs, allDay: true });
        }
      }}
      className={cn(
        "min-h-7 cursor-pointer border-l border-border first:border-l-0",
        isOver && "bg-primary/10",
      )}
    />
  );
}

/** The all-day band — spanning bars laid out like the month grid (F-03). */
function AllDayBand({ columns }: { columns: Date[] }) {
  const {
    occurrences,
    selectedId,
    select,
    onTaskClick,
    renderTooltip,
    editable,
    can,
    resizePreview,
  } = useCalendar();
  const overlayRef = useRef<HTMLDivElement>(null);
  const n = columns.length;

  // Apply the live resize preview, then take all-day occurrences in range.
  const occs = resizePreview
    ? occurrences.map((o) =>
        o.id === resizePreview.id
          ? { ...o, startMs: resizePreview.startMs, endMs: resizePreview.endMs }
          : o,
      )
    : occurrences;
  const firstMs = startOfDay(columns[0]).getTime();
  const lastMs = startOfDay(columns[n - 1]).getTime() + MS_PER_DAY;
  const allDay = occs.filter(
    (o) => !o.invalid && o.allDay && o.endMs > firstMs && o.startMs < lastMs,
  );
  const layout = layoutMonthWeek(columns, allDay, BAND_CAP);
  const laneCount = Math.max(1, layout.laneCount);

  const activate = (occ: CalendarOccurrence) => {
    select(occ.id);
    onTaskClick?.(occ.item);
  };

  return (
    <div className="flex border-b border-border">
      <div className="flex w-14 shrink-0 items-start justify-end pr-1.5 pt-1 text-[0.6rem] uppercase text-muted-foreground">
        all day
      </div>
      <div className="relative flex-1">
        {/* base cells (droppable + click-create when editable) */}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {columns.map((day) =>
            editable ? (
              <BandDropCell key={day.toISOString()} day={day} />
            ) : (
              <div
                key={day.toISOString()}
                className="min-h-7 border-l border-border first:border-l-0"
              />
            ),
          )}
        </div>
        {/* spanning-bar overlay */}
        <div
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 grid gap-x-px gap-y-0.5 p-0.5"
          style={{
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            gridTemplateRows: `repeat(${laneCount}, ${LANE_H})`,
          }}
        >
          {layout.segments.map((seg) => {
            const Bar = (
              <CalendarEventBar
                occ={seg.occ}
                selected={selectedId === seg.occ.id}
                continuesLeft={seg.continuesLeft}
                continuesRight={seg.continuesRight}
                onClick={() => activate(seg.occ)}
              />
            );
            const canDrag = editable && can("move", seg.occ.item);
            const resizable =
              editable &&
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
                    containerRef={overlayRef}
                    cols={columns}
                  >
                    {Bar}
                  </DraggableEventWrap>
                ) : (
                  <EventHoverWrap tooltip={renderTooltip?.(seg.occ.item, seg.occ)}>
                    {Bar}
                  </EventHoverWrap>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────── timed day column ───────── */

function DayColumn({
  day,
  columns,
  gridRef,
}: {
  day: Date;
  columns: Date[];
  gridRef: RefObject<HTMLDivElement | null>;
}) {
  const {
    occurrences,
    nowMs,
    selectedId,
    select,
    onTaskClick,
    renderTooltip,
    editable,
    can,
    snap,
    rescheduleItem,
    createItem,
    quickCompose,
    openComposer,
    resizePreview,
    setResizePreview,
  } = useCalendar();
  const colRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);

  const requestCreate: RequestCreate = (win, x, y) => {
    if (quickCompose) {
      openComposer({
        date: new Date(win.startMs),
        allDay: win.allDay,
        defaultEnd: new Date(win.endMs ?? win.startMs),
        x,
        y,
      });
    } else {
      createItem(null, undefined, win);
    }
  };

  const dayStartMs = startOfDay(day).getTime();
  const dayEndMs = dayStartMs + MS_PER_DAY;
  const timed = occurrences.filter(
    (o) => !o.invalid && !o.allDay && o.endMs > dayStartMs && o.startMs < dayEndMs,
  );
  const blocks = packLanes(timed);
  const showNow = isSameDay(day, new Date(nowMs));
  const nowFrac = (nowMs - dayStartMs) / MS_PER_DAY;

  const activate = (occ: CalendarOccurrence) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    select(occ.id);
    onTaskClick?.(occ.item);
  };

  return (
    <div
      ref={colRef}
      className="relative flex-1 border-l border-border"
      style={{ height: DAY_PX }}
      onPointerDown={
        editable
          ? (e) => startDraw(e, colRef, dayStartMs, snap, requestCreate)
          : undefined
      }
      onDoubleClick={
        editable
          ? (e) => createAtDoubleClick(e, colRef, dayStartMs, snap, requestCreate)
          : undefined
      }
    >
      {HOURS.map((h) => (
        <div
          key={h}
          style={{ height: HOUR_PX }}
          className="border-t border-border/50 first:border-t-0"
        />
      ))}
      {showNow && nowFrac >= 0 && nowFrac <= 1 ? (
        <NowIndicator topFraction={nowFrac} />
      ) : null}
      {blocks.map((b) => {
        // Apply the live resize preview to THIS block's geometry mid-gesture.
        const pv = resizePreview?.id === b.occ.id ? resizePreview : null;
        const sMs = pv ? pv.startMs : b.occ.startMs;
        const eMs = pv ? pv.endMs : b.occ.endMs;
        const top = Math.max(0, (sMs - dayStartMs) / MS_PER_DAY);
        const height = Math.min(1 - top, Math.max((eMs - sMs) / MS_PER_DAY, 0.02));
        const canMove = editable && can("move", b.occ.item);
        const canResize = editable && can("resize", b.occ.item);
        const Block = (
          <CalendarTimeBlock
            occ={b.occ}
            selected={selectedId === b.occ.id}
            onClick={() => activate(b.occ)}
            onPointerDown={
              editable
                ? (e) => {
                    e.stopPropagation(); // don't let a block click start a draw
                    if (canMove)
                      startTimedMove(
                        e,
                        b.occ,
                        gridRef,
                        columns,
                        snap,
                        rescheduleItem,
                        suppressClick,
                      );
                  }
                : undefined
            }
            top={top}
            height={height}
            left={b.lane / b.laneCount}
            width={1 / b.laneCount}
          />
        );
        return (
          <div key={b.occ.id} className="contents">
            {editable ? (
              <CalendarEventContextMenu item={b.occ.item}>
                {Block}
              </CalendarEventContextMenu>
            ) : (
              <EventHoverWrap tooltip={renderTooltip?.(b.occ.item, b.occ)}>
                {Block}
              </EventHoverWrap>
            )}
            {editable && canResize ? (
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  top: `${top * 100}%`,
                  height: `${height * 100}%`,
                  left: `calc(${(b.lane / b.laneCount) * 100}% + 1px)`,
                  width: `calc(${(1 / b.laneCount) * 100}% - 2px)`,
                }}
              >
                <div
                  role="button"
                  aria-label="Resize start"
                  onPointerDown={(e) =>
                    startTimedResize(e, b.occ, "start", colRef, dayStartMs, snap, rescheduleItem, setResizePreview)
                  }
                  className="pointer-events-auto absolute inset-x-0 top-0 flex h-2 cursor-ns-resize items-center justify-center"
                >
                  <span className="h-0.5 w-5 rounded-full bg-current opacity-40" aria-hidden />
                </div>
                <div
                  role="button"
                  aria-label="Resize end"
                  onPointerDown={(e) =>
                    startTimedResize(e, b.occ, "end", colRef, dayStartMs, snap, rescheduleItem, setResizePreview)
                  }
                  className="pointer-events-auto absolute inset-x-0 bottom-0 flex h-2 cursor-ns-resize items-center justify-center"
                >
                  <span className="h-0.5 w-5 rounded-full bg-current opacity-40" aria-hidden />
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The hour time-grid (Tier C), shared by Week (7 columns) and Day (1 column):
 * column headers + all-day band (spanning bars) + a scrollable 24h grid with
 * lane-packed timed blocks and a now-line on today. Editable: native-pointer
 * timed move/resize + draw-to-create; the all-day band drags by whole days.
 */
export function TimeGrid({
  columns,
  className,
}: {
  columns: Date[];
  className?: string;
}) {
  const { nowMs, scrollToHour } = useCalendar();
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hour = Math.max(0, Math.min(23, scrollToHour));
    el.scrollTop = (hour / 24) * el.scrollHeight;
  }, [scrollToHour]);

  const nowDate = new Date(nowMs);

  return (
    <div className={cn("flex flex-col", className)}>
      {/* column headers */}
      <div className="flex border-b border-border">
        <div className="w-14 shrink-0" />
        {columns.map((day) => (
          <div
            key={day.toISOString()}
            className="flex-1 border-l border-border px-2 py-1.5 text-center"
          >
            <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
            <div
              className={cn(
                "text-sm font-semibold tabular-nums",
                isSameDay(day, nowDate) ? "text-primary" : "text-foreground",
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* all-day band */}
      <AllDayBand columns={columns} />

      {/* scrollable hour grid */}
      <div ref={scrollRef} className="flex max-h-128 overflow-y-auto">
        <TimeGutter />
        <div ref={gridRef} className="flex flex-1">
          {columns.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              columns={columns}
              gridRef={gridRef}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
