"use client";

/**
 * Time-grid native-pointer edit gestures (drag-move / drag-resize / draw-to-
 * create / double-click-create) + the all-day band's droppable create cell.
 * Extracted from the pre-split `calendar-time-grid.tsx` MIXED host
 * (features-editing split, v0.3) — moved verbatim except `snap` / the live
 * dispatchers / `quickCompose` routing are now closed over via
 * `createTimeGridGestures(deps)` (called once by the Provider) instead of
 * threaded through every call site, so the base time-grid's call sites shrink
 * to `edit.gestures.<fn>(event, refs…)`.
 */

import { startOfDay } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { snapStepMs, snapToStep } from "./edit-mutations";
import { useCalendarEditContext } from "../../../hooks/use-calendar-edit-extension";
import type { CalendarGestures } from "../../../hooks/use-calendar-edit-extension";
import type { CalendarSnap } from "../../../types";

const HOUR_PX = 48;
const DAY_PX = HOUR_PX * 24;
const MS_PER_DAY = 86_400_000;

const COL_MS = (clientY: number, rect: DOMRect, dayStartMs: number, step: number) =>
  snapToStep(dayStartMs + ((clientY - rect.top) / rect.height) * MS_PER_DAY, dayStartMs, step);

type RescheduleFn = (
  id: string,
  patch: { startMs?: number; endMs?: number; allDay: boolean },
  kind: "move" | "resize",
) => void;
type SetPreviewFn = (
  p: { id: string; startMs: number; endMs: number } | null,
) => void;
type RequestCreateFn = (
  win: { startMs: number; endMs?: number; allDay: boolean },
  x: number,
  y: number,
) => void;

/** Build the time-grid gesture handlers, closing over the live edit
 *  dispatchers — base call sites pass only the per-gesture event + refs. */
