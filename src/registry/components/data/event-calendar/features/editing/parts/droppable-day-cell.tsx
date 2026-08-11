"use client";

/** Editable droppable wrapper around a month day cell (Tier B — editing
 *  feature). Extracted from the pre-split `calendar-month-view.tsx` MIXED
 *  host (features-editing split, v0.3). */

import { startOfDay } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import { useCalendarEditContext } from "../../../hooks/use-calendar-edit-extension";
import type { DroppableDayCellProps } from "../../../hooks/use-calendar-edit-extension";
import { MonthDayCell } from "../../../parts/calendar-month-view";

export function DroppableDayCell(props: DroppableDayCellProps) {
  const edit = useCalendarEditContext();
  const dayMs = startOfDay(props.day).getTime();
  const { setNodeRef, isOver } = useDroppable({
    id: `day:${dayMs}`,
    data: { dayMs },
  });
  return (
    <MonthDayCell
      {...props}
      dropRef={setNodeRef}
      isOver={isOver}
      creatable
      onDayDoubleClick={(d, e) => {
        const startMs = startOfDay(d).getTime();
        if (edit.quickCompose) {
          edit.openComposer({
            date: new Date(startMs),
            allDay: true,
            defaultEnd: new Date(startMs),
            x: e.clientX,
            y: e.clientY,
          });
        } else {
          edit.createItem(null, undefined, { startMs, allDay: true });
        }
      }}
    />
  );
}
