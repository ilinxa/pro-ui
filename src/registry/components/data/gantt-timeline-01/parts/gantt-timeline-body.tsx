"use client";

/* eslint-disable react-hooks/refs -- bodyScrollRef is bundled on the context value;
   the React Compiler's refs rule false-positives on reads taken off a context object
   (see blackboard-01). Ref reads here are confined to effects + ref= props. */

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cn } from "@/lib/utils";
import { useGanttTimeline } from "../hooks/use-gantt-context";
import type { GanttSnap, GanttTimeUnit, GanttViewport, TodoItem } from "../types";
import {
  MS,
  addUnit,
  isWeekend,
  pickScales,
  ticks,
  timeAt,
  x,
} from "../lib/time-scale";
import {
  BarTooltip,
  GanttBar,
  MilestoneDiamond,
  SummaryBar,
  TodayLine,
} from "./gantt-bars";
import { GanttContextMenu } from "./gantt-context-menu";

type HoverState = { item: TodoItem; leftPx: number; topPx: number };

type EditDrag =
  | {
      kind: "move";
      id: string;
      origStart: number;
      origEnd: number | null;
      grabMs: number;
      curStart: number;
      curEnd: number | null;
      topPx: number;
    }
  | {
      kind: "resize";
      id: string;
      edge: "start" | "end";
      origStart: number;
      origEnd: number;
      curStart: number;
      curEnd: number;
      topPx: number;
    }
  | {
      kind: "create";
      parentId: string | null;
      index: number;
      fromMs: number;
      toMs: number;
      topPx: number;
    };

const MIN_MS = 60_000;

function snapUnitMs(snap: GanttSnap, minor: GanttTimeUnit): number {
  if (snap === "off") return 0;
  if (typeof snap === "number") return snap;
  const unit = snap === "minor" ? minor : snap;
  switch (unit) {
    case "hour":
      return MS.hour;
    case "day":
      return MS.day;
    case "week":
      return MS.week;
    case "month":
      return 2_629_800_000;
    case "quarter":
      return 7_889_400_000;
    default:
      return MS.day;
  }
}

function snapTo(t: number, unit: number): number {
  return unit > 0 ? Math.round(t / unit) * unit : t;
}

const iso = (ms: number) => new Date(ms).toISOString();

