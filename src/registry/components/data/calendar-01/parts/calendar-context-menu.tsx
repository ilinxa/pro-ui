"use client";

/**
 * Right-click action menu (Tier B). Wraps an event and offers permission-gated
 * Edit / Status / Priority / Delete. Every action routes through the same
 * `use-calendar-edit` dispatchers as the pointer paths (single chokepoint). When
 * editing is off or nothing is permitted, it renders the child unwrapped — zero
 * overhead in the read-only path. Mirrors gantt's `GanttContextMenu`
 * (`ContextMenuTrigger asChild` is the cross-backend-safe shape).
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
import { useCalendar } from "../hooks/use-calendar-context";
import { serializeTasks } from "../../todo-rich-card/lib/clipboard";
import type { TodoItem } from "../types";

export function CalendarEventContextMenu({
  item,
  children,
}: {
  item: TodoItem;
  children: ReactNode;
}) {
  const ctx = useCalendar();
  const canEdit = ctx.editable && ctx.can("editDetails", item);
  const canDelete = ctx.editable && ctx.can("delete", item);
  const statusOptions = ctx.statusOptions ?? [];
  const priorityOptions = ctx.priorityOptions ?? [];

  // When editable, the menu always offers Copy (reading data needs no edit/delete
  // permission); other items are capability-gated. Read-only → child unwrapped.
  if (!ctx.editable) return <>{children}</>;

  const copy = () => {
    void navigator.clipboard?.writeText(serializeTasks([item], "calendar-01"));
  };
  const cut = () => {
    // Don't delete-without-copy: if the clipboard is unavailable (insecure
    // context) the menu cut is a no-op (the keyboard Cut, which uses the sync
    // clipboard event, still works).
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(serializeTasks([item], "calendar-01"));
    ctx.deleteItem(item.id);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        {canEdit ? (
          <ContextMenuItem onSelect={() => ctx.openEditor(item.id)}>
            Edit…
          </ContextMenuItem>
        ) : null}

        {canEdit ? (
          <ContextMenuItem onSelect={() => ctx.beginRename(item.id)}>
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
                  onSelect={() => ctx.changeStatus(item.id, o.value)}
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
                  onSelect={() => ctx.changePriority(item.id, o.value)}
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
              onSelect={() => ctx.deleteItem(item.id)}
            >
              Delete
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
