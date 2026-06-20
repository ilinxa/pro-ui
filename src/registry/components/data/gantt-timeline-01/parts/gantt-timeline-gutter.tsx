"use client";

/* eslint-disable react-hooks/refs -- gutterTrackRef is bundled on the context value; the
   React Compiler's refs rule false-positives on reads taken off a context object (see
   blackboard-01). The ref is used only as a ref= prop + read inside effects. */

import { useEffect, useRef, type KeyboardEvent } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronRight, GripVertical, Plus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useGanttTimeline } from "../hooks/use-gantt-context";
import type { GanttRow, TodoLabelOption, TodoStatusOption } from "../types";
import { effEndMs, effStartMs } from "../lib/geometry";
import { GanttContextMenu } from "./gantt-context-menu";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function rowAriaLabel(row: GanttRow, statusOpt?: TodoStatusOption): string {
  const { item } = row;
  const start = new Date(effStartMs(item)).toLocaleDateString();
  const end = effEndMs(item);
  const when =
    end == null
      ? `milestone ${start}`
      : `${start} to ${new Date(end).toLocaleDateString()}`;
  const status = statusOpt ? `, ${statusOpt.label}` : "";
  return `${item.name}, ${when}${status}`;
}

/* ───────── GutterRow (Tier C) ───────── */

export function GutterRow({
  row,
  statusOptions,
  labelOptions,
  selected,
  tabIndex,
  onToggle,
  onActivate,
  editable,
  renaming,
  canCreate,
  canDelete,
  gripRef,
  gripProps,
  onAddChild,
  onDelete,
  onRenameCommit,
  onRenameCancel,
}: {
  row: GanttRow;
  statusOptions?: TodoStatusOption[];
  labelOptions?: TodoLabelOption[];
  selected?: boolean;
  tabIndex: number;
  onToggle: () => void;
  onActivate: () => void;
  editable?: boolean;
  renaming?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
  gripRef?: (el: HTMLElement | null) => void;
  gripProps?: Record<string, unknown>;
  onAddChild?: () => void;
  onDelete?: () => void;
  onRenameCommit?: (name: string) => void;
  onRenameCancel?: () => void;
}) {
  const { item, depth, hasChildren, collapsed } = row;
  const statusOpt = statusOptions?.find((o) => o.value === item.status);
  const dots = (item.labels ?? [])
    .map((key) => labelOptions?.find((o) => o.value === key))
    .filter(Boolean)
    .slice(0, 4) as TodoLabelOption[];

  return (
    <div
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={hasChildren ? !collapsed : undefined}
      aria-selected={selected || undefined}
      aria-label={rowAriaLabel(row, statusOpt)}
      data-rowid={item.id}
      tabIndex={tabIndex}
      onClick={onActivate}
      className={cn(
        "group/row flex h-full cursor-default select-none items-center gap-1.5 border-b border-border/40 pr-2 outline-none",
        "focus-visible:bg-accent focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
        selected && "bg-accent",
        !item.active && "opacity-60",
      )}
      style={{ paddingLeft: 8 + depth * 16 }}
    >
      {editable ? (
        <button
          ref={gripRef as ((el: HTMLButtonElement | null) => void) | undefined}
          type="button"
          tabIndex={-1}
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          className="-ml-1 hidden shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing group-hover/row:block"
          {...gripProps}
        >
          <GripVertical className="size-3.5" />
        </button>
      ) : null}

      {hasChildren ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={collapsed ? "Expand" : "Collapse"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="grid size-4 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform",
              !collapsed && "rotate-90",
            )}
          />
        </button>
      ) : (
        <span className="inline-block w-4 shrink-0" />
      )}

      {item.targetPerson ? (
        <Avatar className="size-5 shrink-0">
          {item.targetPerson.avatar ? (
            <AvatarImage
              src={item.targetPerson.avatar}
              alt={item.targetPerson.name}
            />
          ) : null}
          <AvatarFallback className="text-[9px]">
            {initials(item.targetPerson.name)}
          </AvatarFallback>
        </Avatar>
      ) : null}

      {renaming ? (
        <Input
          autoFocus
          defaultValue={item.name}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") onRenameCommit?.(e.currentTarget.value.trim());
            else if (e.key === "Escape") onRenameCancel?.();
          }}
          onBlur={(e) => onRenameCommit?.(e.currentTarget.value.trim())}
          className="h-6 flex-1 px-1.5 py-0 text-sm"
        />
      ) : (
        <span className="truncate text-sm text-foreground">{item.name}</span>
      )}

      {!renaming && dots.length > 0 ? (
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {dots.map((d) => (
            <span
              key={d.value}
              title={d.label}
              className="size-2 rounded-full"
              style={{ background: d.color ?? "var(--muted-foreground)" }}
            />
          ))}
        </span>
      ) : null}

      {!renaming && statusOpt ? (
        <Badge
          variant={statusOpt.variant ?? "secondary"}
          className={cn("shrink-0 text-[10px]", dots.length === 0 && "ml-auto")}
        >
          {statusOpt.label}
        </Badge>
      ) : null}

      {editable && !renaming ? (
        <span className="hidden shrink-0 items-center gap-0.5 group-hover/row:flex">
          {canCreate ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Add child task"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild?.();
              }}
              className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Delete task"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

/* ───────── drop zones (Tier-B internal) ───────── */

function DropZones({ id }: { id: string }) {
  const before = useDroppable({ id: `before:${id}` });
  const into = useDroppable({ id: `into:${id}` });
  const after = useDroppable({ id: `after:${id}` });
  return (
    <>
      <div
        ref={before.setNodeRef}
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1/4",
          before.isOver && "border-t-2 border-primary",
        )}
      />
      <div
        ref={into.setNodeRef}
        className={cn(
          "pointer-events-none absolute inset-x-0 top-1/4 h-2/4",
          into.isOver && "rounded bg-primary/15 ring-1 ring-inset ring-primary",
        )}
      />
      <div
        ref={after.setNodeRef}
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-1/4",
          after.isOver && "border-b-2 border-primary",
        )}
      />
    </>
  );
}

