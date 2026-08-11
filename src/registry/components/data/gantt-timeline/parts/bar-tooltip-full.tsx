"use client";

import { lazy, Suspense } from "react";
import type { TaskItem } from "../types";

// The ONLY module that imports task-card's VALUE, and only lazily — so the
// card never enters a consumer's bundle unless they opt into the full-card
// tooltip via `renderTooltip={(item) => <GanttFullCardTooltip item={item} />}`.
const TaskCardLazy = lazy(() =>
  import("../../task-card").then((m) => ({ default: m.TaskCard })),
);

export function GanttFullCardTooltip({ item }: { item: TaskItem }) {
  return (
    <div className="w-72">
      <Suspense
        fallback={
          <div className="p-2 text-xs text-muted-foreground">Loading…</div>
        }
      >
        <TaskCardLazy defaultValue={item} editable={false} />
      </Suspense>
    </div>
  );
}
