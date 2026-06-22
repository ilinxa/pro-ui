"use client";

import { lazy, Suspense } from "react";
import type { TodoColorRamp, TodoItem, TodoStatusOption } from "../types";

/**
 * Lazy-embeds the full `<TodoRichCard>` (Tier C). Pass this to `renderTooltip`
 * for a rich hover card. `React.lazy` keeps todo-rich-card OUT of the bundle
 * unless a consumer actually wires this in — the default lightweight tooltip
 * pulls nothing. Same-category relative dynamic import (rewriter-safe).
 */
const LazyTodoRichCard = lazy(() =>
  import("../../todo-rich-card").then((m) => ({ default: m.TodoRichCard })),
);

export function CalendarFullCardTooltip({
  item,
  statusOptions,
  colorRamp,
}: {
  item: TodoItem;
  statusOptions?: TodoStatusOption[];
  colorRamp?: TodoColorRamp;
}) {
  return (
    <div className="w-72">
      <Suspense
        fallback={
          <div className="p-3 text-xs text-muted-foreground">Loading…</div>
        }
      >
        <LazyTodoRichCard
          value={item}
          statusOptions={statusOptions}
          colorRamp={colorRamp}
        />
      </Suspense>
    </div>
  );
}
