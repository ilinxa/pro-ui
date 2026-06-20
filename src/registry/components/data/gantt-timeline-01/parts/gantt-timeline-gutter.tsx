"use client";

/* eslint-disable react-hooks/refs -- gutterTrackRef is bundled on the context value; the
   React Compiler's refs rule false-positives on reads taken off a context object (see
   blackboard-01). The ref is used only as a ref= prop + read inside effects. */

import { useEffect, useRef, type KeyboardEvent } from "react";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGanttTimeline } from "../hooks/use-gantt-context";
import type { GanttRow, TodoLabelOption, TodoStatusOption } from "../types";
import { effEndMs, effStartMs } from "../lib/geometry";

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
  const when = end == null ? `milestone ${start}` : `${start} to ${new Date(end).toLocaleDateString()}`;
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
}: {
  row: GanttRow;
  statusOptions?: TodoStatusOption[];
  labelOptions?: TodoLabelOption[];
  selected?: boolean;
  tabIndex: number;
  onToggle: () => void;
  onActivate: () => void;
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
        "flex h-full cursor-default select-none items-center gap-1.5 border-b border-border/40 pr-2 outline-none",
        "focus-visible:bg-accent focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
        selected && "bg-accent",
        !item.active && "opacity-60",
      )}
      style={{ paddingLeft: 8 + depth * 16 }}
    >
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
            className={cn("size-3.5 transition-transform", !collapsed && "rotate-90")}
          />
        </button>
      ) : (
        <span className="inline-block w-4 shrink-0" />
      )}

      {item.targetPerson ? (
        <Avatar className="size-5 shrink-0">
          {item.targetPerson.avatar ? (
            <AvatarImage src={item.targetPerson.avatar} alt={item.targetPerson.name} />
          ) : null}
          <AvatarFallback className="text-[9px]">
            {initials(item.targetPerson.name)}
          </AvatarFallback>
        </Avatar>
      ) : null}

      <span className="truncate text-sm text-foreground">{item.name}</span>

      {dots.length > 0 ? (
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

      {statusOpt ? (
        <Badge
          variant={statusOpt.variant ?? "secondary"}
          className={cn("shrink-0 text-[10px]", dots.length === 0 && "ml-auto")}
        >
          {statusOpt.label}
        </Badge>
      ) : null}
    </div>
  );
}

/* ───────── GanttTimelineGutter (Tier B) ───────── */

export function GanttTimelineGutter({ className }: { className?: string }) {
  const ctx = useGanttTimeline();
  const treeRef = useRef<HTMLDivElement | null>(null);

  const rows = ctx.rows;
  const activeId = ctx.focusedId ?? rows[0]?.item.id ?? null;

  useEffect(() => {
    if (!ctx.focusedId || !treeRef.current) return;
    const safe =
      typeof CSS !== "undefined" && CSS.escape
        ? CSS.escape(ctx.focusedId)
        : ctx.focusedId.replace(/"/g, '\\"');
    const el = treeRef.current.querySelector<HTMLElement>(`[data-rowid="${safe}"]`);
    el?.focus();
  }, [ctx.focusedId]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
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

  return (
    <div
      ref={treeRef}
      role="tree"
      aria-label="Task rows"
      onKeyDown={onKeyDown}
      className={cn("h-full shrink-0 overflow-hidden border-r border-border bg-card", className)}
      style={{ width: ctx.gutterWidth }}
    >
      <div ref={ctx.gutterTrackRef} className="relative" style={{ height: ctx.totalSize }}>
        {ctx.renderItems.map((ri) => {
          const row = rows[ri.index];
          if (!row) return null;
          return (
            <div
              key={row.item.id}
              className="absolute inset-x-0"
              style={{ top: ri.start, height: ctx.rowHeight }}
            >
              <GutterRow
                row={row}
                statusOptions={ctx.statusOptions}
                labelOptions={ctx.labelOptions}
                selected={ctx.selectedId === row.item.id}
                tabIndex={activeId === row.item.id ? 0 : -1}
                onToggle={() => ctx.toggleCollapse(row.item.id)}
                onActivate={() => {
                  ctx.setFocusedId(row.item.id);
                  ctx.select(row.item.id);
                  ctx.onTaskClick?.(row.item);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