/* ───────── GanttTimelineGutter (Tier B) ───────── */

export function GanttTimelineGutter({ className }: { className?: string }) {
  const ctx = useGanttTimeline();
  const treeRef = useRef<HTMLDivElement | null>(null);

  const rows = ctx.rows;
  const activeId = ctx.focusedId ?? rows[0]?.item.id ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    if (!ctx.focusedId || !treeRef.current) return;
    const safe =
      typeof CSS !== "undefined" && CSS.escape
        ? CSS.escape(ctx.focusedId)
        : ctx.focusedId.replace(/"/g, '\\"');
    const el = treeRef.current.querySelector<HTMLElement>(
      `[data-rowid="${safe}"]`,
    );
    el?.focus();
  }, [ctx.focusedId]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (ctx.renamingId) return; // rename input owns the keys
    const i = rows.findIndex((r) => r.item.id === activeId);
    const focusAt = (j: number) => {
      const r = rows[Math.max(0, Math.min(rows.length - 1, j))];
      if (r) ctx.setFocusedId(r.item.id);
    };
    const cur = rows[i];
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(i + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusAt(i - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(rows.length - 1);
        break;
      case "ArrowRight":
        if (cur?.hasChildren && cur.collapsed) {
          e.preventDefault();
          ctx.toggleCollapse(cur.item.id);
        } else if (i < rows.length - 1) {
          e.preventDefault();
          focusAt(i + 1);
        }
        break;
      case "ArrowLeft":
        if (cur?.hasChildren && !cur.collapsed) {
          e.preventDefault();
          ctx.toggleCollapse(cur.item.id);
        } else if (cur?.parentId) {
          e.preventDefault();
          ctx.setFocusedId(cur.parentId);
        }
        break;
      case "Enter":
        if (cur) {
          e.preventDefault();
          ctx.select(cur.item.id);
          ctx.onTaskClick?.(cur.item);
        }
        break;
      case "F2":
        if (cur && ctx.editable) {
          e.preventDefault();
          ctx.beginRename(cur.item.id);
        }
        break;
      case "Delete":
      case "Backspace":
        if (cur && ctx.editable) {
          e.preventDefault();
          ctx.deleteItem(cur.item.id);
        }
        break;
      case " ":
        if (cur?.hasChildren) {
          e.preventDefault();
          ctx.toggleCollapse(cur.item.id);
        }
        break;
      default:
        break;
    }
  }

  function onDragEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    if (!e.over) return;
    const [zone, targetId] = String(e.over.id).split(":");
    if (!targetId || targetId === activeId) return;
    const info = ctx.nodeInfo(targetId);
    if (zone === "into") {
      const target = ctx.getItem(targetId);
      ctx.moveItemAction(activeId, targetId, target?.children?.length ?? 0);
    } else if (zone === "before") {
      ctx.moveItemAction(activeId, info?.parentId ?? null, info?.index ?? 0);
    } else {
      ctx.moveItemAction(activeId, info?.parentId ?? null, (info?.index ?? 0) + 1);
    }
  }

  const tree = (
    <div
      ref={treeRef}
      role="tree"
      aria-label="Task rows"
      onKeyDown={onKeyDown}
      className={cn(
        "h-full shrink-0 overflow-hidden border-r border-border bg-card",
        className,
      )}
      style={{ width: ctx.gutterWidth }}
    >
      <div
        ref={ctx.gutterTrackRef}
        className="relative"
        style={{ height: ctx.totalSize }}
      >
        {ctx.renderItems.map((ri) => {
          const row = rows[ri.index];
          if (!row) return null;
          return (
            <GutterRowItem
              key={row.item.id}
              row={row}
              top={ri.start}
              height={ctx.rowHeight}
              activeId={activeId}
            />
          );
        })}
      </div>
    </div>
  );

  // A single DndContext is always present (draggables self-disable when read-only)
  // so the per-row `useDraggable` hooks always have a provider.
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={onDragEnd}
    >
      {tree}
    </DndContext>
  );
}

