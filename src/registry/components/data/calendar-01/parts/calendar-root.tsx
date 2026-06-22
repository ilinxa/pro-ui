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
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CalendarContext } from "../hooks/use-calendar-context";
import { useCalendarCursor } from "../hooks/use-calendar-cursor";
import { useCalendarEdit } from "../hooks/use-calendar-edit";
import { useNowTick } from "../hooks/use-now-tick";
import { visibleRange as computeVisibleRange } from "../lib/date-range";
import { toOccurrences } from "../lib/occurrences";
import type {
  CalendarContextValue,
  CalendarHandle,
  CalendarOccurrence,
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
      // editing (v0.2.0)
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

    // ── editing (v0.2.0) — the dispatcher chokepoints; all no-op when !editable ──
    const edit = useCalendarEdit({
      data,
      editable,
      snap,
      statusOptions,
      select,
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
    });
    const {
      can,
      getItem,
      rescheduleItem,
      createItem,
      deleteItem,
      renameItemAction,
      changeStatus,
      changePriority,
      applyEditedSubtree,
      editingId,
      openEditor,
      closeEditor,
      renamingId,
      beginRename,
      endRename,
      composerTarget,
      openComposer,
      closeComposer,
      resizePreview,
      setResizePreview,
    } = edit;

    // Drag-to-reschedule across the grid. A draggable event carries `{ occ }`; a
    // droppable day cell carries `{ dayMs }`. We shift by whole CALENDAR days
    // (date-fns `addDays`, DST-safe) and only carry the end when the item has a
    // real span (point events / milestones keep no end).
    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    );
    const onDragEnd = useCallback(
      (e: DragEndEvent) => {
        const occ = e.active.data.current?.occ as CalendarOccurrence | undefined;
        const targetDayMs = e.over?.data.current?.dayMs as number | undefined;
        if (!occ || targetDayMs == null) return;
        const sourceDayMs = startOfDay(occ.startMs).getTime();
        const deltaDays = differenceInCalendarDays(
          new Date(targetDayMs),
          new Date(sourceDayMs),
        );
        if (deltaDays === 0) return;
        const newStart = addDays(new Date(occ.startMs), deltaDays).getTime();
        const hasSpan = occ.endMs > occ.startMs;
        const newEnd = hasSpan
          ? addDays(new Date(occ.endMs), deltaDays).getTime()
          : undefined;
        rescheduleItem(
          occ.id,
          { startMs: newStart, endMs: newEnd, allDay: occ.allDay },
          "move",
        );
      },
      [rescheduleItem],
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
        // Editing (v0.2.0) — live; still no-op when !editable / permission denied.
        addTask: (date, item) =>
          createItem(null, item, {
            startMs: startOfDay(date).getTime(),
            allDay: true,
          }),
        deleteTask: (id) => deleteItem(id),
        editTask: (id) => openEditor(id),
        beginRename: (id) => beginRename(id),
        openQuickComposer: (date, allDay = true) =>
          openComposer({
            date: startOfDay(date),
            allDay,
            defaultEnd: allDay
              ? startOfDay(date)
              : new Date(date.getTime() + 3_600_000),
          }),
      }),
      [
        goToDate,
        goToToday,
        setView,
        next,
        prev,
        rangeStartMs,
        rangeEndMs,
        createItem,
        deleteItem,
        openEditor,
        beginRename,
        openComposer,
      ],
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
        // editing (v0.2.0)
        editable,
        snap,
        quickCompose,
        permissions,
        getItem,
        can,
        rescheduleItem,
        createItem,
        deleteItem,
        renameItemAction,
        changeStatus,
        changePriority,
        applyEditedSubtree,
        editingId,
        openEditor,
        closeEditor,
        renamingId,
        beginRename,
        endRename,
        composerTarget,
        openComposer,
        closeComposer,
        resizePreview,
        setResizePreview,
        onExternalDrop,
        renderQuickComposer,
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
        editable,
        snap,
        quickCompose,
        permissions,
        getItem,
        can,
        rescheduleItem,
        createItem,
        deleteItem,
        renameItemAction,
        changeStatus,
        changePriority,
        applyEditedSubtree,
        editingId,
        openEditor,
        closeEditor,
        renamingId,
        beginRename,
        endRename,
        composerTarget,
        openComposer,
        closeComposer,
        resizePreview,
        setResizePreview,
        onExternalDrop,
        renderQuickComposer,
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

    // DnD only mounts when editable — the read-only path stays DnD-free.
    const body = editable ? (
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        {children}
      </DndContext>
    ) : (
      children
    );

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
            {body}
          </div>
        </TooltipProvider>
      </CalendarContext.Provider>
    );
  },
);
