"use client";

/**
 * Detail editor (v0.2.0). A centered modal overlay — a plain backdrop + panel,
 * NOT the shadcn `popover` primitive — so it sidesteps the Radix/Base-UI `asChild`
 * divergence the v1 tooltip avoided the same way. It hosts the lazy
 * `<TodoRichCard editable>`; the card's `onChange` subtree is spliced back into
 * the forest via `applyEditedSubtree`. The card VALUE loads only when an editor
 * actually opens (React.lazy), so it never weighs on the default bundle.
 */

import { Suspense, lazy, useEffect } from "react";
import { useGanttTimeline } from "../hooks/use-gantt-context";

const TodoRichCardLazy = lazy(() =>
  import("../../todo-rich-card").then((m) => ({ default: m.TodoRichCard })),
);

export function GanttEditPopover() {
  const ctx = useGanttTimeline();
  const id = ctx.editingId;
  const closeEditor = ctx.closeEditor;

  useEffect(() => {
    if (id == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditor();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, closeEditor]);

  if (id == null) return null;
  const item = ctx.getItem(id);
  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${item.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close editor"
        onClick={closeEditor}
        className="absolute inset-0 cursor-default bg-background/70 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-sm">
        <Suspense
          fallback={
            <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Loading editor…
            </div>
          }
        >
          <TodoRichCardLazy
            value={item}
            editable
            statusOptions={ctx.statusOptions}
            priorityOptions={ctx.priorityOptions}
            labelOptions={ctx.labelOptions}
            permissions={ctx.permissions}
            onChange={(next) => ctx.applyEditedSubtree(next)}
          />
        </Suspense>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={closeEditor}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
