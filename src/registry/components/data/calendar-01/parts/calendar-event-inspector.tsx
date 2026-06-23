"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCalendar } from "../hooks/use-calendar-context";
import { coveredDays } from "../lib/segments";
import { EventEditorPanel } from "./calendar-edit-overlays";
import type { CalendarOccurrence } from "../types";

/**
 * Selected-event inspector (Tier B). Shows a read-only preview of the selected
 * occurrence; when `editable`, an Edit button reveals the shared `EventEditorPanel`
 * (the full lazy `<TodoRichCard editable>` — title, status, priority, dates,
 * description) whose edits splice back via `applyEditedSubtree`, plus Delete.
 * Lives inside `Calendar01Root` (reads context). Place it beside the views for
 * a persistent details panel, or omit it (the editor also surfaces via the
 * `CalendarEventEditorOverlay` the assembly mounts when there's no inspector).
 */

function whenLabel(occ: CalendarOccurrence): string {
  const s = new Date(occ.startMs);
  if (occ.kind === "milestone") return format(s, "PPP 'at' p");
  if (occ.allDay) {
    const last = new Date(coveredDays(occ).lastMs);
    return format(s, "yyyy-MM-dd") === format(last, "yyyy-MM-dd")
      ? `${format(s, "PPP")} (all day)`
      : `${format(s, "PPP")} – ${format(last, "PPP")}`;
  }
  return `${format(s, "PPP")} · ${format(s, "p")} – ${format(new Date(occ.endMs), "p")}`;
}

export function CalendarEventInspector({ className }: { className?: string }) {
  const {
    occurrences,
    selectedId,
    select,
    statusOptions,
    priorityOptions,
    labelOptions,
    permissions,
    editable,
    can,
    deleteItem,
    applyEditedSubtree,
    editingId,
    openEditor,
    closeEditor,
  } = useCalendar();

  const occ = useMemo(
    () => occurrences.find((o) => o.id === selectedId) ?? null,
    [occurrences, selectedId],
  );

  if (!occ) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1 p-6 text-center",
          className,
        )}
      >
        <p className="text-sm font-medium text-muted-foreground">
          No event selected
        </p>
        <p className="text-xs text-muted-foreground">
          Click an event to see its details{editable ? " and edit it" : ""}.
        </p>
      </div>
    );
  }

  const item = occ.item;
  const editing = editingId === item.id;
  const status = statusOptions?.find((o) => o.value === item.status);
  const priority = priorityOptions?.find((o) => o.value === item.priority);
  const canEdit = can("editDetails", item);
  const canDelete = can("delete", item);

  return (
    <div className={cn("flex flex-col gap-3 p-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span
            className="size-2 rounded-full"
            style={{ background: occ.color.fill }}
            aria-hidden
          />
          Event details
        </span>
        <button
          type="button"
          aria-label="Clear selection"
          onClick={() => select(null)}
          className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {editing ? (
        <EventEditorPanel
          item={item}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          labelOptions={labelOptions}
          permissions={permissions}
          onChange={applyEditedSubtree}
          onDone={closeEditor}
        />
      ) : (
        <>
          <div className="space-y-1">
            <h3 className="text-base font-semibold leading-tight text-foreground">
              {item.name}
            </h3>
            <p className="text-xs text-muted-foreground">{whenLabel(occ)}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {status ? (
              <Badge variant={status.variant ?? "secondary"}>
                {status.label}
              </Badge>
            ) : null}
            {priority ? (
              <Badge
                variant="outline"
                style={
                  priority.color
                    ? { color: priority.color, borderColor: priority.color }
                    : undefined
                }
              >
                {priority.label}
              </Badge>
            ) : null}
            {occ.overdue ? <Badge variant="destructive">Overdue</Badge> : null}
          </div>

          {item.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
              {item.description}
            </p>
          ) : null}

          {editable ? (
            <div className="mt-1 flex gap-2">
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!canEdit}
                onClick={() => openEditor(item.id)}
              >
                <Pencil className="size-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={!canDelete}
                onClick={() => {
                  deleteItem(item.id);
                  select(null);
                }}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
