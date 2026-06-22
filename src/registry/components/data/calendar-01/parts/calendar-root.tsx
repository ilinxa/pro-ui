"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CalendarContext } from "../hooks/use-calendar-context";
import { useCalendarCursor } from "../hooks/use-calendar-cursor";
import { useNowTick } from "../hooks/use-now-tick";
import { visibleRange as computeVisibleRange } from "../lib/date-range";
import { toOccurrences } from "../lib/occurrences";
import type {
  CalendarContextValue,
  CalendarHandle,
  CalendarRootProps,
  CalendarView,
} from "../types";

const ALL_VIEWS: CalendarView[] = ["month", "week", "day", "agenda"];

/**
 * Headless provider (Tier B). Owns ALL state — the cursor (view + focus date),
 * selection, the memoized occurrences, the now-tick — plus the context and the
 * imperative handle. Renders `children`. No data state of its own (controlled,
 * family invariant); the v2 editing block is inert here.
 */
export const Calendar01Root = forwardRef<CalendarHandle, CalendarRootProps>(
  function Calendar01Root(props, ref) {
    const {
      data,
      statusOptions,
      priorityOptions,
      labelOptions,
      colorRamp,
      classifyEvent,
      now,
      colorRefreshIntervalMs = 60_000,
      agendaRangeDays = 30,
      maxEventsPerCell,
      scrollToHour = 8,
      weekStartsOn = 1,
      views,
      selectedId: selectedIdProp,
      onSelect,
      onTaskClick,
      onDateClick,
      onShowMore,
      onRangeChange,
      renderTooltip,
      className,
      children,
    } = props;

    const availableViews = useMemo(
      () => (views && views.length ? views : ALL_VIEWS),
      [views],
    );

    const cursor = useCalendarCursor({
      defaultView: props.defaultView,
      view: props.view,
      onViewChange: props.onViewChange,
      defaultDate: props.defaultDate,
      date: props.date,
      onDateChange: props.onDateChange,
      now,
      agendaRangeDays,
    });
    const { view, focusDate, setView, goToDate, goToToday, next, prev } = cursor;

    const nowMs = useNowTick(now, colorRefreshIntervalMs);

    const occurrences = useMemo(
      () =>
        toOccurrences(data, {
          nowMs,
          classifyEvent,
          statusOptions,
          colorRamp,
        }),
      [data, nowMs, classifyEvent, statusOptions, colorRamp],
    );

    const visibleRange = useMemo(
      () => computeVisibleRange(view, focusDate, weekStartsOn, agendaRangeDays),
      [view, focusDate, weekStartsOn, agendaRangeDays],
    );

    // Selection — controlled (incl. null) or internal.
    const [internalSelected, setInternalSelected] = useState<string | null>(
      null,
    );
    const selectionControlled = selectedIdProp !== undefined;
    const selectedId = selectionControlled
      ? (selectedIdProp ?? null)
      : internalSelected;
    const select = useCallback(
      (id: string | null) => {
        if (!selectionControlled) setInternalSelected(id);
        onSelect?.(id);
      },
      [selectionControlled, onSelect],
    );

    // onRangeChange — fire on mount + when the visible window changes. The
    // callback is read through a ref updated in an effect (never during render)
    // so an inline consumer callback doesn't retrigger the notify effect.
    const rangeStartMs = visibleRange.start.getTime();
    const rangeEndMs = visibleRange.end.getTime();
    const rangeCbRef = useRef(onRangeChange);
    useEffect(() => {
      rangeCbRef.current = onRangeChange;
    }, [onRangeChange]);
    useEffect(() => {
      rangeCbRef.current?.({
        view,
        start: new Date(rangeStartMs),
        end: new Date(rangeEndMs),
      });
    }, [view, rangeStartMs, rangeEndMs]);

    useImperativeHandle(
      ref,
      (): CalendarHandle => ({
        goToDate,
        goToToday,
        setView,
        next,
        prev,
        getVisibleRange: () => ({
          start: new Date(rangeStartMs),
          end: new Date(rangeEndMs),
        }),
        // Editing (v0.2.0) — no-ops in v1.
        addTask: () => {},
        deleteTask: () => {},
        editTask: () => {},
      }),
      [goToDate, goToToday, setView, next, prev, rangeStartMs, rangeEndMs],
    );

    const ctx = useMemo<CalendarContextValue>(
      () => ({
        view,
        focusDate,
        visibleRange,
        weekStartsOn,
        availableViews,
        occurrences,
        nowMs,
        agendaRangeDays,
        maxEventsPerCell,
        scrollToHour,
        statusOptions,
        priorityOptions,
        labelOptions,
        selectedId,
        setView,
        goToDate,
        goToToday,
        next,
        prev,
        select,
        onTaskClick,
        onDateClick,
        onShowMore,
        renderTooltip,
      }),
      [
        view,
        focusDate,
        visibleRange,
        weekStartsOn,
        availableViews,
        occurrences,
        nowMs,
        agendaRangeDays,
        maxEventsPerCell,
        scrollToHour,
        statusOptions,
        priorityOptions,
        labelOptions,
        selectedId,
        setView,
        goToDate,
        goToToday,
        next,
        prev,
        select,
        onTaskClick,
        onDateClick,
        onShowMore,
        renderTooltip,
      ],
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      switch (e.key) {
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          prev();
          break;
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          next();
          break;
        case "t":
        case "T":
          e.preventDefault();
          goToToday();
          break;
        case "m":
        case "M":
          if (availableViews.includes("month")) setView("month");
          break;
        case "w":
        case "W":
          if (availableViews.includes("week")) setView("week");
          break;
        case "d":
        case "D":
          if (availableViews.includes("day")) setView("day");
          break;
        case "a":
        case "A":
          if (availableViews.includes("agenda")) setView("agenda");
          break;
      }
    };

    return (
      <CalendarContext.Provider value={ctx}>
        <TooltipProvider delayDuration={250}>
          <div
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={props["aria-label"] ?? "Calendar"}
            className={cn(
              "flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          >
            {children}
          </div>
        </TooltipProvider>
      </CalendarContext.Provider>
    );
  },
);
