"use client";

/**
 * The editing feature's Provider — the implementation `event-calendar`'s
 * `editing?: CalendarEditExtension` prop wires in. Mounted by
 * `EventCalendarRoot` (base) only when BOTH `editable` and `editing` are set.
 *
 * Reads the base calendar context (`useCalendar()`) for the fields the edit
 * state machine and gestures need (occurrences / view / focusDate /
 * scrollToHour / selectedId / select / statusOptions) — it is rendered INSIDE
 * `CalendarContext.Provider`, so this resolves. Runs the `useCalendarEdit`
 * state machine, builds the `@dnd-kit` sensors + `onDragEnd` (day-granular
 * drag-to-reschedule), the cross-surface clipboard effect, the focus-restore
 * effect (F-11), and the `handleEventKey` / `handleDayEnterKey` /
 * `handleMethods` glue the base Root's keyboard router + imperative handle
 * delegate to — then supplies the whole `CalendarEditContextValue`
 * (dispatchers + transient UI state + the `components`/`gestures` records the
 * base parts render through) via `CalendarEditContext`, wrapped in the
 * `DndContext`. Mounts nothing visual itself.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { useCalendar } from "../../hooks/use-calendar-context";
import { CalendarEditContext } from "../../hooks/use-calendar-edit-extension";
import type {
  CalendarEditContextValue,
  CalendarEditProps,
} from "../../hooks/use-calendar-edit-extension";
import { coveredDays } from "../../lib/segments";
import { snapStepMs } from "./lib/edit-mutations";
import { useCalendarEdit } from "./hooks/use-calendar-edit";
import { useCalendarClipboard } from "./lib/clipboard-effect";
import { createTimeGridGestures, BandDropCell } from "./lib/time-grid-gestures";
import { DraggableEventWrap } from "./parts/calendar-edit-affordances";
import { DroppableDayCell } from "./parts/droppable-day-cell";
import { CalendarEventContextMenu } from "./parts/calendar-context-menu";
import {
  CalendarEventEditorOverlay,
  CalendarRenameField,
  EventEditorPanel,
} from "./parts/calendar-edit-overlays";
import { CalendarQuickComposer } from "./parts/calendar-quick-composer";
import type { CalendarOccurrence, TaskItem } from "../../types";

const COMPONENTS: CalendarEditContextValue["components"] = {
  DraggableEventWrap,
  DroppableDayCell,
  BandDropCell,
  EventContextMenu: CalendarEventContextMenu,
  EditOverlays: CalendarEventEditorOverlay,
  RenameField: CalendarRenameField,
  QuickComposer: CalendarQuickComposer,
  EventEditorPanel,
};

export function CalendarEditProvider({
  editProps,
  children,
}: {
  editProps: CalendarEditProps;
  children: ReactNode;
}) {
  const base = useCalendar();
  const {
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
    rootRef,
  } = editProps;

  const edit = useCalendarEdit({
    data,
    editable: true,
    snap,
    statusOptions: base.statusOptions,
    select: base.select,
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

  // Restore-focus target for keyboard-opened transients (editor / rename /
  // composer) — F-11.
  const restoreFocusRef = useRef<string | null>(null);

  // ── @dnd-kit sensors + day-granular drag-to-reschedule ──
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

  // ── cross-surface clipboard (copy/cut/paste) ──
  useCalendarClipboard({
    rootRef,
    editable: true,
    selectedId: base.selectedId,
    getItem,
    deleteItem,
    pasteTasks,
    occurrences: base.occurrences,
    view: base.view,
    focusDate: base.focusDate,
    scrollToHour: base.scrollToHour,
    editingId,
    renamingId,
    composerTarget,
  });

  // ── focus restore (F-11): after a keyboard-opened transient closes ──
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
  }, [editingId, renamingId, composerTarget, rootRef]);

  // ── quick-create routing (drag/dblclick over empty time-grid space) ──
  const requestCreate = useCallback(
    (win: { startMs: number; endMs?: number; allDay: boolean }, x: number, y: number) => {
      if (quickCompose) {
        openComposer({
          date: new Date(win.startMs),
          allDay: win.allDay,
          defaultEnd: new Date(win.endMs ?? win.startMs),
          x,
          y,
        });
      } else {
        createItem(null, undefined, win);
      }
    },
    [quickCompose, openComposer, createItem],
  );

  const gestures = useMemo(
    () =>
      createTimeGridGestures({
        snap,
        reschedule: rescheduleItem,
        setPreview: setResizePreview,
        requestCreate,
      }),
    [snap, rescheduleItem, setResizePreview, requestCreate],
  );

  // ── event-focused keyboard editing (moves/resizes/delete/edit/rename) ──
  const handleEventKey = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, id: string): boolean => {
      const occ = base.occurrences.find((o) => o.id === id);
      if (!occ) return false;
      const timed = (base.view === "week" || base.view === "day") && !occ.allDay;
      const stepMs = snapStepMs(snap) || 900_000;
      const hasSpan = occ.endMs > occ.startMs;
      // Day-granular ←/→ moves shift by CALENDAR days via `addDays` — the same
      // math as the pointer drop path, DST-safe where a raw MS_PER_DAY add is a
      // silent no-op across the fall-back day (v0.2.4). Timed moves in the time
      // grid shift by the snap step.
      const shiftMs = (ms: number, dir: number) =>
        timed ? ms + dir * stepMs : addDays(new Date(ms), dir).getTime();

      // Resize the END by one unit. All-day events resize in whole days against
      // the exclusive-end convention (same `addDays` midnight math as the drag
      // grip, so keyboard and pointer agree — no off-by-one, no DST drift) and
      // never collapse past their start; milestones are points in time and
      // aren't resizable.
      const resizeEnd = (dir: number) => {
        if (occ.kind === "milestone") return;
        if (occ.allDay) {
          const cov = coveredDays(occ);
          const curEnd = startOfDay(addDays(new Date(cov.lastMs), 1)).getTime();
          const minEnd = startOfDay(addDays(new Date(cov.firstMs), 1)).getTime();
          rescheduleItem(
            id,
            {
              endMs: Math.max(minEnd, addDays(new Date(curEnd), dir).getTime()),
              allDay: true,
            },
            "resize",
          );
        } else {
          const base2 = hasSpan ? occ.endMs : occ.startMs;
          rescheduleItem(
            id,
            { endMs: base2 + dir * stepMs, allDay: false },
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
                startMs: shiftMs(occ.startMs, dir),
                endMs: hasSpan ? shiftMs(occ.endMs, dir) : undefined,
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
    },
    [base.occurrences, base.view, snap, rescheduleItem, deleteItem, openEditor, beginRename],
  );

  const handleDayEnterKey = useCallback(
    (dayMs: number) => {
      const d = startOfDay(new Date(dayMs));
      restoreFocusRef.current = `day:${dayMs}`;
      openComposer({ date: d, allDay: true, defaultEnd: d });
    },
    [openComposer],
  );

  const handleMethods = useMemo<CalendarEditContextValue["handleMethods"]>(
    () => ({
      addTask: (date: Date, item?: Partial<TaskItem>) =>
        createItem(null, item, { startMs: startOfDay(date).getTime(), allDay: true }),
      deleteTask: (id: string) => deleteItem(id),
      editTask: (id: string) => openEditor(id),
      beginRename: (id: string) => beginRename(id),
      openQuickComposer: (date: Date, allDay = true) =>
        openComposer({
          date: startOfDay(date),
          allDay,
          defaultEnd: allDay ? startOfDay(date) : new Date(date.getTime() + 3_600_000),
        }),
    }),
    [createItem, deleteItem, openEditor, beginRename, openComposer],
  );

  const value = useMemo<CalendarEditContextValue>(
    () => ({
      editable: true,
      snap,
      quickCompose,
      permissions,
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
      onExternalDrop,
      renderQuickComposer,
      components: COMPONENTS,
      gestures,
      handleEventKey,
      handleDayEnterKey,
      handleMethods,
    }),
    [
      snap,
      quickCompose,
      permissions,
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
      onExternalDrop,
      renderQuickComposer,
      gestures,
      handleEventKey,
      handleDayEnterKey,
      handleMethods,
    ],
  );

  return (
    <CalendarEditContext.Provider value={value}>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        {children}
      </DndContext>
    </CalendarEditContext.Provider>
  );
}
