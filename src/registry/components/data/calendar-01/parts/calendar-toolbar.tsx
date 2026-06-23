"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
        // Plain-button segmented control (NOT shadcn ToggleGroup): Base UI's
        // ToggleGroup is a multi-value model (`value: string[]`, `onValueChange:
        // (string[], details) => void`) while Radix's `type="single"` is a string
        // — so the single-select view switcher fails consumer-tsc on Base UI
        // (F-cross-13). Mirrors gantt-timeline-01's zoom switcher; drops the
        // `toggle-group` dep entirely. (v0.2.1)
        <div
          role="group"
          aria-label="Calendar view"
          className="inline-flex overflow-hidden rounded-md border border-border"
        >
          {availableViews.map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              aria-label={VIEW_LABELS[v]}
              onClick={() => setView(v)}
              className={cn(
                "h-8 px-3 text-sm font-medium transition-colors",
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
