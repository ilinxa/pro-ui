"use client";

import { Fragment, forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { format, isSameDay } from "date-fns";
import { Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar-context";
import { agendaDays } from "../lib/date-range";
import { occurrencesOnDay } from "../lib/segments";
import { CalendarEventContextMenu } from "./calendar-context-menu";
import type { CalendarOccurrence, TodoStatusOption } from "../types";

function timeLabel(occ: CalendarOccurrence): string {
  // Milestones are precise instants (deadlines) and carry allDay=true, so check
  // them BEFORE the all-day branch — otherwise they'd mislabel as "All day" and
  // lose their time. A ◇ cue mirrors the diamond glyph the chips use.
  if (occ.kind === "milestone") return `◇ ${format(new Date(occ.startMs), "p")}`;
  if (occ.allDay) return "All day";
  return format(new Date(occ.startMs), "p");
}

function initials(name: string): string {
  const out = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return out || "?"; // never an empty avatar fallback (whitespace-only name)
}

/** One agenda row (Tier C). Spreads `...rest` so the context menu can inject
 *  `onContextMenu` (parity with the other event primitives). */
export const AgendaRow = forwardRef<
  HTMLButtonElement,
  {
    occ: CalendarOccurrence;
    selected?: boolean;
    statusOptions?: TodoStatusOption[];
  } & Omit<ComponentPropsWithoutRef<"button">, "type">
>(function AgendaRow({ occ, selected, statusOptions, className, ...rest }, ref) {
  const status = statusOptions?.find((o) => o.value === occ.item.status);
  const person = occ.item.targetPerson;
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      data-selected={selected || undefined}
      data-occ-id={occ.id}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring data-[selected=true]:bg-muted",
        occ.inactive && "opacity-50",
        className,
      )}
    >
      <span className="w-20 shrink-0 text-xs tabular-nums text-muted-foreground">
        {timeLabel(occ)}
      </span>
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: occ.color.fill }}
        aria-hidden
      />
      {occ.flagColor ? (
        <Flag
          className="size-3 shrink-0 fill-current"
          style={{ color: occ.flagColor }}
          aria-label="High priority"
        />
      ) : null}
      <span className="flex-1 truncate text-sm text-foreground">
        {occ.item.name}
      </span>
      {status ? (
        <Badge variant={status.variant ?? "secondary"} className="shrink-0">
          {status.label}
        </Badge>
      ) : null}
      {person ? (
        <Avatar className="size-6 shrink-0">
          {person.avatar ? <AvatarImage src={person.avatar} alt={person.name} /> : null}
          <AvatarFallback className="text-[0.6rem]">
            {initials(person.name)}
          </AvatarFallback>
        </Avatar>
      ) : null}
    </button>
  );
});

/** Agenda view (Tier B). Day-grouped chronological list over `agendaRangeDays`. */
export function CalendarAgendaView({ className }: { className?: string }) {
  const {
    focusDate,
    agendaRangeDays,
    occurrences,
    nowMs,
    statusOptions,
    selectedId,
    select,
    onTaskClick,
    editable,
  } = useCalendar();

  const days = agendaDays(focusDate, agendaRangeDays);
  const nowDate = new Date(nowMs);

  const groups = days
    .map((day) => ({
      day,
      items: occurrencesOnDay(occurrences, day).sort(
        (a, b) =>
          Number(b.allDay) - Number(a.allDay) || a.startMs - b.startMs,
      ),
    }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-40 items-center justify-center p-8 text-sm text-muted-foreground",
          className,
        )}
      >
        No events in the next {agendaRangeDays} days.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4 overflow-y-auto p-3", className)}>
      {groups.map(({ day, items }) => (
        <section key={day.toISOString()} className="flex flex-col gap-1">
          <h3
            className={cn(
              "sticky top-0 z-10 bg-card px-2 py-1 text-xs font-semibold uppercase tracking-wide",
              isSameDay(day, nowDate) ? "text-primary" : "text-muted-foreground",
            )}
          >
            {format(day, "EEEE, MMMM d")}
            {isSameDay(day, nowDate) ? " · Today" : ""}
          </h3>
          {items.map((occ) => {
            const row = (
              <AgendaRow
                occ={occ}
                selected={selectedId === occ.id}
                statusOptions={statusOptions}
                onClick={() => {
                  select(occ.id);
                  onTaskClick?.(occ.item);
                }}
              />
            );
            return editable ? (
              <CalendarEventContextMenu key={occ.id} item={occ.item}>
                {row}
              </CalendarEventContextMenu>
            ) : (
              <Fragment key={occ.id}>{row}</Fragment>
            );
          })}
        </section>
      ))}
    </div>
  );
}