export function createTimeGridGestures(deps: {
  snap: CalendarSnap;
  reschedule: RescheduleFn;
  setPreview: SetPreviewFn;
  requestCreate: RequestCreateFn;
}): CalendarGestures {
  const { snap, reschedule, setPreview, requestCreate } = deps;

  /** Drag a timed block: vertical = time (delta), horizontal = day (target column). */
  const startTimedMove: CalendarGestures["startTimedMove"] = (
    e,
    occ,
    gridRef,
    columns,
    suppressClick,
    gestureCleanup,
  ) => {
    if (e.button !== 0) return;
    // No stopPropagation: the column's draw handler ignores block-origin
    // presses, and the context-menu trigger's long-press timer needs the
    // bubble (Radix cancels it on pointermove, so drags don't open the menu).
    const grid = gridRef.current;
    if (!grid) return;
    // Capture on the source block (gantt's pattern) so the gesture keeps
    // receiving events off-element and gets a proper pointercancel on
    // touch scroll-takeover (v0.2.4).
    e.currentTarget.setPointerCapture(e.pointerId);
    const pointerId = e.pointerId;
    const startX = e.clientX;
    const startY = e.clientY;
    // Wall-clock time-of-day (H/M/…), NOT an ms offset from local midnight — the
    // ms delta shifts the hour when the drop column crosses a DST transition (v0.2.4).
    const startDate = new Date(occ.startMs);
    const timeOfDay =
      startDate.getHours() * 3_600_000 +
      startDate.getMinutes() * 60_000 +
      startDate.getSeconds() * 1_000 +
      startDate.getMilliseconds();
    const dur = occ.endMs - occ.startMs;
    const step = snapStepMs(snap);
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      if (
        !moved &&
        (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4)
      )
        moved = true;
    };
    const onUp = (ev: PointerEvent) => {
      dispose();
      if (!moved) return; // a click selects; only a real drag reschedules
      suppressClick.current = true;
      const rect = grid.getBoundingClientRect();
      const n = columns.length;
      const col = Math.max(
        0,
        Math.min(n - 1, Math.floor((ev.clientX - rect.left) / (rect.width / n))),
      );
      const dyMs = ((ev.clientY - startY) / DAY_PX) * MS_PER_DAY;
      const targetDayStart = startOfDay(columns[col]).getTime();
      const newStart = snapToStep(targetDayStart + timeOfDay + dyMs, targetDayStart, step);
      reschedule(occ.id, { startMs: newStart, endMs: newStart + dur, allDay: false }, "move");
    };
    // Abort (browser gesture takeover): tear down, commit nothing (v0.2.4).
    const onCancel = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      dispose();
    };
    const dispose = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      gestureCleanup.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    gestureCleanup.current = dispose;
  };

  /** Drag a block's top/bottom edge: set start/end time (snapped). Updates the
   *  live preview each move; commits on release. */
  const startTimedResize: CalendarGestures["startTimedResize"] = (
    e,
    occ,
    edge,
    colRef,
    dayStartMs,
    gestureCleanup,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const col = colRef.current;
    if (!col) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pointerId = e.pointerId;
    const step = snapStepMs(snap);
    const MIN = 60_000;
    const tAt = (clientY: number) => {
      const rect = col.getBoundingClientRect();
      return snapToStep(
        dayStartMs + ((clientY - rect.top) / rect.height) * MS_PER_DAY,
        dayStartMs,
        step,
      );
    };
    const onMove = (ev: PointerEvent) => {
      const t = tAt(ev.clientY);
      if (edge === "start") {
        setPreview({ id: occ.id, startMs: Math.min(t, occ.endMs - MIN), endMs: occ.endMs });
      } else {
        setPreview({ id: occ.id, startMs: occ.startMs, endMs: Math.max(t, occ.startMs + MIN) });
      }
    };
    const onUp = (ev: PointerEvent) => {
      dispose();
      const t = tAt(ev.clientY);
      // Commit the SAME clamped window the preview showed — a raw `t` dragged
      // past the opposite edge would persist an inverted startAt > expireAt (v0.2.4).
      if (edge === "start")
        reschedule(occ.id, { startMs: Math.min(t, occ.endMs - MIN), allDay: false }, "resize");
      else
        reschedule(occ.id, { endMs: Math.max(t, occ.startMs + MIN), allDay: false }, "resize");
    };
    // Abort (browser gesture takeover): drop the preview, commit nothing (v0.2.4).
    const onCancel = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      dispose();
    };
    const dispose = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      setPreview(null);
      gestureCleanup.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    gestureCleanup.current = dispose;
  };

  /** Drag across an empty column → create a timed event spanning the range. A
   *  single click does NOT create (that's a double-click); only a real drag does. */
  const startDraw: CalendarGestures["startDraw"] = (
    e,
    colRef,
    dayStartMs,
    gestureCleanup,
  ) => {
    if (e.button !== 0) return;
    const col = colRef.current;
    if (!col) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pointerId = e.pointerId;
    const step = snapStepMs(snap) || 900_000;
    const startMs = COL_MS(e.clientY, col.getBoundingClientRect(), dayStartMs, step);
    const startY = e.clientY;
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.abs(ev.clientY - startY) > 4) moved = true;
    };
    const onUp = (ev: PointerEvent) => {
      dispose();
      if (!moved) return; // a click selects/deselects; only a drag creates
      const endMs = COL_MS(ev.clientY, col.getBoundingClientRect(), dayStartMs, step);
      const lo = Math.min(startMs, endMs);
      let hi = Math.max(startMs, endMs);
      if (hi <= lo) hi = lo + (step || 900_000);
      requestCreate({ startMs: lo, endMs: hi, allDay: false }, ev.clientX, ev.clientY);
    };
    // Abort (browser gesture takeover): tear down, create nothing (v0.2.4).
    const onCancel = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      dispose();
    };
    const dispose = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      gestureCleanup.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    gestureCleanup.current = dispose;
  };

  /** Double-click an empty slot → create a default 1-hour timed event there. */
  const createAtDoubleClick: CalendarGestures["createAtDoubleClick"] = (
    e,
    colRef,
    dayStartMs,
  ) => {
    if ((e.target as HTMLElement).closest("button")) return; // not on an event
    const col = colRef.current;
    if (!col) return;
    const step = snapStepMs(snap) || 900_000;
    const startMs = COL_MS(e.clientY, col.getBoundingClientRect(), dayStartMs, step);
    requestCreate(
      { startMs, endMs: startMs + 3_600_000, allDay: false },
      e.clientX,
      e.clientY,
    );
  };

  return { startTimedMove, startTimedResize, startDraw, createAtDoubleClick };
}

/** Editable droppable + click-create cell beneath the all-day band overlay
 *  (Tier B — editing feature). Reads the edit context directly: only ever
 *  mounted via `edit.components.BandDropCell`, i.e. inside the extension's
 *  own Provider. */
export function BandDropCell({ day }: { day: Date }) {
  const edit = useCalendarEditContext();
  const dayMs = startOfDay(day).getTime();
  const { setNodeRef, isOver } = useDroppable({
    id: `band:${dayMs}`,
    data: { dayMs },
  });
  return (
    <div
      ref={setNodeRef}
      // Double-click to create (parity with month/time-grid; honors quickCompose).
      onDoubleClick={(e) => {
        if (edit.quickCompose) {
          edit.openComposer({
            date: new Date(dayMs),
            allDay: true,
            defaultEnd: new Date(dayMs),
            x: e.clientX,
            y: e.clientY,
          });
        } else {
          edit.createItem(null, undefined, { startMs: dayMs, allDay: true });
        }
      }}
      className={cn(
        "min-h-7 cursor-pointer border-l border-border first:border-l-0",
        isOver && "bg-primary/10",
      )}
    />
  );
}
