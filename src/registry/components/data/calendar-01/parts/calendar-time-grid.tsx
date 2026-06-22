"use client";

import { useEffect, useRef } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar-context";
import { HOURS } from "../lib/date-range";
import { occurrencesOnDay } from "../lib/segments";
import { blockOffsets, packLanes } from "../lib/lane-pack";
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

/**
 * The hour time-grid (Tier C), shared by Week (7 columns) and Day (1 column):
 * column headers + all-day band + a scrollable 24h grid with lane-packed,
 * positioned timed blocks and a now-line on today.
 */
export function TimeGrid({
  columns,
  className,
}: {
  columns: Date[];
  className?: string;
}) {
  const {
    occurrences,
    nowMs,
    scrollToHour,
    selectedId,
    select,
    onTaskClick,
    renderTooltip,
  } = useCalendar();

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hour = Math.max(0, Math.min(23, scrollToHour));
    el.scrollTop = (hour / 24) * el.scrollHeight;
  }, [scrollToHour]);

  const nowDate = new Date(nowMs);
  const activate = (occ: CalendarOccurrence) => {
    select(occ.id);
    onTaskClick?.(occ.item);
  };

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
            <div className="text-xs text-muted-foreground">
              {format(day, "EEE")}
            </div>
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
      <div className="flex border-b border-border">
        <div className="flex w-14 shrink-0 items-start justify-end pr-1.5 pt-1 text-[0.6rem] uppercase text-muted-foreground">
          all day
        </div>
        {columns.map((day) => {
          const allDay = occurrencesOnDay(occurrences, day).filter(
            (o) => o.allDay,
          );
          return (
            <div
              key={day.toISOString()}
              className="min-h-7 flex-1 space-y-0.5 border-l border-border p-0.5"
            >
              {allDay.map((occ) => (
                <EventHoverWrap
                  key={occ.id}
                  tooltip={renderTooltip?.(occ.item, occ)}
                >
                  <CalendarEventBar
                    occ={occ}
                    selected={selectedId === occ.id}
                    onClick={() => activate(occ)}
                  />
                </EventHoverWrap>
              ))}
            </div>
          );
        })}
      </div>

      {/* scrollable hour grid */}
      <div ref={scrollRef} className="flex max-h-128 overflow-y-auto">
        <TimeGutter />
        <div className="flex flex-1">
          {columns.map((day) => {
            const dayStartMs = startOfDay(day).getTime();
            const dayEndMs = dayStartMs + MS_PER_DAY;
            const timed = occurrences.filter(
              (o) =>
                !o.invalid &&
                !o.allDay &&
                o.endMs > dayStartMs &&
                o.startMs < dayEndMs,
            );
            const blocks = packLanes(timed);
            const showNow = isSameDay(day, nowDate);
            const nowFrac = (nowMs - dayStartMs) / MS_PER_DAY;
            return (
              <div
                key={day.toISOString()}
                className="relative flex-1 border-l border-border"
                style={{ height: DAY_PX }}
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
                  const { top, height } = blockOffsets(b.occ, dayStartMs);
                  return (
                    <EventHoverWrap
                      key={b.occ.id}
                      tooltip={renderTooltip?.(b.occ.item, b.occ)}
                    >
                      <CalendarTimeBlock
                        occ={b.occ}
                        selected={selectedId === b.occ.id}
                        onClick={() => activate(b.occ)}
                        top={top}
                        height={height}
                        left={b.lane / b.laneCount}
                        width={1 / b.laneCount}
                      />
                    </EventHoverWrap>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
