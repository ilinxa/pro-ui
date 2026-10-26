"use client";

import type { Locale } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "../types";

/**
 * The two-month range calendar. Lives in its own module so `date-range-picker.tsx` can
 * `React.lazy` it: react-day-picker + date-fns load only when the popover first opens.
 */
export function DateRangeCalendar({
  value,
  onChange,
  locale,
  timeZone,
  dir,
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  locale?: Locale;
  timeZone?: string;
  dir: "ltr" | "rtl";
}) {
  return (
    <Calendar
      mode="range"
      defaultMonth={value.from}
      selected={value.from || value.to ? { from: value.from, to: value.to } : undefined}
      onSelect={(range) => onChange({ from: range?.from, to: range?.to })}
      numberOfMonths={2}
      locale={locale}
      timeZone={timeZone}
      dir={dir}
    />
  );
}

export default DateRangeCalendar;
