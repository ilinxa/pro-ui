"use client";

import { lazy, Suspense, useState } from "react";
import { Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";
import type { Locale } from "react-day-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "../types";
import { CalendarErrorBoundary } from "./calendar-error-boundary";

// The calendar (react-day-picker + date-fns) loads only when the popover first opens.
const loadCalendar = () =>
  lazy(() =>
    import("./date-range-calendar").then((m) => ({ default: m.DateRangeCalendar })),
  );

function CalendarSkeleton() {
  return (
    <div aria-hidden="true" className="flex gap-4 p-3">
      <div className="h-64 w-56 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
      <div className="hidden h-64 w-56 animate-pulse rounded-md bg-muted motion-reduce:animate-none md:block" />
    </div>
  );
}

/**
 * Date-range Popover. Renders a 2-month calendar in range mode.
 * Conditional clear-X button appears next to the trigger when a range is set.
 *
 * Composes shadcn Popover + a lazily loaded Calendar (react-day-picker; date-fns is a
 * transitive peer).
 */
export function DateRangePicker({
  value,
  onChange,
  buttonText,
  clearLabel,
  clearText,
  formatRange,
  formatDate,
  calendarLocale,
  timeZone,
  loadErrorText,
  retryText,
  dir,
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  buttonText: string;
  clearLabel: string;
  clearText: string;
  formatRange: (range: { from: Date; to: Date }) => string;
  formatDate: (date: Date) => string;
  calendarLocale?: Locale;
  timeZone?: string;
  loadErrorText: string;
  retryText: string;
  dir: "ltr" | "rtl";
}) {
  // `lazy` caches a failed chunk load, so Retry builds a fresh lazy component.
  const [DateRangeCalendar, setDateRangeCalendar] = useState(loadCalendar);
  const hasRange = value.from !== undefined || value.to !== undefined;

  let triggerText = buttonText;
  if (value.from && value.to) {
    triggerText = formatRange({ from: value.from, to: value.to });
  } else if (value.from) {
    triggerText = formatDate(value.from);
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        {/* F-cross-13: no `asChild` — render the trigger as the button directly
            (both Radix + Base UI pass native props through to a <button>). */}
        <PopoverTrigger
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "gap-2 rounded-full")}
        >
          <CalendarIcon aria-hidden="true" className="h-4 w-4" />
          {triggerText}
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center" dir={dir}>
          <CalendarErrorBoundary
            message={loadErrorText}
            retryText={retryText}
            onRetry={() => setDateRangeCalendar(loadCalendar)}
          >
            <Suspense fallback={<CalendarSkeleton />}>
              <DateRangeCalendar
                value={value}
                onChange={onChange}
                locale={calendarLocale}
                timeZone={timeZone}
                dir={dir}
              />
            </Suspense>
          </CalendarErrorBoundary>
        </PopoverContent>
      </Popover>

      {hasRange ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ from: undefined, to: undefined })}
          aria-label={clearLabel}
          className="gap-1"
        >
          <X aria-hidden="true" className="h-3 w-3" />
          {clearText}
        </Button>
      ) : null}
    </div>
  );
}
