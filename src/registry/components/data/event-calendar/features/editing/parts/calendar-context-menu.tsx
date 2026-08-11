"use client";

/**
 * Right-click action menu (Tier B — editing feature). Wraps an event and
 * offers permission-gated Edit / Status / Priority / Delete. Every action
 * routes through the same `use-calendar-edit` dispatchers as the pointer
 * paths (single chokepoint). Only ever mounted via `edit.components.
 * EventContextMenu` — i.e. inside the extension's own Provider — so it needs
 * no `editable`-guard early-return (the read-only path never reaches this
 * component at all). Mirrors gantt's `GanttContextMenu` (same F-cross-13
 * path-b trigger shape — see the trigger comment below).
 */

import type { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useCalendar } from "../../../hooks/use-calendar-context";
import { useCalendarEditContext } from "../../../hooks/use-calendar-edit-extension";
import { serializeTasks } from "../../../../task-card/lib/clipboard";
import type { TaskItem } from "../../../types";

export function CalendarEventContextMenu({
  item,
  children,
}: {
  item: TaskItem;
  children: ReactNode;
}) {
  const base = useCalendar();
  const edit = useCalendarEditContext();
  const canEdit = edit.can("editDetails", item);
  const canDelete = edit.can("delete", item);
  const statusOptions = base.statusOptions ?? [];
  const priorityOptions = base.priorityOptions ?? [];

  const copy = () => {
    void navigator.clipboard
      ?.writeText(serializeTasks([item], "event-calendar"))
      .catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[event-calendar] copy to clipboard failed:", err);
        }
      });
  };
  const cut = () => {
    // Don't delete-without-copy: if the clipboard is unavailable (insecure
    // context) the menu cut is a no-op (the keyboard Cut, which uses the sync
    // clipboard event, still works). The write is async — dispatch the delete
    // ONLY on fulfillment, so a denied/failed write never destroys the item
    // with nothing on the clipboard (v0.2.4).
    if (!navigator.clipboard) return;
    void navigator.clipboard
      .writeText(serializeTasks([item], "event-calendar"))
      .then(() => edit.deleteItem(item.id))
      .catch((err: unknown) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[event-calendar] Cut aborted — clipboard write failed; item NOT deleted.",
            err,
          );
        }
      });
  };

  return (
    <ContextMenu>
      {/* F-cross-13 path-b: `asChild` is Radix-only (Base UI rejects it). The
          trigger renders its own wrapper element (a <span> — non-button in both
          backends); `contents` makes it box-less so layout is untouched, and
          right-click / long-press bubble up from the child to the trigger's
          listeners — no prop injection into `children` needed. (v0.2.5) */}
      <ContextMenuTrigger className="contents">{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        {canEdit ? (
          <ContextMenuItem onSelect={() => edit.openEditor(item.id)}>
            Edit…
          </ContextMenuItem>
        ) : null}

        {canEdit ? (
          <ContextMenuItem onSelect={() => edit.beginRename(item.id)}>
            Rename
          </ContextMenuItem>
        ) : null}

        {canEdit && statusOptions.length > 0 ? (
          <ContextMenuSub>
            <ContextMenuSubTrigger>Status</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {statusOptions.map((o) => (
                <ContextMenuItem
                  key={o.value}
                  onSelect={() => edit.changeStatus(item.id, o.value)}
                >
                  {o.label}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        ) : null}

        {canEdit && priorityOptions.length > 0 ? (
          <ContextMenuSub>
            <ContextMenuSubTrigger>Priority</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {priorityOptions.map((o) => (
                <ContextMenuItem
                  key={o.value}
                  onSelect={() => edit.changePriority(item.id, o.value)}
                >
                  {o.label}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        ) : null}

        {canEdit ? <ContextMenuSeparator /> : null}
        <ContextMenuItem onSelect={copy}>Copy</ContextMenuItem>
        {canDelete ? (
          <ContextMenuItem onSelect={cut}>Cut</ContextMenuItem>
        ) : null}

        {canDelete ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onSelect={() => edit.deleteItem(item.id)}
            >
              Delete
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
