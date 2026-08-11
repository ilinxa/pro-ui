"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar-context";
import { useCalendarEditOptional } from "../hooks/use-calendar-edit-extension";
import { HOURS } from "../lib/date-range";
import { coveredDays, layoutMonthWeek } from "../lib/segments";
import { packLanes } from "../lib/lane-pack";
import {
  CalendarEventBar,
  CalendarTimeBlock,
  EventHoverWrap,
  NowIndicator,
} from "./calendar-event";
import type { CalendarOccurrence } from "../types";

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

/* ───────── all-day band (F-03: column-spanning bars) ───────── */

/** The all-day band — spanning bars laid out like the month grid (F-03).
 *  Editing (when wired): `edit.components.BandDropCell` supplies the droppable
 *  + click-create cell beneath the bars; `DraggableEventWrap` wraps each bar. */
function AllDayBand({ columns }: { columns: Date[] }) {
  const { occurrences, selectedId, select, onTaskClick, renderTooltip } =
    useCalendar();
  const edit = useCalendarEditOptional();
  const overlayRef = useRef<HTMLDivElement>(null);
  const n = columns.length;

  // Apply the live resize preview, then take all-day occurrences in range.
  const resizePreview = edit?.resizePreview ?? null;
  const occs = resizePreview
    ? occurrences.map((o) =>
        o.id === resizePreview.id
          ? { ...o, startMs: resizePreview.startMs, endMs: resizePreview.endMs }
          : o,
      )
    : occurrences;
  const firstMs = startOfDay(columns[0]).getTime();
  const lastDayMs = startOfDay(columns[n - 1]).getTime();
  // Inclusive coveredDays test (mirrors `layoutMonthWeek`'s own range check) —
  // a bare `endMs > firstMs` drops zero-length point events sitting exactly on
  // the first visible midnight, i.e. every single-day all-day event in Day
  // view and on Week's first column (v0.2.4).
  const allDay = occs.filter((o) => {
    if (o.invalid || !o.allDay) return false;
    const cov = coveredDays(o);
    return cov.lastMs >= firstMs && cov.firstMs <= lastDayMs;
  });
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
        {/* base cells (droppable + click-create when editing is wired) */}
        <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {columns.map((day) =>
            edit ? (
              <edit.components.BandDropCell key={day.toISOString()} day={day} />
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
            const canDrag = !!edit && edit.can("move", seg.occ.item);
            const resizable =
              !!edit &&
              !seg.continuesLeft &&
              !seg.continuesRight &&
              edit.can("resize", seg.occ.item);
            return (
              <div
                key={seg.occ.id}
                className="pointer-events-auto min-w-0"
                style={{
                  gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}`,
                  gridRow: seg.lane + 1,
                }}
              >
                {edit ? (
                  <edit.components.DraggableEventWrap
                    occ={seg.occ}
                    canDrag={canDrag}
                    resizable={resizable}
                    containerRef={overlayRef}
                    cols={columns}
                  >
                    {Bar}
                  </edit.components.DraggableEventWrap>
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
  const { occurrences, nowMs, selectedId, select, onTaskClick, renderTooltip } =
    useCalendar();
  const edit = useCalendarEditOptional();
  const colRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  // Active native-pointer gesture teardown — run on unmount so a mid-gesture
  // view switch can't leak window listeners or let a later, unrelated
  // pointerup commit a stale reschedule (v0.2.4).
  const gestureCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => gestureCleanup.current?.(), []);

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

  const resizePreview = edit?.resizePreview ?? null;

  return (
    <div
      ref={colRef}
      className="relative flex-1 border-l border-border"
      style={{ height: DAY_PX }}
      onPointerDown={
        edit
          ? (e) => {
              // Presses that start on a block must not start a draw. Guarded
              // here (not via stopPropagation on the block) so pointerdown
              // still bubbles to the box-less ContextMenuTrigger span — its
              // touch long-press timer depends on it (F-cross-13 path-b).
              if ((e.target as Element).closest("[data-occ-id]")) return;
              edit.gestures.startDraw(e, colRef, dayStartMs, gestureCleanup);
            }
          : undefined
      }
      onDoubleClick={
        edit
          ? (e) => edit.gestures.createAtDoubleClick(e, colRef, dayStartMs)
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
        const canMove = !!edit && edit.can("move", b.occ.item);
        const canResize = !!edit && edit.can("resize", b.occ.item);
        const Block = (
          <CalendarTimeBlock
            occ={b.occ}
            selected={selectedId === b.occ.id}
            onClick={() => activate(b.occ)}
            onPointerDown={
              edit
                ? (e) => {
                    // No stopPropagation: the column's draw handler ignores
                    // block-origin presses itself, and the context-menu span
                    // needs the bubble for touch long-press.
                    if (canMove)
                      edit.gestures.startTimedMove(
                        e,
                        b.occ,
                        gridRef,
                        columns,
                        suppressClick,
                        gestureCleanup,
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
            {edit ? (
              <edit.components.EventContextMenu item={b.occ.item}>
                {Block}
              </edit.components.EventContextMenu>
            ) : (
              <EventHoverWrap tooltip={renderTooltip?.(b.occ.item, b.occ)}>
                {Block}
              </EventHoverWrap>
            )}
            {edit && canResize ? (
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
                    edit.gestures.startTimedResize(e, b.occ, "start", colRef, dayStartMs, gestureCleanup)
                  }
                  className="pointer-events-auto absolute inset-x-0 top-0 flex h-2 cursor-ns-resize items-center justify-center"
                >
                  <span className="h-0.5 w-5 rounded-full bg-current opacity-40" aria-hidden />
                </div>
                <div
                  role="button"
                  aria-label="Resize end"
                  onPointerDown={(e) =>
                    edit.gestures.startTimedResize(e, b.occ, "end", colRef, dayStartMs, gestureCleanup)
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
 * lane-packed timed blocks and a now-line on today. Editing (when the
 * `editing` extension is wired): native-pointer timed move/resize + draw-to-
 * create via `edit.gestures`; the all-day band drags by whole days.
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
