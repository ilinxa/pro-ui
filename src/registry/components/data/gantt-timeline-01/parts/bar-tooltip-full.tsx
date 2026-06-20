"use client";

import { lazy, Suspense } from "react";
import type { TodoItem } from "../types";

// The ONLY module that imports todo-rich-card's VALUE, and only lazily — so the
// card never enters a consumer's bundle unless they opt into the full-card
// tooltip via `renderTooltip={(item) => <GanttFullCardTooltip item={item} />}`.
const TodoRichCardLazy = lazy(() =>
  import("../../todo-rich-card").then((m) => ({ default: m.TodoRichCard })),
);

export function GanttFullCardTooltip({ item }: { item: TodoItem }) {
  return (
    <div className="w-72">
      <Suspense
        fallback={
          <div className="p-2 text-xs text-muted-foreground">Loading…</div>
        }
      >
        <TodoRichCardLazy defaultValue={item} editable={false} />
      </Suspense>
    </div>
  );
}
