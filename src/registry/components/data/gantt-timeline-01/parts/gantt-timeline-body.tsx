"use client";

/* eslint-disable react-hooks/refs -- bodyScrollRef/gutterTrackRef are bundled on the
   context value; the React Compiler's refs rule false-positives on reads taken off a
   context object (see blackboard-01). Ref reads here are confined to effects + ref= props. */

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { useGanttTimeline } from "../hooks/use-gantt-context";
import type { TodoItem } from "../types";
import { addUnit, isWeekend, pickScales, ticks, x } from "../lib/time-scale";
import {
  BarTooltip,
  GanttBar,
  MilestoneDiamond,
  SummaryBar,
  TodayLine,
} from "./gantt-bars";

type HoverState = { item: TodoItem; leftPx: number; topPx: number };

export function GanttTimelineBody({ className }: { className?: string }) {
  const ctx = useGanttTimeline();
  const scrollRef = ctx.bodyScrollRef;
  const { viewport, bodyWidth } = ctx;

  const [hover, setHover] = useState<HoverState | null>(null);

  /* ── measure width ── */
  const setBodyWidth = ctx.setBodyWidth;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setBodyWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollRef, setBodyWidth]);

  /* ── wheel (non-passive: plain vertical = native scroll; shift/horizontal = pan; ⌘/ctrl = zoom) ── */
  const { onZoomAt, onPan, disableGestures } = ctx;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || disableGestures) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        onZoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left);
      } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        onPan(-(e.deltaX || e.deltaY));
      }
      // plain vertical wheel → native row scroll
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scrollRef, disableGestures, onZoomAt, onPan]);

  /* ── pointer gestures (drag-pan + dominant-lock + momentum + pinch) ── */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lockRef = useRef<null | "h" | "v">(null);
  const pinchRef = useRef<number | null>(null);
  const velRef = useRef(0);
  const lastRef = useRef<{ x: number; t: number } | null>(null);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (disableGestures) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setHover(null);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchRef.current = Math.hypot(a.x - b.x, a.y - b.y);
      lockRef.current = null;
    } else {
      ctx.beginPan();
      lockRef.current = null;
      lastRef.current = { x: e.clientX, t: e.timeStamp };
      velRef.current = 0;
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (disableGestures) return;
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchRef.current != null) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 0 && pinchRef.current > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        onZoomAt(dist / pinchRef.current, (a.x + b.x) / 2 - rect.left);
      }
      pinchRef.current = dist;
      return;
    }
    if (pointers.current.size === 1) {
      if (!lockRef.current) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 3) lockRef.current = "h";
        else if (Math.abs(dy) > 3) lockRef.current = "v";
      }
      if (lockRef.current === "h") {
        onPan(dx);
        const last = lastRef.current;
        const t = e.timeStamp;
        if (last && t > last.t) velRef.current = (e.clientX - last.x) / (t - last.t);
        lastRef.current = { x: e.clientX, t };
      } else if (lockRef.current === "v" && e.pointerType === "mouse") {
        const el = scrollRef.current;
        if (el) el.scrollTop -= dy;
      }
    }
  }

  function endPointer(e: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) {
      if (lockRef.current === "h") {
        // Drop a stale velocity: if the pointer paused before release (last move
        // > 100ms ago) the gesture has already stopped — no fling.
        const last = lastRef.current;
        const fresh = last != null && e.timeStamp - last.t <= 100;
        ctx.endPanWithVelocity(fresh ? velRef.current : 0);
      }
      lockRef.current = null;
      lastRef.current = null;
    }
  }

  /* ── weekend bands ── */
  const { minor } = pickScales(viewport.pxPerMs);
  const weekendsOn = ctx.showWeekendShading && (minor === "hour" || minor === "day");
  const dayBands =
    weekendsOn && bodyWidth > 0
      ? ticks(
          "day",
          viewport.originMs - 86_400_000,
          viewport.originMs + bodyWidth / viewport.pxPerMs,
        ).filter(isWeekend)
      : [];

  const todayLeft = x(viewport, ctx.nowMs);
  const showToday =
    ctx.showTodayLine && todayLeft >= -2 && todayLeft <= bodyWidth + 2;

  function activate(item: TodoItem) {
    ctx.setFocusedId(item.id);
    ctx.select(item.id);
    ctx.onTaskClick?.(item);
  }

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => ctx.onBodyScroll(e.currentTarget.scrollTop)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      style={{ touchAction: disableGestures ? undefined : "pan-y" }}
      className={cn(
        "relative h-full grow overflow-x-hidden overflow-y-auto bg-background",
        !disableGestures && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      <div className="relative" style={{ height: ctx.totalSize, minWidth: "100%" }}>
        {dayBands.map((t) => {
          const left = x(viewport, t);
          const w = x(viewport, addUnit("day", t)) - left;
          return (
            <div
              key={`wk${t}`}
              aria-hidden
              className="absolute inset-y-0 bg-muted/40"
              style={{ left, width: w }}
            />
          );
        })}

        {showToday ? <TodayLine leftPx={todayLeft} /> : null}

        {ctx.renderItems.map((ri) => {
          const row = ctx.rows[ri.index];
          if (!row) return null;
          const item = row.item;
          const selected = ctx.selectedId === item.id;
          const color = ctx.resolveColor(item);
          const geo = ctx.geometryFor(item);
          const priColor = item.priority
            ? ctx.priorityOptions?.find((o) => o.value === item.priority)?.color
            : undefined;

          const enter = (leftPx: number) =>
            setHover({ item, leftPx, topPx: ri.start });
          const leave = () => setHover(null);

          let shape: React.ReactNode = null;
          let labelLeft = 0;

          if (row.isSummary) {
            const span = ctx.summarySpanFor(item);
            if (span) {
              const left = x(viewport, span.startMs);
              const w = x(viewport, span.endMs) - left;
              labelLeft = left + Math.max(w, 8) + 6;
              shape = (
                <SummaryBar
                  leftPx={left}
                  widthPx={w}
                  selected={selected}
                  aria-hidden
                  onClick={() => activate(item)}
                  onMouseEnter={() => enter(left)}
                  onMouseLeave={leave}
                />
              );
            }
          } else if (geo.isMilestone) {
            const left = x(viewport, geo.startMs);
            labelLeft = left + 10;
            shape = (
              <MilestoneDiamond
                leftPx={left}
                fill={color.fill}
                selected={selected}
                aria-hidden
                onClick={() => activate(item)}
                onMouseEnter={() => enter(left)}
                onMouseLeave={leave}
              />
            );
          } else if (geo.endMs != null) {
            const left = x(viewport, geo.startMs);
            const w = x(viewport, geo.endMs) - left;
            labelLeft = left + Math.max(w, 6) + 6;
            shape = (
              <GanttBar
                leftPx={left}
                widthPx={w}
                fill={color.fill}
                rowHeight={ctx.rowHeight}
                overdue={color.isOverdue}
                inactive={!item.active}
                locked={item.locked}
                priorityColor={priColor}
                selected={selected}
                aria-hidden
                onClick={() => activate(item)}
                onMouseEnter={() => enter(left)}
                onMouseLeave={leave}
              />
            );
          }

          return (
            <div
              key={item.id}
              className={cn(
                "absolute inset-x-0 border-b border-border/40",
                selected && "bg-accent/40",
              )}
              style={{ top: ri.start, height: ctx.rowHeight }}
            >
              {shape}
              {labelLeft < bodyWidth + 40 ? (
                <span
                  className={cn(
                    "pointer-events-none absolute top-1/2 max-w-55 -translate-y-1/2 truncate text-xs",
                    row.isSummary ? "font-medium text-foreground" : "text-foreground/85",
                  )}
                  style={{ left: labelLeft }}
                >
                  {item.name}
                </span>
              ) : null}
            </div>
          );
        })}

        {hover ? (
          <div
            className="pointer-events-none absolute z-30 rounded-md border border-border bg-popover p-2.5 text-popover-foreground shadow-md"
            style={{
              left: Math.max(4, Math.min(hover.leftPx, Math.max(4, bodyWidth - 200))),
              top: hover.topPx > 96 ? hover.topPx - 8 : hover.topPx + ctx.rowHeight + 6,
              transform: hover.topPx > 96 ? "translateY(-100%)" : undefined,
            }}
          >
            {ctx.renderTooltip?.(hover.item) ?? (
              <BarTooltip item={hover.item} statusOptions={ctx.statusOptions} />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
