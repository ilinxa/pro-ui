"use client";

import type { HTMLAttributes } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TodoItem, TodoStatusOption } from "../types";
import { effEndMs, effStartMs } from "../lib/geometry";

/* ───────── helpers ───────── */

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fmtDate(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ms));
}

/* ───────── GanttBar (Tier C) ───────── */

export type GanttBarProps = {
  leftPx: number;
  widthPx: number;
  fill: string;
  rowHeight: number;
  overdue?: boolean;
  inactive?: boolean;
  locked?: boolean;
  priorityColor?: string;
  selected?: boolean;
  /** v0.2.0 — grab cursor for drag-to-reschedule. */
  movable?: boolean;
  /** v0.2.0 — render left/right edge resize handles (`data-edge`). */
  resizable?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export function GanttBar({
  leftPx,
  widthPx,
  fill,
  rowHeight,
  overdue,
  inactive,
  locked,
  priorityColor,
  selected,
  movable,
  resizable,
  className,
  style,
  ...rest
}: GanttBarProps) {
  const barH = Math.max(10, Math.min(rowHeight - 12, 22));
  return (
    <div
      data-selected={selected || undefined}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 rounded-[5px] shadow-sm ring-offset-background transition-shadow",
        movable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "data-[selected]:ring-2 data-[selected]:ring-foreground/70 data-[selected]:ring-offset-1",
        inactive && "opacity-50",
        className,
      )}
      style={{
        left: leftPx,
        width: Math.max(widthPx, 6),
        height: barH,
        background: fill,
        ...style,
      }}
      {...rest}
    >
      {priorityColor ? (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-1 rounded-l-[5px]"
          style={{ background: priorityColor }}
        />
      ) : null}
      {overdue ? (
        <span
          aria-hidden
          className="absolute inset-y-0 right-0 w-1.5 rounded-r-[5px] bg-destructive"
        />
      ) : null}
      {locked ? (
        <span
          aria-hidden
          className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] leading-none text-background/80"
        >
          🔒
        </span>
      ) : null}
      {resizable ? (
        <>
          <span
            data-edge="start"
            aria-hidden
            className="absolute inset-y-0 left-0 w-1.5 cursor-col-resize rounded-l-[5px] hover:bg-foreground/25"
          />
          <span
            data-edge="end"
            aria-hidden
            className="absolute inset-y-0 right-0 w-1.5 cursor-col-resize rounded-r-[5px] hover:bg-foreground/25"
          />
        </>
      ) : null}
    </div>
  );
}

/* ───────── SummaryBar (Tier C) ───────── */

export type SummaryBarProps = {
  leftPx: number;
  widthPx: number;
  selected?: boolean;
  /** v0.3.0 — grab cursor + enlarged hit area for group-move (drag → shift subtree). */
  groupMovable?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export function SummaryBar({
  leftPx,
  widthPx,
  selected,
  groupMovable,
  className,
  style,
  ...rest
}: SummaryBarProps) {
  return (
    <div
      data-selected={selected || undefined}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 rounded-sm bg-foreground/85",
        groupMovable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "data-[selected]:ring-2 data-[selected]:ring-foreground",
        className,
      )}
      style={{ left: leftPx, width: Math.max(widthPx, 8), height: 7, ...style }}
      {...rest}
    >
      {/* enlarged pointer hit area (visual stays a thin 7px bar) */}
      {groupMovable ? (
        <span aria-hidden className="absolute -inset-y-2 inset-x-0" />
      ) : null}
      {/* bracket end-caps */}
      <span
        aria-hidden
        className="absolute -bottom-1 left-0 h-2 w-1.5 -skew-x-[20deg] bg-foreground/85"
      />
      <span
        aria-hidden
        className="absolute -bottom-1 right-0 h-2 w-1.5 skew-x-[20deg] bg-foreground/85"
      />
    </div>
  );
}

/* ───────── MilestoneDiamond (Tier C) ───────── */

export type MilestoneDiamondProps = {
  leftPx: number;
  fill: string;
  selected?: boolean;
  /** v0.2.0 — grab cursor for drag-to-move the instant. */
  movable?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export function MilestoneDiamond({
  leftPx,
  fill,
  selected,
  movable,
  className,
  style,
  ...rest
}: MilestoneDiamondProps) {
  const size = 13;
  return (
    <div
      data-selected={selected || undefined}
      className={cn(
        "absolute top-1/2 rounded-[3px] shadow-sm",
        movable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "data-[selected]:ring-2 data-[selected]:ring-foreground/70",
        className,
      )}
      style={{
        left: leftPx - size / 2,
        width: size,
        height: size,
        transform: "translateY(-50%) rotate(45deg)",
        background: fill,
        ...style,
      }}
      {...rest}
    />
  );
}

/* ───────── TodayLine (Tier C) ───────── */

export function TodayLine({ leftPx }: { leftPx: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-primary/80"
      style={{ left: leftPx }}
    >
      <span className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-sm bg-primary px-1 py-0.5 text-[9px] font-medium leading-none text-primary-foreground">
        Today
      </span>
    </div>
  );
}

/* ───────── BarTooltip (Tier C, lightweight default) ───────── */

export function BarTooltip({
  item,
  statusOptions,
}: {
  item: TodoItem;
  statusOptions?: TodoStatusOption[];
}) {
  const startMs = effStartMs(item);
  const endMs = effEndMs(item);
  const statusOpt = statusOptions?.find((o) => o.value === item.status);
  return (
    <div className="min-w-44 max-w-72 space-y-1.5">
      <div className="text-xs font-semibold text-popover-foreground">
        {item.name}
      </div>
      <div className="font-mono text-[11px] text-muted-foreground">
        {endMs == null
          ? `◆ ${fmtDate(startMs)}`
          : `${fmtDate(startMs)} → ${fmtDate(endMs)}`}
      </div>
      <div className="flex items-center gap-2 pt-0.5">
        {item.targetPerson ? (
          <span className="flex items-center gap-1.5">
            <Avatar className="size-4">
              {item.targetPerson.avatar ? (
                <AvatarImage
                  src={item.targetPerson.avatar}
                  alt={item.targetPerson.name}
                />
              ) : null}
              <AvatarFallback className="text-[8px]">
                {initials(item.targetPerson.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground">
              {item.targetPerson.name}
            </span>
          </span>
        ) : null}
        {statusOpt ? (
          <Badge variant={statusOpt.variant ?? "secondary"} className="text-[10px]">
            {statusOpt.icon ? `${statusOpt.icon} ` : ""}
            {statusOpt.label}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
