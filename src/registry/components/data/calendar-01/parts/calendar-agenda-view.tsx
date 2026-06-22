"use client";

import { forwardRef } from "react";
import { format, isSameDay } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar-context";
import { agendaDays } from "../lib/date-range";
import { occurrencesOnDay } from "../lib/segments";
import type { CalendarOccurrence, TodoStatusOption } from "../types";

function timeLabel(occ: CalendarOccurrence): string {
  if (occ.allDay) return "All day";
  if (occ.kind === "milestone") return format(new Date(occ.startMs), "p");
  return format(new Date(occ.startMs), "p");
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** One agenda row (Tier C). */
export const AgendaRow = forwardRef<
  HTMLButtonElement,
  {
    occ: CalendarOccurrence;
    selected?: boolean;
    onClick?: () => void;
    statusOptions?: TodoStatusOption[];
  }
>(function AgendaRow({ occ, selected, onClick, statusOptions }, ref) {
  const status = statusOptions?.find((o) => o.value === occ.item.status);
  const person = occ.item.targetPerson;
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      data-selected={selected || undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring data-[selected=true]:bg-muted",
        occ.inactive && "opacity-50",
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
          {items.map((occ) => (
            <AgendaRow
              key={occ.id}
              occ={occ}
              selected={selectedId === occ.id}
              statusOptions={statusOptions}
              onClick={() => {
                select(occ.id);
                onTaskClick?.(occ.item);
              }}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
