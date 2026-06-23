"use client";

import { forwardRef } from "react";
import { useCalendar } from "./hooks/use-calendar-context";
import { Calendar01Root } from "./parts/calendar-root";
import { CalendarToolbar } from "./parts/calendar-toolbar";
import { CalendarMiniNav } from "./parts/calendar-mini-nav";
import { CalendarMonthView } from "./parts/calendar-month-view";
import { CalendarWeekView } from "./parts/calendar-week-view";
import { CalendarDayView } from "./parts/calendar-day-view";
import { CalendarAgendaView } from "./parts/calendar-agenda-view";
import { CalendarEventInspector } from "./parts/calendar-event-inspector";
import { CalendarQuickComposer } from "./parts/calendar-quick-composer";
import {
  CalendarEventEditorOverlay,
  CalendarRenameField,
} from "./parts/calendar-edit-overlays";
import type { CalendarHandle, CalendarProps } from "./types";

/** Renders the active view (must live inside the Root to read context). */
function ActiveView() {
  const { view, availableViews } = useCalendar();
  const v = availableViews.includes(view) ? view : availableViews[0];
  switch (v) {
    case "week":
      return <CalendarWeekView />;
    case "day":
      return <CalendarDayView />;
    case "agenda":
      return <CalendarAgendaView />;
    case "month":
    default:
      return <CalendarMonthView />;
  }
}

/**
 * Calendar 01 — batteries-included assembly (Tier A). Root + toolbar + optional
 * mini-nav + the active view, gated by `show*` toggles. Contains no logic the
 * parts lack; hand-assemble `Calendar01Root` + the parts you want for a lighter
 * build.
 */
export const Calendar01 = forwardRef<CalendarHandle, CalendarProps>(
  function Calendar01(props, ref) {
    const {
      showToolbar = true,
      showMiniNav = false,
      showInspector = false,
      className,
      ...rootProps
    } = props;

    return (
      <Calendar01Root ref={ref} className={className} {...rootProps}>
        {showToolbar ? <CalendarToolbar /> : null}
        <div className="flex min-h-0 flex-1">
          {showInspector ? (
            <CalendarEventInspector className="hidden w-64 shrink-0 border-r border-border sm:flex" />
          ) : null}
          {showMiniNav ? (
            <CalendarMiniNav className="hidden border-r border-border p-2 sm:block" />
          ) : null}
          <div className="min-w-0 flex-1 overflow-hidden">
            <ActiveView />
          </div>
        </div>
        <CalendarQuickComposer />
        {/* Inline rename popup (the inspector never hosted rename). */}
        <CalendarRenameField />
        {/* Detail editor — only when the inspector isn't mounted (it hosts the
            editor inline; mounting both would double-render on `editingId`). */}
        {showInspector ? null : <CalendarEventEditorOverlay />}
      </Calendar01Root>
    );
  },
);