export function GanttTimelineBody({ className }: { className?: string }) {
  const ctx = useGanttTimeline();
  const scrollRef = ctx.bodyScrollRef;
  const { viewport, bodyWidth, editable } = ctx;

  const [hover, setHover] = useState<HoverState | null>(null);
  const [editDrag, setEditDrag] = useState<EditDrag | null>(null);
  const editDragRef = useRef<EditDrag | null>(null);
  const snapUnitRef = useRef(0);

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

  /* ── wheel (non-passive) ── */
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
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scrollRef, disableGestures, onZoomAt, onPan]);

  /* ── pan/pinch gestures (v1) ── */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lockRef = useRef<null | "h" | "v">(null);
  const pinchRef = useRef<number | null>(null);
  const velRef = useRef(0);
  const lastRef = useRef<{ x: number; t: number } | null>(null);

  const { minor } = pickScales(viewport.pxPerMs);

  /** Time under the pointer (body-relative x). */
  function timeAtPointer(clientX: number, el: HTMLElement): number {
    const rect = el.getBoundingClientRect();
    return timeAt(viewport, clientX - rect.left);
  }

  /** Vertical offset (= ri.start) of an item's row — robust vs DOM nesting. */
  function rowTopOf(id: string): number {
    const ri = ctx.renderItems.find((r) => ctx.rows[r.index]?.item.id === id);
    return ri?.start ?? 0;
  }

  /* ── edit gesture: hit-test BEFORE pan (only when editable) ── */
  function tryStartEdit(e: PointerEvent<HTMLDivElement>): boolean {
    if (!editable) return false;
    const target = e.target as HTMLElement;
    const surface = e.currentTarget;
    const tMs = timeAtPointer(e.clientX, surface);
    snapUnitRef.current = e.altKey ? 0 : snapUnitMs(ctx.snap, minor);

    const barEl = target.closest<HTMLElement>("[data-itemid]");
    if (barEl) {
      const id = barEl.dataset.itemid!;
      const item = ctx.rows.find((r) => r.item.id === id)?.item;
      if (!item) return false;
      const geo = ctx.geometryFor(item);
      const edge = (target.closest<HTMLElement>("[data-edge]")?.dataset.edge ??
        null) as "start" | "end" | null;
      const topPx = rowTopOf(id);
      if (edge && geo.endMs != null && ctx.can("resize", item)) {
        const drag: EditDrag = {
          kind: "resize",
          id,
          edge,
          origStart: geo.startMs,
          origEnd: geo.endMs,
          curStart: geo.startMs,
          curEnd: geo.endMs,
          topPx,
        };
        editDragRef.current = drag;
        setEditDrag(drag);
        e.currentTarget.setPointerCapture(e.pointerId);
        return true;
      }
      if (ctx.can("move", item)) {
        const drag: EditDrag = {
          kind: "move",
          id,
          origStart: geo.startMs,
          origEnd: geo.endMs,
          grabMs: tMs,
          curStart: geo.startMs,
          curEnd: geo.endMs,
          topPx,
        };
        editDragRef.current = drag;
        setEditDrag(drag);
        e.currentTarget.setPointerCapture(e.pointerId);
        return true;
      }
      return false;
    }

    // empty row area → draw-create a sibling of that row's item.
    // Summary (parent) rows are read-only (their bar is derived from children),
    // so dragging on a bracket pans the canvas instead of spawning a stray task.
    const rowEl = target.closest<HTMLElement>("[data-rowid]");
    if (rowEl) {
      const rowId = rowEl.dataset.rowid!;
      if (ctx.rows.find((r) => r.item.id === rowId)?.isSummary) return false;
      const info = ctx.nodeInfo(rowId);
      const snapped = snapTo(tMs, snapUnitRef.current);
      const drag: EditDrag = {
        kind: "create",
        parentId: info?.parentId ?? null,
        index: (info?.index ?? 0) + 1,
        fromMs: snapped,
        toMs: snapped,
        topPx: rowTopOf(rowId),
      };
      editDragRef.current = drag;
      setEditDrag(drag);
      e.currentTarget.setPointerCapture(e.pointerId);
      return true;
    }
    return false;
  }

  function moveEdit(e: PointerEvent<HTMLDivElement>) {
    const d = editDragRef.current;
    if (!d) return;
    const tMs = timeAtPointer(e.clientX, e.currentTarget);
    const u = snapUnitRef.current;
    let nextDrag: EditDrag;
    if (d.kind === "move") {
      const delta = tMs - d.grabMs;
      const newStart = snapTo(d.origStart + delta, u);
      const shift = newStart - d.origStart;
      nextDrag = {
        ...d,
        curStart: newStart,
        curEnd: d.origEnd != null ? d.origEnd + shift : null,
      };
    } else if (d.kind === "resize") {
      if (d.edge === "start") {
        const ns = Math.min(snapTo(tMs, u), d.origEnd - MIN_MS);
        nextDrag = { ...d, curStart: ns, curEnd: d.origEnd };
      } else {
        const ne = Math.max(snapTo(tMs, u), d.origStart + MIN_MS);
        nextDrag = { ...d, curStart: d.origStart, curEnd: ne };
      }
    } else {
      nextDrag = { ...d, toMs: snapTo(tMs, u) };
    }
    editDragRef.current = nextDrag;
    setEditDrag(nextDrag);
  }

  function commitEdit() {
    const d = editDragRef.current;
    editDragRef.current = null;
    setEditDrag(null);
    if (!d) return;
    if (d.kind === "create") {
      const a = Math.min(d.fromMs, d.toMs);
      const b = Math.max(d.fromMs, d.toMs);
      if (b - a < MIN_MS) return; // a click, not a draw
      ctx.createItem(
        d.parentId,
        { startAt: iso(a), expireAt: iso(b), setAt: iso(a), name: "New task" },
        d.index,
      );
      return;
    }
    const item = ctx.rows.find((r) => r.item.id === d.id)?.item;
    if (!item) return;
    const expireDriven = item.expireAt != null;
    if (d.kind === "move") {
      if (d.curStart === d.origStart) return;
      const patch =
        expireDriven && d.curEnd != null
          ? { startAt: iso(d.curStart), expireAt: iso(d.curEnd) }
          : { startAt: iso(d.curStart) };
      ctx.rescheduleItem(d.id, patch, "move");
    } else {
      if (d.curStart === d.origStart && d.curEnd === d.origEnd) return;
      if (d.edge === "start") {
        const patch = expireDriven
          ? { startAt: iso(d.curStart) }
          : { startAt: iso(d.curStart), duration: d.origEnd - d.curStart };
        ctx.rescheduleItem(d.id, patch, "resize");
      } else {
        const patch = expireDriven
          ? { expireAt: iso(d.curEnd) }
          : { duration: d.curEnd - d.origStart };
        ctx.rescheduleItem(d.id, patch, "resize");
      }
    }
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (disableGestures) return;
    if (e.button === 2) return; // right-click → context menu, not a gesture
    if (tryStartEdit(e)) return;
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
    if (editDragRef.current) {
      moveEdit(e);
      return;
    }
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
        if (last && t > last.t)
          velRef.current = (e.clientX - last.x) / (t - last.t);
        lastRef.current = { x: e.clientX, t };
      } else if (lockRef.current === "v" && e.pointerType === "mouse") {
        const el = scrollRef.current;
        if (el) el.scrollTop -= dy;
      }
    }
  }

  function endPointer(e: PointerEvent<HTMLDivElement>) {
    if (editDragRef.current) {
      commitEdit();
      return;
    }
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) {
      if (lockRef.current === "h") {
        const last = lastRef.current;
        const fresh = last != null && e.timeStamp - last.t <= 100;
        ctx.endPanWithVelocity(fresh ? velRef.current : 0);
      }
      lockRef.current = null;
      lastRef.current = null;
    }
  }

  /* ── keyboard editing (body-focused + a selected item) ── */
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!editable || !ctx.selectedId) return;
    const item = ctx.rows.find((r) => r.item.id === ctx.selectedId)?.item;
    if (!item) return;
    const u = snapUnitMs(ctx.snap, minor) || MS.day;
    const geo = ctx.geometryFor(item);
    const expireDriven = item.expireAt != null;
    switch (e.key) {
      case "Delete":
      case "Backspace":
        e.preventDefault();
        ctx.deleteItem(item.id);
        break;
      case "Enter":
        e.preventDefault();
        ctx.openEditor(item.id);
        break;
      case "ArrowLeft":
      case "ArrowRight": {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        if (e.shiftKey && geo.endMs != null) {
          const ne = Math.max(geo.startMs + MIN_MS, geo.endMs + dir * u);
          ctx.rescheduleItem(
            item.id,
            expireDriven
              ? { expireAt: iso(ne) }
              : { duration: ne - geo.startMs },
            "resize",
          );
        } else {
          const ns = geo.startMs + dir * u;
          ctx.rescheduleItem(
            item.id,
            expireDriven && geo.endMs != null
              ? { startAt: iso(ns), expireAt: iso(geo.endMs + dir * u) }
              : { startAt: iso(ns) },
            "move",
          );
        }
        break;
      }
      default:
        break;
    }
  }

  /* ── weekend bands ── */
  const weekendsOn =
    ctx.showWeekendShading && (minor === "hour" || minor === "day");
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
    scrollRef.current?.focus();
  }

  return (
    <div
      ref={scrollRef}
      tabIndex={editable ? 0 : undefined}
      onScroll={(e) => ctx.onBodyScroll(e.currentTarget.scrollTop)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onKeyDown={onKeyDown}
      style={{ touchAction: disableGestures ? undefined : "pan-y" }}
      className={cn(
        "relative h-full grow overflow-x-hidden overflow-y-auto bg-background outline-none",
        !disableGestures && !editDrag && "cursor-grab active:cursor-grabbing",
        editDrag?.kind === "create" && "cursor-crosshair",
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
          const movable = editable && ctx.can("move", item);
          const resizable = editable && ctx.can("resize", item);

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
                data-itemid={item.id}
                leftPx={left}
                fill={color.fill}
                selected={selected}
                movable={movable}
                aria-hidden
                onClick={() => activate(item)}
                onDoubleClick={() => editable && ctx.openEditor(item.id)}
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
                data-itemid={item.id}
                leftPx={left}
                widthPx={w}
                fill={color.fill}
                rowHeight={ctx.rowHeight}
                overdue={color.isOverdue}
                inactive={!item.active}
                locked={item.locked}
                priorityColor={priColor}
                selected={selected}
                movable={movable}
                resizable={resizable}
                aria-hidden
                onClick={() => activate(item)}
                onDoubleClick={() => editable && ctx.openEditor(item.id)}
                onMouseEnter={() => enter(left)}
                onMouseLeave={leave}
              />
            );
          }

          const rowInner = (
            <div
              data-rowid={item.id}
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
                    row.isSummary
                      ? "font-medium text-foreground"
                      : "text-foreground/85",
                  )}
                  style={{ left: labelLeft }}
                >
                  {item.name}
                </span>
              ) : null}
            </div>
          );

          return editable && !row.isSummary ? (
            <GanttContextMenu key={item.id} item={item}>
              {rowInner}
            </GanttContextMenu>
          ) : (
            <div key={item.id}>{rowInner}</div>
          );
        })}

        {/* edit drag preview */}
        {editDrag ? (
          <EditPreview
            drag={editDrag}
            viewport={viewport}
            rowHeight={ctx.rowHeight}
          />
        ) : null}

        {hover && !editDrag ? (
          <div
            className="pointer-events-none absolute z-30 rounded-md border border-border bg-popover p-2.5 text-popover-foreground shadow-md"
            style={{
              left: Math.max(
                4,
                Math.min(hover.leftPx, Math.max(4, bodyWidth - 200)),
              ),
              top:
                hover.topPx > 96 ? hover.topPx - 8 : hover.topPx + ctx.rowHeight + 6,
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

function EditPreview({
  drag,
  viewport,
  rowHeight,
}: {
  drag: EditDrag;
  viewport: GanttViewport;
  rowHeight: number;
}) {
  let left: number;
  let width: number;
  let label: string;
  if (drag.kind === "create") {
    const a = Math.min(drag.fromMs, drag.toMs);
    const b = Math.max(drag.fromMs, drag.toMs);
    left = x(viewport, a);
    width = Math.max(x(viewport, b) - left, 2);
    label = `${new Date(a).toLocaleDateString()} → ${new Date(b).toLocaleDateString()}`;
  } else {
    const start = drag.curStart;
    const end = drag.curEnd ?? drag.curStart;
    left = x(viewport, start);
    width = Math.max(x(viewport, end) - left, 6);
    label =
      drag.curEnd == null
        ? new Date(start).toLocaleDateString()
        : `${new Date(start).toLocaleDateString()} → ${new Date(end).toLocaleDateString()}`;
  }
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-40"
      style={{ top: drag.topPx, height: rowHeight }}
    >
      <div
        className="absolute top-1/2 h-5 -translate-y-1/2 rounded-[5px] border-2 border-primary bg-primary/20"
        style={{ left, width }}
      />
      <span
        className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] leading-none text-primary-foreground"
        style={{ left: left + width + 6 }}
      >
        {label}
      </span>
    </div>
  );
}
