"use client";

/**
 * Editing overlays (Tier B) mounted by the assembly alongside the quick-composer:
 *
 *  - `CalendarEventEditorOverlay` — the detail editor on `editingId`. Stage 1–3
 *    only rendered the editor inside the optional `CalendarEventInspector`, so the
 *    context-menu "Edit…" + keyboard Enter were dead in the default assembly. This
 *    surfaces the SAME editor without the inspector. The assembly mounts it only
 *    when `showInspector` is false (the inspector hosts it inline → no double).
 *  - `CalendarRenameField` — inline rename on `renamingId` (the `beginRename`
 *    target was declared in Stage 1–3 but never rendered → F2 / menu-Rename were
 *    dead). A small title-input popup.
 *
 * Both use the same centered modal shell as gantt's `GanttEditPopover` — a plain
 * backdrop button + panel (NOT the shadcn `dialog`/`popover` primitive), so the
 * task family stays consistent and it sidesteps the Radix/Base-UI `asChild`
 * divergence the v1 tooltip avoided the same way. Backdrop click + Esc close.
 * `EventEditorPanel` is the shared, prop-driven editor block reused by the
 * inspector so the lazy `<TodoRichCard>` boundary is defined once.
 */

import { lazy, Suspense, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar-context";
import type {
  TodoItem,
  TodoLabelOption,
  TodoPermissions,
  TodoPriorityOption,
  TodoStatusOption,
} from "../types";

const LazyTodoRichCard = lazy(() =>
  import("../../todo-rich-card").then((m) => ({ default: m.TodoRichCard })),
);

/**
 * Shared editor block (Tier C) — the lazy `<TodoRichCard editable>` + a Done
 * button. Prop-driven (zero context); used inline by the inspector AND by the
 * centered editor overlay.
 */
export function EventEditorPanel({
  item,
  statusOptions,
  priorityOptions,
  labelOptions,
  permissions,
  onChange,
  onDone,
  className,
}: {
  item: TodoItem;
  statusOptions?: TodoStatusOption[];
  priorityOptions?: TodoPriorityOption[];
  labelOptions?: TodoLabelOption[];
  permissions?: TodoPermissions;
  onChange: (next: TodoItem) => void;
  onDone: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Suspense
        fallback={
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Loading editor…
          </div>
        }
      >
        <LazyTodoRichCard
          value={item}
          editable
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          labelOptions={labelOptions}
          permissions={permissions}
          onChange={(tree) => onChange(tree)}
        />
      </Suspense>
      <Button
        size="sm"
        variant="secondary"
        className="gap-1.5 self-end"
        onClick={onDone}
      >
        <Check className="size-3.5" /> Done editing
      </Button>
    </div>
  );
}

/**
 * Centered modal shell — a labelled backdrop button + a panel on top. Mirrors
 * `GanttEditPopover` (no shadcn `dialog`/`popover`; backdrop + Esc close).
 */
function OverlayShell({
  label,
  onClose,
  className,
  children,
}: {
  label: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Move focus into the dialog on open so keyboard / screen-reader users land
    // inside it (a more specific control, e.g. the rename input, may refocus after).
    const raf = requestAnimationFrame(() => contentRef.current?.focus());
    return () => {
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
    };
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-background/70 backdrop-blur-sm"
      />
      <div
        ref={contentRef}
        tabIndex={-1}
        className={cn("relative z-10 w-full max-w-sm outline-none", className)}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Centered detail-editor overlay (Tier B). Renders the shared editor on
 * `editingId` without requiring the inspector. Mounted by the assembly only when
 * `showInspector` is false.
 */
export function CalendarEventEditorOverlay() {
  const {
    occurrences,
    statusOptions,
    priorityOptions,
    labelOptions,
    permissions,
    editingId,
    applyEditedSubtree,
    closeEditor,
  } = useCalendar();
  const item = editingId
    ? (occurrences.find((o) => o.id === editingId)?.item ?? null)
    : null;

  if (!editingId || !item) return null;

  return (
    <OverlayShell
      label={`Edit ${item.name}`}
      onClose={closeEditor}
      className="max-h-[85vh] overflow-auto"
    >
      <EventEditorPanel
        item={item}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        labelOptions={labelOptions}
        permissions={permissions}
        onChange={applyEditedSubtree}
        onDone={closeEditor}
      />
    </OverlayShell>
  );
}

/**
 * Inline-rename popup (Tier B). Renders on `renamingId` — a title input prefilled
 * from the item. Enter commits, Esc / Cancel / backdrop aborts.
 */
export function CalendarRenameField() {
  const { occurrences, renamingId, renameItemAction, endRename } = useCalendar();
  const item = renamingId
    ? (occurrences.find((o) => o.id === renamingId)?.item ?? null)
    : null;
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus + select on open (rAF so the input is mounted; not a render-time read).
  useEffect(() => {
    if (!renamingId) return;
    const raf = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [renamingId]);

  if (!renamingId || !item) return null;

  const commit = () => {
    const value = inputRef.current?.value.trim();
    if (value) renameItemAction(renamingId, value);
    endRename();
  };

  return (
    <OverlayShell label={`Rename ${item.name}`} onClose={endRename} className="max-w-xs">
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <label
          htmlFor="cal-rename-input"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          Rename event
        </label>
        <Input
          id="cal-rename-input"
          key={renamingId}
          ref={inputRef}
          defaultValue={item.name}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              endRename();
            }
          }}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => endRename()}>
            Cancel
          </Button>
          <Button size="sm" onClick={commit}>
            Save
          </Button>
        </div>
      </div>
    </OverlayShell>
  );
}
