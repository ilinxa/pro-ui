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
import { coveredDays } from "../lib/segments";
import { snapStepMs } from "../lib/edit-mutations";
import { parseDateValue } from "../lib/classify";
import {
  readTasksFromClipboardEvent,
  writeTasksToClipboardEvent,
} from "../lib/clipboard";
import type {
  CalendarContextValue,
  CalendarHandle,
  CalendarOccurrence,
  CalendarRootProps,
  CalendarView,
  TodoItem,
} from "../types";

const ALL_VIEWS: CalendarView[] = ["month", "week", "day", "agenda"];
const MS_PER_DAY = 86_400_000;

/** Duration (ms) of a task from its dates; 0 when it has no real span. */
function itemDurationMs(it: TodoItem): number {
  const startMs = parseDateValue(it.startAt ?? it.setAt).ms;
  const endMs = it.expireAt ? parseDateValue(it.expireAt).ms : NaN;
  return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
    ? endMs - startMs
    : 0;
}

/**
 * Where a paste lands. The TARGET decides all-day vs timed (so paste also
 * converts): a focused day-cell → that day, all-day; a focused event → its
 * day + all-day-ness; otherwise the current focus date (timed in week/day at
 * `scrollToHour`, else all-day). Duration is carried from the copied item.
 */
function resolvePasteWindow(
  items: TodoItem[],
  opts: {
    activeEl: Element | null;
    occurrences: CalendarOccurrence[];
    view: CalendarView;
    focusDate: Date;
    scrollToHour: number;
  },
): { startMs: number; endMs?: number; allDay: boolean } {
  const { activeEl, occurrences, view, focusDate, scrollToHour } = opts;
  const dur = itemDurationMs(items[0]);
  const dayEl = activeEl?.closest?.("[data-day-ms]") as HTMLElement | null;
  if (dayEl) {
    const startMs = Number(dayEl.getAttribute("data-day-ms"));
    return { startMs, endMs: dur > 0 ? startMs + dur : undefined, allDay: true };
  }
  const occEl = activeEl?.closest?.("[data-occ-id]") as HTMLElement | null;
  if (occEl) {
    const occ = occurrences.find(
      (o) => o.id === occEl.getAttribute("data-occ-id"),
    );
    if (occ) {
      const span = occ.endMs > occ.startMs ? occ.endMs - occ.startMs : 0;
      const length = dur > 0 ? dur : span;
      return {
        startMs: occ.startMs,
        endMs: length > 0 ? occ.startMs + length : undefined,
        allDay: occ.allDay,
      };
    }
  }
  const base = startOfDay(focusDate).getTime();
  if (view === "week" || view === "day") {
    const startMs = base + Math.max(0, Math.min(23, scrollToHour)) * 3_600_000;
    return {
      startMs,
      endMs: dur > 0 ? startMs + dur : startMs + 3_600_000,
      allDay: false,
    };
  }
  return { startMs: base, endMs: dur > 0 ? base + dur : undefined, allDay: true };
}

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
      pasteTasks,
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

    // The root element (clipboard listeners fire only when it contains focus) and
    // the id to refocus after a keyboard-opened transient (editor / rename /
    // composer) closes (F-11).
    const rootRef = useRef<HTMLDivElement>(null);
    const restoreFocusRef = useRef<string | null>(null);

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

    // Focus restore (F-11): when a keyboard-opened transient (editor / rename /
    // composer) closes, return focus to the originating event/cell.
    useEffect(() => {
      if (editingId || renamingId || composerTarget) return;
      const target = restoreFocusRef.current;
      if (!target) return;
      restoreFocusRef.current = null;
      const raf = requestAnimationFrame(() => {
        const sel = target.startsWith("day:")
          ? `[data-day-ms="${target.slice(4)}"]`
          : `[data-occ-id="${target}"]`;
        (rootRef.current?.querySelector(sel) as HTMLElement | null)?.focus();
      });
      return () => cancelAnimationFrame(raf);
    }, [editingId, renamingId, composerTarget]);

    // Cross-surface clipboard — copy/cut/paste `TodoItem`s through the OS clipboard
    // (the shared `ilinxa/task` envelope; foreign text is ignored). Document-level
    // so it fires regardless of which focused element the UA targets; gated on the
    // calendar containing focus, skipped over text inputs (so the composer / rename
    // keep native text copy/paste).
    useEffect(() => {
      if (!editable) return;
      const owns = () => {
        const active = document.activeElement;
        return !!rootRef.current && !!active && rootRef.current.contains(active);
      };
      const overText = () => {
        const el = document.activeElement as HTMLElement | null;
        return (
          el?.tagName === "INPUT" ||
          el?.tagName === "TEXTAREA" ||
          el?.isContentEditable === true
        );
      };
      // An open editor / rename / composer owns the clipboard (it may hold
      // non-input controls), so defer to native copy/paste while one is up.
      const busy = () =>
        editingId != null || renamingId != null || composerTarget != null;
      const targetId = (): string | null => {
        const active = document.activeElement as HTMLElement | null;
        const occId = active
          ?.closest?.("[data-occ-id]")
          ?.getAttribute("data-occ-id");
        return occId ?? selectedId ?? null;
      };
      const onCopy = (e: ClipboardEvent) => {
        if (!owns() || overText() || busy()) return;
        const id = targetId();
        const item = id ? getItem(id) : undefined;
        if (!item) return;
        writeTasksToClipboardEvent(e, [item], "calendar-01");
        e.preventDefault();
      };
      const onCut = (e: ClipboardEvent) => {
        if (!owns() || overText() || busy()) return;
        const id = targetId();
        const item = id ? getItem(id) : undefined;
        if (!item) return;
        writeTasksToClipboardEvent(e, [item], "calendar-01");
        deleteItem(item.id);
        e.preventDefault();
      };
      const onPaste = (e: ClipboardEvent) => {
        if (!owns() || overText() || busy()) return;
        const items = readTasksFromClipboardEvent(e);
        if (!items) return;
        pasteTasks(
          items,
          resolvePasteWindow(items, {
            activeEl: document.activeElement,
            occurrences,
            view,
            focusDate,
            scrollToHour,
          }),
        );
        e.preventDefault();
      };
      document.addEventListener("copy", onCopy);
      document.addEventListener("cut", onCut);
      document.addEventListener("paste", onPaste);
      return () => {
        document.removeEventListener("copy", onCopy);
        document.removeEventListener("cut", onCut);
        document.removeEventListener("paste", onPaste);
      };
    }, [
      editable,
      selectedId,
      getItem,
      deleteItem,
      pasteTasks,
      occurrences,
      view,
      focusDate,
      scrollToHour,
      editingId,
      renamingId,
      composerTarget,
    ]);

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

    // Event-focused editing. `←/→` move by one unit (day in month/agenda, snap in
    // the time grid), `Shift+←/→` (+ `↑/↓` in the time grid) resize the end,
    // `Delete` removes, `Enter` opens the detail editor, `F2` renames. Returns
    // true when it consumed the key (so chrome keys still fall through otherwise).
    const handleEventKey = (
      e: KeyboardEvent<HTMLDivElement>,
      id: string,
    ): boolean => {
      const occ = occurrences.find((o) => o.id === id);
      if (!occ) return false;
      const timed = (view === "week" || view === "day") && !occ.allDay;
      const moveUnit = timed ? snapStepMs(snap) || 900_000 : MS_PER_DAY;
      const hasSpan = occ.endMs > occ.startMs;

      // Resize the END by one unit. All-day events resize in whole days against
      // the exclusive-end convention (same math as the drag grip, so keyboard and
      // pointer agree — no off-by-one) and never collapse past their start;
      // milestones are points in time and aren't resizable.
      const resizeEnd = (dir: number) => {
        if (occ.kind === "milestone") return;
        if (occ.allDay) {
          const cov = coveredDays(occ);
          const curEnd = startOfDay(new Date(cov.lastMs)).getTime() + MS_PER_DAY;
          const minEnd = startOfDay(new Date(cov.firstMs)).getTime() + MS_PER_DAY;
          rescheduleItem(
            id,
            { endMs: Math.max(minEnd, curEnd + dir * MS_PER_DAY), allDay: true },
            "resize",
          );
        } else {
          const base = hasSpan ? occ.endMs : occ.startMs;
          rescheduleItem(
            id,
            { endMs: base + dir * (snapStepMs(snap) || 900_000), allDay: false },
            "resize",
          );
        }
      };

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowRight": {
          const dir = e.key === "ArrowRight" ? 1 : -1;
          if (e.shiftKey) {
            resizeEnd(dir);
          } else {
            rescheduleItem(
              id,
              {
                startMs: occ.startMs + dir * moveUnit,
                endMs: hasSpan ? occ.endMs + dir * moveUnit : undefined,
                allDay: occ.allDay,
              },
              "move",
            );
          }
          e.preventDefault();
          return true;
        }
        case "ArrowUp":
        case "ArrowDown": {
          if (!timed || !e.shiftKey) return false; // resize-only, time grid only
          resizeEnd(e.key === "ArrowDown" ? 1 : -1);
          e.preventDefault();
          return true;
        }
        case "Delete":
        case "Backspace":
          deleteItem(id);
          e.preventDefault();
          return true;
        case "Enter":
          restoreFocusRef.current = id;
          openEditor(id);
          e.preventDefault();
          return true;
        case "F2":
          restoreFocusRef.current = id;
          beginRename(id);
          e.preventDefault();
          return true;
        default:
          return false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const targetEl = e.target as HTMLElement;
      const tag = targetEl.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      // Route to event/cell editing when an event or editable day cell is focused;
      // anything not consumed falls through to the v1 view/period keys below.
      if (editable) {
        const occId = targetEl
          .closest?.("[data-occ-id]")
          ?.getAttribute("data-occ-id");
        if (occId) {
          if (handleEventKey(e, occId)) return;
        } else if (e.key === "Enter") {
          const dayMsAttr = targetEl
            .closest?.("[data-day-ms]")
            ?.getAttribute("data-day-ms");
          if (dayMsAttr) {
            const d = startOfDay(new Date(Number(dayMsAttr)));
            restoreFocusRef.current = `day:${dayMsAttr}`;
            openComposer({ date: d, allDay: true, defaultEnd: d });
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
        {/* No `delayDuration`: it's a Radix-only prop (Base UI's TooltipProvider
            takes `delay`), so passing it fails consumer-tsc on Base UI
            (F-cross-13). The default delay is cross-backend-safe. (v0.2.1) */}
        <TooltipProvider>
          <div
            ref={rootRef}
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
