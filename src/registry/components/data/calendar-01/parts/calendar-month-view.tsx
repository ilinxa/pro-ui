"use client";

import type { CSSProperties } from "react";
import { format, isSameDay, isSameMonth } from "date-fns";
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
import type { CalendarOccurrence, TodoItem } from "../types";

const DEFAULT_CAP = 3;
const LANE_H = "1.3rem";

/** One month-grid day cell (Tier C). Renders the cell chrome + day number +
 *  the "+N more" affordance; spanning events are overlaid by the view. */
export function MonthDayCell({
  day,
  outside,
  today,
  hidden,
  hiddenItems,
  onDayClick,
  onShowMore,
}: {
  day: Date;
  outside: boolean;
  today: boolean;
  hidden: number;
  hiddenItems: CalendarOccurrence[];
  onDayClick?: (d: Date) => void;
  onShowMore?: (d: Date, items: TodoItem[]) => void;
}) {
  return (
    <div
      role="gridcell"
      onClick={onDayClick ? () => onDayClick(day) : undefined}
      className={cn(
        "relative min-h-27 border-r border-border last:border-r-0",
        onDayClick && "cursor-pointer",
        outside && "bg-muted/30",
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

/** Month view (Tier B). 7-column weekday grid; multi-day spanning bars + chips
 *  in lanes, "+N more" overflow per day. */
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
  } = ctx;

  const cap = maxEventsPerCell ?? DEFAULT_CAP;
  const weeks = monthGrid(focusDate, weekStartsOn);
  const nowDate = new Date(nowMs);

  const activate = (occ: CalendarOccurrence) => {
    select(occ.id);
    onTaskClick?.(occ.item);
  };

  return (
    <div role="grid" className={cn("flex flex-col", className)}>
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

      {/* week rows */}
      {weeks.map((week) => {
        const layout = layoutMonthWeek(week, occurrences, cap);
        return (
          <div
            key={week[0].toISOString()}
            role="row"
            className="relative grid grid-cols-7 border-b border-border last:border-b-0"
          >
            {week.map((day, col) => {
              const onDay = occurrencesOnDay(occurrences, day);
              const hiddenItems = onDay.filter(
                (o) => !layout.segments.some((s) => s.occ.id === o.id),
              );
              return (
                <MonthDayCell
                  key={day.toISOString()}
                  day={day}
                  outside={!isSameMonth(day, focusDate)}
                  today={isSameDay(day, nowDate)}
                  hidden={layout.overflow[col]}
                  hiddenItems={hiddenItems}
                  onDayClick={onDateClick}
                  onShowMore={onShowMore}
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
                const Event =
                  seg.spanning || seg.occ.allDay ? (
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
                return (
                  <div
                    key={seg.occ.id}
                    className="pointer-events-auto min-w-0"
                    style={{
                      gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}`,
                      gridRow: seg.lane + 1,
                    }}
                  >
                    <EventHoverWrap tooltip={tooltip}>{Event}</EventHoverWrap>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