/** One gutter row: drag source (grip activator) + drop zones + the dumb GutterRow. */
function GutterRowItem({
  row,
  top,
  height,
  activeId,
}: {
  row: GanttRow;
  top: number;
  height: number;
  activeId: string | null;
}) {
  const ctx = useGanttTimeline();
  const id = row.item.id;
  const item = row.item;
  const canMove = ctx.editable && ctx.can("move", item);
  const canCreate = ctx.editable && ctx.can("create", item);
  const canDelete = ctx.editable && ctx.can("delete", item);
  const draggable = useDraggable({ id, disabled: !canMove });

  return (
    <div
      ref={draggable.setNodeRef}
      className={cn("absolute inset-x-0", draggable.isDragging && "opacity-40")}
      style={{ top, height }}
    >
      <GanttContextMenu item={item}>
        <GutterRow
          row={row}
          statusOptions={ctx.statusOptions}
          labelOptions={ctx.labelOptions}
          selected={ctx.selectedId === id}
          tabIndex={activeId === id ? 0 : -1}
          editable={ctx.editable}
          renaming={ctx.renamingId === id}
          canCreate={canCreate}
          canDelete={canDelete}
          gripRef={canMove ? draggable.setActivatorNodeRef : undefined}
          gripProps={
            canMove ? { ...draggable.listeners, ...draggable.attributes } : undefined
          }
          onToggle={() => ctx.toggleCollapse(id)}
          onActivate={() => {
            ctx.setFocusedId(id);
            ctx.select(id);
            ctx.onTaskClick?.(item);
          }}
          onAddChild={() => ctx.createItem(id)}
          onDelete={() => ctx.deleteItem(id)}
          onRenameCommit={(name) => {
            if (name) ctx.renameItemAction(id, name);
            ctx.endRename();
          }}
          onRenameCancel={() => ctx.endRename()}
        />
      </GanttContextMenu>
      {ctx.editable ? <DropZones id={id} /> : null}
    </div>
  );
}
