"use client";

import { lazy, Suspense } from "react";
import type { TaskColorRamp, TaskItem, TaskStatusOption } from "../types";

/**
 * Lazy-embeds the full `<TaskCard>` (Tier C). Pass this to `renderTooltip`
 * for a rich hover card. `React.lazy` keeps task-card OUT of the bundle
 * unless a consumer actually wires this in — the default lightweight tooltip
 * pulls nothing. Same-category relative dynamic import (rewriter-safe).
 */
const LazyTaskCard = lazy(() =>
  import("../../task-card").then((m) => ({ default: m.TaskCard })),
);

export function CalendarFullCardTooltip({
  item,
  statusOptions,
  colorRamp,
}: {
  item: TaskItem;
  statusOptions?: TaskStatusOption[];
  colorRamp?: TaskColorRamp;
}) {
  return (
    <div className="w-72">
      <Suspense
        fallback={
          <div className="p-3 text-xs text-muted-foreground">Loading…</div>
        }
      >
        <LazyTaskCard
          value={item}
          statusOptions={statusOptions}
          colorRamp={colorRamp}
        />
      </Suspense>
    </div>
  );
}
