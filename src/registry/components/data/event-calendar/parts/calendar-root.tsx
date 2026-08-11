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
import type { KeyboardEvent, ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils";
import { CalendarContext } from "../hooks/use-calendar-context";
import { useCalendarCursor } from "../hooks/use-calendar-cursor";
import { useNowTick } from "../hooks/use-now-tick";
import { useCalendarEditOptional } from "../hooks/use-calendar-edit-extension";
import type { CalendarEditProps } from "../hooks/use-calendar-edit-extension";
import { visibleRange as computeVisibleRange } from "../lib/date-range";
import { toOccurrences } from "../lib/occurrences";
import type {
  CalendarBaseContextValue,
  CalendarHandle,
  CalendarRootProps,
  CalendarView,
} from "../types";

const ALL_VIEWS: CalendarView[] = ["month", "week", "day", "agenda"];

// Per-instance dedup (ref passed in) — two calendars on one page each get
// their own diagnostic, matching the sibling `warnedEditingRef` pattern.
function warnNoEditingMethod(warnedRef: { current: boolean }) {
  if (process.env.NODE_ENV === "production" || warnedRef.current) return;
  warnedRef.current = true;
  console.warn(
    "[event-calendar] Called an editing method on the imperative handle, but no editing extension is wired — pass `editing={calendarEditing}` from @ilinxa/event-calendar-editing (and `editable`). No-op.",
  );
}

type RootShellProps = {
  className?: string;
  ariaLabel?: string;
  rootRef: RefObject<HTMLDivElement | null>;
  rangeStartMs: number;
  rangeEndMs: number;
  goToDate: (date: Date) => void;
  goToToday: () => void;
  setView: (view: CalendarView) => void;
  next: () => void;
  prev: () => void;
  availableViews: CalendarView[];
  children: ReactNode;
};

/**
 * Inner shell (base, always rendered) — owns the root DOM node, the keyboard
 * router, and the imperative handle. Split out from `EventCalendarRoot` so it
 * can be mounted INSIDE the editing extension's `Provider` (when wired): the
 * Provider establishes `CalendarEditContext` above this component, so
 * `useCalendarEditOptional()` here resolves non-null exactly when editing is
 * active — letting the imperative handle + keyboard router delegate to the
 * edit surface without the base Root itself ever importing feature code.
 */
const RootShell = forwardRef<CalendarHandle, RootShellProps>(
  function RootShell(
    {
      className,
      ariaLabel,
      rootRef,
      rangeStartMs,
      rangeEndMs,
      goToDate,
      goToToday,
      setView,
      next,
      prev,
      availableViews,
      children,
    },
    ref,
  ) {
    const edit = useCalendarEditOptional();
    const warnedNoEditingRef = useRef(false);

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
        // Editing (v0.2.0+) — delegates to the wired extension; a dev-only
        // console.warn (once) + silent no-op when no extension is wired.
        addTask: (date, item) => {
          if (!edit) return warnNoEditingMethod(warnedNoEditingRef);
          edit.handleMethods.addTask(date, item);
        },
        deleteTask: (id) => {
          if (!edit) return warnNoEditingMethod(warnedNoEditingRef);
          edit.handleMethods.deleteTask(id);
        },
        editTask: (id) => {
          if (!edit) return warnNoEditingMethod(warnedNoEditingRef);
          edit.handleMethods.editTask(id);
        },
        beginRename: (id) => {
          if (!edit) return warnNoEditingMethod(warnedNoEditingRef);
          edit.handleMethods.beginRename(id);
        },
        openQuickComposer: (date, allDay) => {
          if (!edit) return warnNoEditingMethod(warnedNoEditingRef);
          edit.handleMethods.openQuickComposer(date, allDay);
        },
      }),
      [goToDate, goToToday, setView, next, prev, rangeStartMs, rangeEndMs, edit],
    );

    // View/period keys (always) + delegated event/day-cell editing keys (only
    // when an editing extension is wired — `edit` is null otherwise).
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const targetEl = e.target as HTMLElement;
      const tag = targetEl.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (edit) {
        const occId = targetEl
          .closest?.("[data-occ-id]")
          ?.getAttribute("data-occ-id");
        if (occId) {
          if (edit.handleEventKey(e, occId)) return;
        } else if (e.key === "Enter") {
          const dayMsAttr = targetEl
            .closest?.("[data-day-ms]")
            ?.getAttribute("data-day-ms");
          if (dayMsAttr) {
            edit.handleDayEnterKey(Number(dayMsAttr));
            e.preventDefault();
            return;
          }
        }
      }
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
      <div
        ref={rootRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel ?? "Calendar"}
        className={cn(
          "flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

/**
 * Headless provider (Tier B). Owns ALL base state — the cursor (view + focus
 * date), selection, the memoized occurrences, the now-tick — plus the
 * read-only context. No data state of its own (controlled, family invariant).
 *
 * Editing (P3 feature-slicing, v0.3.0): when BOTH `editable` and `editing`
 * (the `CalendarEditExtension`) are set, the Root mounts the extension's
 * `Provider` around its children — which is what makes `CalendarEditContext`
 * resolve for every part below. This file never statically imports anything
 * under `../features/editing/` (strategy-b injection); a base-only install
 * compiles and renders fully read-only.
 */
export const EventCalendarRoot = forwardRef<CalendarHandle, CalendarRootProps>(
  function EventCalendarRoot(props, ref) {
    const {
      data,
      statusOptions,
      priorityOptions,
      labelOptions,
      colorRamp,
      statusColors,
      colorBy,
      flagPriority,
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
      // editing (v0.2.0+) — collected into `editProps` for the extension; not
      // read directly by this component beyond `editable`/`editing` gating.
      editable = false,
      snap = "15min",
      quickCompose = true,
      onChange,
      onTaskReschedule,
      onItemAdded,
      onItemRemoved,
      onItemMoved,
      onFieldEdited,
      onStatusChanged,
      permissions,
      canMoveItem,
      canResizeItem,
      canDeleteItem,
      canCreateChild,
      canEditItem,
      onPermissionDenied,
      onExternalDrop,
      renderQuickComposer,
      editing,
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
          priorityOptions,
          colorRamp,
          statusColors,
          colorBy,
          flagPriority,
        }),
      [
        data,
        nowMs,
        classifyEvent,
        statusOptions,
        priorityOptions,
        colorRamp,
        statusColors,
        colorBy,
        flagPriority,
      ],
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

    // Shared root DOM node — the editing extension's clipboard + focus-restore
    // effects need to know when focus is inside the calendar; created here so
    // the same ref object reaches both the extension Provider (via `editProps`)
    // and `RootShell` (which attaches it to the actual div).
    const rootRef = useRef<HTMLDivElement>(null);

    // Dev-only, once: `editable` set but no extension wired → read-only fallback.
    const warnedEditingRef = useRef(false);
    useEffect(() => {
      if (
        process.env.NODE_ENV !== "production" &&
        editable &&
        !editing &&
        !warnedEditingRef.current
      ) {
        warnedEditingRef.current = true;
        console.warn(
          "[event-calendar] `editable` is set but no editing extension is wired — pass `editing={calendarEditing}` from @ilinxa/event-calendar-editing. Falling back to read-only.",
        );
      }
    }, [editable, editing]);

    const ctx = useMemo<CalendarBaseContextValue>(
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

    const editProps = useMemo<CalendarEditProps>(
      () => ({
        data,
        editable: true,
        onChange,
        onTaskReschedule,
        onItemAdded,
        onItemRemoved,
        onItemMoved,
        onFieldEdited,
        onStatusChanged,
        permissions,
        canMoveItem,
        canResizeItem,
        canDeleteItem,
        canCreateChild,
        canEditItem,
        onPermissionDenied,
        snap,
        quickCompose,
        onExternalDrop,
        renderQuickComposer,
        rootRef,
      }),
      [
        data,
        onChange,
        onTaskReschedule,
        onItemAdded,
        onItemRemoved,
        onItemMoved,
        onFieldEdited,
        onStatusChanged,
        permissions,
        canMoveItem,
        canResizeItem,
        canDeleteItem,
        canCreateChild,
        canEditItem,
        onPermissionDenied,
        snap,
        quickCompose,
        onExternalDrop,
        renderQuickComposer,
      ],
    );

    // Mount the extension only when BOTH `editable` and `editing` are set —
    // matches the v1 invariant exactly (editable=false ⇒ byte-identical
    // read-only calendar, no DnD/clipboard machinery mounted at all).
    const mountEditing = editable && !!editing;

    const shell = (
      <RootShell
        ref={ref}
        className={className}
        ariaLabel={props["aria-label"]}
        rootRef={rootRef}
        rangeStartMs={rangeStartMs}
        rangeEndMs={rangeEndMs}
        goToDate={goToDate}
        goToToday={goToToday}
        setView={setView}
        next={next}
        prev={prev}
        availableViews={availableViews}
      >
        {children}
      </RootShell>
    );

    return (
      <CalendarContext.Provider value={ctx}>
        {mountEditing && editing ? (
          <editing.Provider editProps={editProps}>{shell}</editing.Provider>
        ) : (
          shell
        )}
      </CalendarContext.Provider>
    );
  },
);
