"use client";

import { Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRange } from "../types";

/**
 * Date-range Popover. Renders a 2-month calendar in range mode.
 * Conditional clear-X button appears next to the trigger when a range is set.
 *
 * Composes shadcn Popover + Calendar primitives. Calendar wraps
 * react-day-picker; date-fns is a transitive peer.
 */
export function DateRangePicker({
  value,
  onChange,
  buttonText,
  clearLabel,
  clearText,
  formatRange,
  formatDate,
}: {
  value: DateRange;
  onChange: (next: DateRange) => void;
  buttonText: string;
  clearLabel: string;
  clearText: string;
  formatRange: (range: { from: Date; to: Date }) => string;
  formatDate: (date: Date) => string;
}) {
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
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 rounded-full">
            <CalendarIcon aria-hidden="true" className="h-4 w-4" />
            {triggerText}
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="range"
            defaultMonth={value.from}
            selected={value.from || value.to ? { from: value.from, to: value.to } : undefined}
            onSelect={(range) =>
              onChange({ from: range?.from, to: range?.to })
            }
            numberOfMonths={2}
          />
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
