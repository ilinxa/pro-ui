"use client";

/**
 * Shared editable affordances for the DAY-GRANULAR surfaces — the month grid and
 * the week/day all-day band. Both make events @dnd-kit draggables (drops resolve
 * in `Calendar01Root`'s `onDragEnd` by whole calendar days) and add edge-resize
 * grips (native pointer, clientX → column → day) + a hover-delete. The continuous
 * TIME grid uses its own native-pointer layer (see calendar-time-grid.tsx).
 */

import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from "react";
import { addDays, startOfDay } from "date-fns";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar-context";
import { coveredDays } from "../lib/segments";
import { CalendarEventContextMenu } from "./calendar-context-menu";
import type { CalendarOccurrence } from "../types";

/** Edge grip on an all-day bar → native-pointer DAY resize (clientX → column). */
export function DayResizeGrip({
  edge,
  occ,
  containerRef,
  cols,
}: {
  edge: "start" | "end";
  occ: CalendarOccurrence;
  containerRef: RefObject<HTMLDivElement | null>;
  cols: Date[];
}) {
  const { rescheduleItem, setResizePreview } = useCalendar();
  const colAt = (clientX: number): number => {
    const el = containerRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(
      0,
      Math.min(cols.length - 1, Math.floor((clientX - r.left) / (r.width / cols.length))),
    );
  };
  const onPointerDown = (e: ReactPointerEvent) => {
    e.stopPropagation(); // keep the @dnd-kit drag sensor + draw out of it
    e.preventDefault();
    const span = coveredDays(occ);
    // Resolve the edit window (start ms or exclusive-end ms) for a target column.
    const windowAt = (clientX: number) => {
      const dayMs = startOfDay(cols[colAt(clientX)]).getTime();
      if (edge === "start") {
        const startMs = Math.min(dayMs, startOfDay(span.lastMs).getTime());
        return { startMs, endMs: occ.endMs };
      }
      const lastDay = Math.max(dayMs, startOfDay(span.firstMs).getTime());
      return {
        startMs: occ.startMs,
        endMs: startOfDay(addDays(new Date(lastDay), 1)).getTime(),
      };
    };
    const onMove = (ev: PointerEvent) => {
      const w = windowAt(ev.clientX);
      setResizePreview({ id: occ.id, startMs: w.startMs, endMs: w.endMs });
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setResizePreview(null);
      const w = windowAt(ev.clientX);
      rescheduleItem(
        occ.id,
        edge === "start"
          ? { startMs: w.startMs, allDay: true }
          : { endMs: w.endMs, allDay: true },
        "resize",
      );
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  return (
    <button
      type="button"
      aria-label={edge === "start" ? "Resize start" : "Resize end"}
      onPointerDown={onPointerDown}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute inset-y-0 z-10 hidden w-2.5 cursor-ew-resize items-center justify-center group-hover:flex",
        edge === "start" ? "left-0" : "right-0",
      )}
    >
      <span
        className="h-1/2 w-0.5 rounded-full bg-current opacity-60"
        aria-hidden
      />
    </button>
  );
}

/** Editable wrapper around an all-day segment: @dnd-kit draggable + edge resize
 *  (when `resizable`) + hover-delete. Used by the month grid and the all-day band. */
export function DraggableEventWrap({
  occ,
  canDrag,
  resizable,
  containerRef,
  cols,
  children,
}: {
  occ: CalendarOccurrence;
  canDrag: boolean;
  resizable: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  cols: Date[];
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: occ.id, data: { occ }, disabled: !canDrag });
  return (
    <div
      ref={setNodeRef}
      {...(canDrag ? listeners : {})}
      {...attributes}
      style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      className={cn(
        "group relative",
        canDrag && "cursor-grab active:cursor-grabbing",
        isDragging && "z-30 opacity-60",
      )}
    >
      <CalendarEventContextMenu item={occ.item}>{children}</CalendarEventContextMenu>
      {resizable ? (
        <>
          <DayResizeGrip edge="start" occ={occ} containerRef={containerRef} cols={cols} />
          <DayResizeGrip edge="end" occ={occ} containerRef={containerRef} cols={cols} />
        </>
      ) : null}
    </div>
  );
}
