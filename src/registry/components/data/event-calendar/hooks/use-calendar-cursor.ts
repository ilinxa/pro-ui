"use client";

import { useCallback, useState } from "react";
import { stepDate } from "../lib/date-range";
import type { CalendarView } from "../types";

type CursorArgs = {
  defaultView?: CalendarView;
  view?: CalendarView;
  onViewChange?: (v: CalendarView) => void;
  defaultDate?: Date;
  date?: Date;
  onDateChange?: (d: Date) => void;
  now?: Date | string;
  agendaRangeDays: number;
};

/**
 * Resolves the cursor — `{ view, focusDate }` — in either controlled or
 * uncontrolled mode, and the navigation actions. Controlled when `view` /
 * `date` props are passed; otherwise internal state seeded by `default*`.
 */
export function useCalendarCursor(args: CursorArgs) {
  const [internalView, setInternalView] = useState<CalendarView>(
    args.defaultView ?? "month",
  );
  const view = args.view ?? internalView;

  const [internalDate, setInternalDate] = useState<Date>(
    () => args.defaultDate ?? (args.now != null ? new Date(args.now) : new Date()),
  );
  const focusDate = args.date ?? internalDate;

  const viewControlled = args.view !== undefined;
  const dateControlled = args.date !== undefined;
  const { onViewChange, onDateChange, now, agendaRangeDays } = args;

  const setView = useCallback(
    (v: CalendarView) => {
      if (!viewControlled) setInternalView(v);
      onViewChange?.(v);
    },
    [viewControlled, onViewChange],
  );

  const goToDate = useCallback(
    (d: Date) => {
      if (!dateControlled) setInternalDate(d);
      onDateChange?.(d);
    },
    [dateControlled, onDateChange],
  );

  const goToToday = useCallback(() => {
    goToDate(now != null ? new Date(now) : new Date());
  }, [goToDate, now]);

  const next = useCallback(() => {
    goToDate(stepDate(view, focusDate, 1, agendaRangeDays));
  }, [goToDate, view, focusDate, agendaRangeDays]);

  const prev = useCallback(() => {
    goToDate(stepDate(view, focusDate, -1, agendaRangeDays));
  }, [goToDate, view, focusDate, agendaRangeDays]);

  return { view, focusDate, setView, goToDate, goToToday, next, prev };
}
