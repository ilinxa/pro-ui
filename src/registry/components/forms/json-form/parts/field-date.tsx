"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import type { FieldAriaProps, FieldRenderer } from "../types";

/**
 * Combined renderer for date / date-range / time / datetime.
 * Values are stored as ISO 8601 strings (YYYY-MM-DD for date, HH:mm for time,
 * full ISO for datetime). date-range stores `{ start, end }`.
 */
export const FieldDate: FieldRenderer = (args) => {
  if (args.field.type === "time") return <FieldTime {...args} />;
  if (args.field.type === "date-range") return <FieldDateRange {...args} />;
  if (args.field.type === "datetime") return <FieldDateTime {...args} />;
  return <FieldDateSingle {...args} />;
};

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(s: unknown): Date | undefined {
  if (typeof s !== "string" || !s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function ariaAttrs(p: FieldAriaProps, withId: boolean) {
  return {
    ...(withId ? { id: p.id } : {}),
    "aria-required": p["aria-required"],
    "aria-invalid": p["aria-invalid"],
    "aria-disabled": p["aria-disabled"],
    "aria-describedby": p["aria-describedby"],
  };
}

const FieldDateSingle: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  ariaProps,
}) => {
  const [open, setOpen] = useState(false);
  const parsed = parseDate(value);
  const display = parsed ? formatDate(parsed) : "";

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onBlur();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !display && "text-muted-foreground",
          )}
          {...ariaAttrs(ariaProps, true)}
        >
          <CalendarIcon className="size-4" />
          {display || field.placeholder || "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={parsed}
          onSelect={(d) => {
            onChange(d ? formatDate(d) : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

const FieldTime: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  ariaProps,
}) => {
  return (
    <Input
      type="time"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      step={field.step}
      {...ariaAttrs(ariaProps, true)}
    />
  );
};

const FieldDateTime: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  ariaProps,
}) => {
  const [open, setOpen] = useState(false);
  const iso = typeof value === "string" ? value : "";
  const datePart = iso.slice(0, 10);
  const timePart = iso.length >= 16 ? iso.slice(11, 16) : "00:00";
  const parsed = parseDate(datePart);
  const display = iso ? `${datePart} ${timePart}` : "";

  function update(nextDate: Date | undefined, nextTime: string) {
    if (!nextDate) {
      onChange("");
      return;
    }
    const d = formatDate(nextDate);
    onChange(`${d}T${nextTime}`);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onBlur();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !display && "text-muted-foreground",
          )}
          {...ariaAttrs(ariaProps, true)}
        >
          <CalendarIcon className="size-4" />
          {display || field.placeholder || "Pick a date & time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto space-y-2 p-2">
        <Calendar
          mode="single"
          selected={parsed}
          onSelect={(d) => update(d, timePart || "00:00")}
        />
        <Input
          type="time"
          value={timePart}
          onChange={(e) => update(parsed, e.target.value)}
        />
      </PopoverContent>
    </Popover>
  );
};

const FieldDateRange: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  ariaProps,
}) => {
  const [open, setOpen] = useState(false);
  const range = isRange(value)
    ? { from: parseDate(value.start), to: parseDate(value.end) }
    : { from: undefined as Date | undefined, to: undefined as Date | undefined };

  const display =
    range.from && range.to
      ? `${formatDate(range.from)} → ${formatDate(range.to)}`
      : range.from
        ? `${formatDate(range.from)} → …`
        : "";

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onBlur();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !display && "text-muted-foreground",
          )}
          {...ariaAttrs(ariaProps, true)}
        >
          <CalendarIcon className="size-4" />
          {display || field.placeholder || "Pick a date range"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => {
            onChange({
              start: r?.from ? formatDate(r.from) : "",
              end: r?.to ? formatDate(r.to) : "",
            });
            if (r?.from && r?.to) setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

function isRange(v: unknown): v is { start: string; end: string } {
  return (
    !!v &&
    typeof v === "object" &&
    "start" in v &&
    "end" in v
  );
}

export default FieldDate;
