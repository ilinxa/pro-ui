"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar-context";
import type { CalendarView } from "../types";

const VIEW_LABELS: Record<CalendarView, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Agenda",
};

function periodLabel(
  view: CalendarView,
  focusDate: Date,
  range: { start: Date; end: Date },
): string {
  if (view === "month") return format(focusDate, "MMMM yyyy");
  if (view === "day") return format(focusDate, "EEEE, MMMM d, yyyy");
  // week + agenda → a range
  const sameYear = range.start.getFullYear() === range.end.getFullYear();
  return `${format(range.start, "MMM d")} – ${format(
    range.end,
    sameYear ? "MMM d, yyyy" : "MMM d, yyyy",
  )}`;
}

/** Toolbar (Tier B): period nav + label + view switch. */
export function CalendarToolbar({ className }: { className?: string }) {
  const {
    view,
    focusDate,
    visibleRange,
    availableViews,
    setView,
    next,
    prev,
    goToToday,
  } = useCalendar();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-border p-2",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous period"
          onClick={prev}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next period"
          onClick={next}
        >
          <ChevronRight className="size-4" />
        </Button>
        <span className="ml-1 text-sm font-semibold text-foreground">
          {periodLabel(view, focusDate, visibleRange)}
        </span>
      </div>

      {availableViews.length > 1 ? (
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v: string) => {
            if (v) setView(v as CalendarView);
          }}
          variant="outline"
          size="sm"
        >
          {availableViews.map((v) => (
            <ToggleGroupItem key={v} value={v} aria-label={VIEW_LABELS[v]}>
              {VIEW_LABELS[v]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : null}
    </div>
  );
}
