"use client";

/**
 * Tier-C right-click action menu (v0.2.0). Wraps a target (a body bar row or a
 * gutter row) and offers permission-gated Edit / Rename / Add child / Add sibling
 * / Status / Delete. Every action routes through the same `use-gantt-edit`
 * dispatchers as the pointer + keyboard paths (single mutation chokepoint). When
 * editing is off or nothing is permitted, it renders the child unwrapped — zero
 * overhead in the v1 read-only path.
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
import { useGanttTimeline } from "../hooks/use-gantt-context";
import type { TodoItem } from "../types";

export function GanttContextMenu({
  item,
  children,
}: {
  item: TodoItem;
  children: ReactNode;
}) {
  const ctx = useGanttTimeline();

  const canEdit = ctx.editable && ctx.can("editDetails", item);
  const canCreate = ctx.editable && ctx.can("create", item);
  const canDelete = ctx.editable && ctx.can("delete", item);
  const statusOptions = ctx.statusOptions ?? [];

  if (!canEdit && !canCreate && !canDelete) return <>{children}</>;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {canEdit ? (
          <>
            <ContextMenuItem onSelect={() => ctx.openEditor(item.id)}>
              Edit…
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => ctx.beginRename(item.id)}>
              Rename
            </ContextMenuItem>
          </>
        ) : null}

        {canCreate ? (
          <>
            <ContextMenuItem onSelect={() => ctx.createItem(item.id)}>
              Add child task
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => {
                const info = ctx.nodeInfo(item.id);
                ctx.createItem(
                  info?.parentId ?? null,
                  undefined,
                  (info?.index ?? 0) + 1,
                );
              }}
            >
              Add task below
            </ContextMenuItem>
          </>
        ) : null}

        {canEdit && statusOptions.length > 0 ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>Status</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {statusOptions.map((o) => (
                  <ContextMenuItem
                    key={o.value}
                    onSelect={() => ctx.changeStatus(item.id, o.value)}
                  >
                    {o.icon ? `${o.icon} ` : ""}
                    {o.label}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
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
