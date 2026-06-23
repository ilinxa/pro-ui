"use client";

/* eslint-disable react-hooks/refs -- bodyScrollRef is bundled on the context value;
   the React Compiler's refs rule false-positives on reads taken off a context object
   (see blackboard-01). Ref reads here are confined to effects + ref= props. */

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
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
  startOfUnit,
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
    }
  | {
      // v0.3.0 — group-move: rigidly shift a summary's whole subtree by deltaMs.
      kind: "groupmove";
      id: string;
      grabMs: number;
      deltaMs: number;
      spanStart: number;
      spanEnd: number;
      topPx: number;
    };

const MIN_MS = 60_000;
const DRAG_THRESHOLD = 4; // px the pointer must travel before a press becomes a gesture
const EDGE_PX = 8; // resize hot-zone at each bar edge (needs a center move zone to coexist)

/** What sits under a press — classified once on pointerdown, acted on in `resolvePending`. */
type Candidate =
  | { kind: "summary"; id: string }
  | { kind: "barEdge"; id: string; edge: "start" | "end" }
  | { kind: "barBody"; id: string }
  | { kind: "emptyRow"; rowId: string; parentId: string | null; index: number }
  | { kind: "void" };

/** A deferred press: nothing has committed yet; intent is resolved on the first move. */
type Pending = {
  pointerId: number;
  x0: number;
  y0: number;
  ms0: number;
  candidate: Candidate;
};

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

/**
 * The calendar unit a snap setting resolves to, or null when snapping is off /
 * a fixed-ms grid. A named unit snaps to real calendar boundaries (matching the
 * axis ticks); `"minor"` follows the current minor unit (which can be month or
 * quarter when zoomed out — where average-ms rounding visibly drifts off-grid).
 */
function snapCalUnit(snap: GanttSnap, minor: GanttTimeUnit): GanttTimeUnit | null {
  if (snap === "off" || typeof snap === "number") return null;
  return snap === "minor" ? minor : snap;
}

/**
 * Snap `t` to the nearest boundary. A calendar `unit` lands on a real
 * start-of-unit (so a snapped edge lines up with a gridline the axis drew);
 * otherwise a positive `ms` grid rounds to the nearest multiple (numeric snap),
 * and `ms <= 0` with no unit means snapping is off.
 */
function snapPos(t: number, ms: number, unit: GanttTimeUnit | null): number {
  if (unit) {
    const lo = startOfUnit(unit, t);
    const hi = addUnit(unit, lo);
    return t - lo <= hi - t ? lo : hi;
  }
  return ms > 0 ? Math.round(t / ms) * ms : t;
}

const iso = (ms: number) => new Date(ms).toISOString();

export function GanttTimelineBody({ className }: { className?: string }) {
  const ctx = useGanttTimeline();
  const scrollRef = ctx.bodyScrollRef;
  const { viewport, bodyWidth, editable } = ctx;

  const [hover, setHover] = useState<HoverState | null>(null);
  const [editDrag, setEditDrag] = useState<EditDrag | null>(null);
  const editDragRef = useRef<EditDrag | null>(null);
  const pendingRef = useRef<Pending | null>(null);
  const snapUnitRef = useRef(0);
  const snapCalRef = useRef<GanttTimeUnit | null>(null);

  /* ── measure width ── */
  const setBodyWidth = ctx.setBodyWidth;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setBodyWidth(el.clientWidth);
    update();
    // Coalesce observer callbacks into one rAF. We observe the same element we
    // resize, so a vertical-scrollbar appearance shrinks clientWidth → relayout →
    // re-fire; the rAF gate settles that in a single frame instead of tripping
    // the "ResizeObserver loop completed" warning.
    let raf = 0;
    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    });
    ro.observe(el);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [scrollRef, setBodyWidth]);

  /* ── wheel (non-passive) ── */
  const { onZoomAt, onPan, disableGestures } = ctx;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || disableGestures) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setHover(null); // the bar moves under the frozen tooltip x — drop it
        const rect = el.getBoundingClientRect();
        onZoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left);
      } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        setHover(null);
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

  /* ── press classification (deferred; the gesture is chosen on the first move) ── */

  /**
   * Which edge of a bar (if any) the press is near — by PIXEL proximity to the
   * bar's geometric edges, not a DOM `[data-edge]` hit. A center move zone must
   * remain, so a narrow bar exposes no resize edges (it moves as a whole) instead
   * of being all-handle with no body to grab. Milestones / non-finite geometry
   * have no edges.
   */
  function edgeAt(
    e: PointerEvent<HTMLDivElement>,
    item: TodoItem,
  ): "start" | "end" | null {
    const geo = ctx.geometryFor(item);
    if (geo.endMs == null) return null;
    if (!Number.isFinite(geo.startMs) || !Number.isFinite(geo.endMs)) return null;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const left = x(viewport, geo.startMs);
    const right = x(viewport, geo.endMs);
    if (right - left < EDGE_PX * 3) return null; // too narrow → whole-bar move
    if (px - left <= EDGE_PX) return "start";
    if (right - px <= EDGE_PX) return "end";
    return null;
  }

  /**
   * Classify what's under a press WITHOUT starting anything. The gesture is chosen
   * later in `resolvePending`, once the drag direction is known — so a click (no
   * movement) selects, a vertical drag scrolls, and neither is hijacked into an
   * edit. Read-only, or anything not movable/resizable, classifies as `void` → pan.
   */
  function classifyTarget(e: PointerEvent<HTMLDivElement>): Candidate {
    if (!editable) return { kind: "void" };
    const target = e.target as HTMLElement;

    // summary bracket → group-move when the whole subtree is movable; else pan.
    const summaryEl = target.closest<HTMLElement>("[data-summaryid]");
    if (summaryEl) {
      const sid = summaryEl.dataset.summaryid!;
      const sitem = ctx.getItem(sid);
      if (sitem && ctx.canGroupMove(sitem) && ctx.summarySpanFor(sitem)) {
        return { kind: "summary", id: sid };
      }
      return { kind: "void" };
    }

    // bar → resize (near a wide-enough edge) or move; else pan.
    const barEl = target.closest<HTMLElement>("[data-itemid]");
    if (barEl) {
      const id = barEl.dataset.itemid!;
      const item = ctx.rows.find((r) => r.item.id === id)?.item;
      if (item) {
        const edge = edgeAt(e, item);
        if (edge && ctx.can("resize", item)) return { kind: "barEdge", id, edge };
        if (ctx.can("move", item)) return { kind: "barBody", id };
      }
      return { kind: "void" };
    }

    // empty row area → draw a sibling, but ONLY in draw mode; otherwise pan.
    // Summary rows are derived (read-only), so they always pan.
    if (ctx.drawMode) {
      const rowEl = target.closest<HTMLElement>("[data-rowid]");
      if (rowEl) {
        const rowId = rowEl.dataset.rowid!;
        const row = ctx.rows.find((r) => r.item.id === rowId);
        if (row && !row.isSummary) {
          const info = ctx.nodeInfo(rowId);
          return {
            kind: "emptyRow",
            rowId,
            parentId: info?.parentId ?? null,
            index: (info?.index ?? 0) + 1,
          };
        }
      }
    }
    return { kind: "void" };
  }

  function moveEdit(e: PointerEvent<HTMLDivElement>) {
    const d = editDragRef.current;
    if (!d) return;
    const tMs = timeAtPointer(e.clientX, e.currentTarget);
    const u = snapUnitRef.current;
    const cu = snapCalRef.current;
    let nextDrag: EditDrag;
    if (d.kind === "move") {
      const delta = tMs - d.grabMs;
      const newStart = snapPos(d.origStart + delta, u, cu);
      const shift = newStart - d.origStart;
      nextDrag = {
        ...d,
        curStart: newStart,
        curEnd: d.origEnd != null ? d.origEnd + shift : null,
      };
    } else if (d.kind === "resize") {
      if (d.edge === "start") {
        const ns = Math.min(snapPos(tMs, u, cu), d.origEnd - MIN_MS);
        nextDrag = { ...d, curStart: ns, curEnd: d.origEnd };
      } else {
        const ne = Math.max(snapPos(tMs, u, cu), d.origStart + MIN_MS);
        nextDrag = { ...d, curStart: d.origStart, curEnd: ne };
      }
    } else if (d.kind === "groupmove") {
      // Snap the leading edge of the span; delta is the realized shift.
      const newStart = snapPos(d.spanStart + (tMs - d.grabMs), u, cu);
      nextDrag = { ...d, deltaMs: newStart - d.spanStart };
    } else {
      nextDrag = { ...d, toMs: snapPos(tMs, u, cu) };
    }
    editDragRef.current = nextDrag;
    setEditDrag(nextDrag);
  }

  function commitEdit() {
    const d = editDragRef.current;
    editDragRef.current = null;
    setEditDrag(null);
    if (!d) return;
    if (d.kind === "groupmove") {
      if (d.deltaMs !== 0) ctx.moveSubtree(d.id, d.deltaMs);
      return;
    }
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

  function startDrag(d: EditDrag) {
    editDragRef.current = d;
    setEditDrag(d);
  }

  /**
   * First significant move after a press picks exactly one gesture. Vertical-dominant
   * → scroll the list (edit gestures are all horizontal-intent). Horizontal-dominant
   * → the candidate decides: resize / move / group-move / draw, or pan for `void`.
   * Below the threshold the press stays pending, so a click just selects.
   */
  function resolvePending(e: PointerEvent<HTMLDivElement>) {
    const p = pendingRef.current;
    if (!p || p.pointerId !== e.pointerId) return;
    const dx = e.clientX - p.x0;
    const dy = e.clientY - p.y0;
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    pendingRef.current = null;

    // Vertical-dominant → scroll (works over bars and empty space alike).
    if (Math.abs(dy) > Math.abs(dx)) {
      lockRef.current = "v";
      lastRef.current = { x: e.clientX, t: e.timeStamp };
      return;
    }

    const c = p.candidate;
    if (c.kind === "barEdge") {
      const item = ctx.rows.find((r) => r.item.id === c.id)?.item;
      const geo = item ? ctx.geometryFor(item) : null;
      if (geo && geo.endMs != null) {
        startDrag({
          kind: "resize",
          id: c.id,
          edge: c.edge,
          origStart: geo.startMs,
          origEnd: geo.endMs,
          curStart: geo.startMs,
          curEnd: geo.endMs,
          topPx: rowTopOf(c.id),
        });
        return;
      }
    } else if (c.kind === "barBody") {
      const item = ctx.rows.find((r) => r.item.id === c.id)?.item;
      if (item) {
        const geo = ctx.geometryFor(item);
        startDrag({
          kind: "move",
          id: c.id,
          origStart: geo.startMs,
          origEnd: geo.endMs,
          grabMs: p.ms0,
          curStart: geo.startMs,
          curEnd: geo.endMs,
          topPx: rowTopOf(c.id),
        });
        return;
      }
    } else if (c.kind === "summary") {
      const sitem = ctx.getItem(c.id);
      const span = sitem ? ctx.summarySpanFor(sitem) : null;
      if (span) {
        startDrag({
          kind: "groupmove",
          id: c.id,
          grabMs: p.ms0,
          deltaMs: 0,
          spanStart: span.startMs,
          spanEnd: span.endMs,
          topPx: rowTopOf(c.id),
        });
        return;
      }
    } else if (c.kind === "emptyRow") {
      const snapped = snapPos(p.ms0, snapUnitRef.current, snapCalRef.current);
      startDrag({
        kind: "create",
        parentId: c.parentId,
        index: c.index,
        fromMs: snapped,
        toMs: snapped,
        topPx: rowTopOf(c.rowId),
      });
      return;
    }

    // void (or any fall-through) → horizontal pan.
    ctx.beginPan();
    lockRef.current = "h";
    lastRef.current = { x: e.clientX, t: e.timeStamp };
    velRef.current = 0;
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    // The context-menu content is portaled to document.body but is still a React
    // child of this scroll surface, so its pointer events bubble here through the
    // React tree. Ignore any event whose real target isn't a DOM descendant of
    // this surface, else a menu-item click would start a gesture here and swallow
    // the item's own pointerup (the "menu opens but items do nothing" bug).
    if (!e.currentTarget.contains(e.target as Node)) return;
    if (disableGestures) return;
    if (e.button === 2) return; // right-click → context menu, not a gesture

    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setHover(null);
    ctx.beginPan(); // touching the canvas halts any momentum fling

    if (pointers.current.size === 2) {
      // second finger → pinch-zoom; abandon any pending or in-flight single gesture
      pendingRef.current = null;
      if (editDragRef.current) {
        editDragRef.current = null;
        setEditDrag(null);
      }
      const [a, b] = [...pointers.current.values()];
      pinchRef.current = Math.hypot(a.x - b.x, a.y - b.y);
      lockRef.current = null;
      return;
    }

    // Single pointer → DEFER. Capture snap settings + classify what's under the
    // press; the gesture itself is chosen on the first move (`resolvePending`).
    snapUnitRef.current = e.altKey ? 0 : snapUnitMs(ctx.snap, minor);
    snapCalRef.current = e.altKey ? null : snapCalUnit(ctx.snap, minor);
    pendingRef.current = {
      pointerId: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      ms0: timeAtPointer(e.clientX, e.currentTarget),
      candidate: classifyTarget(e),
    };
    lockRef.current = null;
    lastRef.current = null;
    velRef.current = 0;
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (editDragRef.current) {
      moveEdit(e);
      return;
    }
    if (disableGestures) return;

    // pinch-zoom (two active pointers)
    if (pointers.current.size >= 2 && pinchRef.current != null) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 0 && pinchRef.current > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        onZoomAt(dist / pinchRef.current, (a.x + b.x) / 2 - rect.left);
      }
      pinchRef.current = dist;
      return;
    }

    // a press is still pending → update its position and try to resolve intent
    if (pendingRef.current && pendingRef.current.pointerId === e.pointerId) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      resolvePending(e);
      return;
    }

    // resolved pan / vertical-scroll
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
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

  function endPointer(e: PointerEvent<HTMLDivElement>) {
    const wasEdit = editDragRef.current != null;
    if (wasEdit) commitEdit();
    pendingRef.current = null; // never crossed threshold → a click; onClick handles select

    if (pointers.current.has(e.pointerId)) pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;

    if (!wasEdit && pointers.current.size === 0 && lockRef.current === "h") {
      const last = lastRef.current;
      const fresh = last != null && e.timeStamp - last.t <= 100;
      ctx.endPanWithVelocity(fresh ? velRef.current : 0);
    }
    if (pointers.current.size === 0) {
      lockRef.current = null;
      lastRef.current = null;
    }
  }

  /* ── keyboard editing (body-focused + a selected item) ── */
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    // Ignore keys bubbling from the portaled context menu (see onPointerDown) so
    // menu navigation/select doesn't double-trigger body reschedule/delete/open.
    if (!e.currentTarget.contains(e.target as Node)) return;
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
        if (
          !Number.isFinite(geo.startMs) ||
          (geo.endMs != null && !Number.isFinite(geo.endMs))
        )
          break; // unparseable date — skip keyboard reschedule (Delete/Enter still work)
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

  /**
   * v0.5.0 — double-click an empty row area → quick-create a sibling task at that
   * time. A double-click ON a bar/summary opens the editor (handled on the shape),
   * so ignore those targets here. Independent of draw mode (draw = drag a span).
   */
  function onDoubleClick(e: MouseEvent<HTMLDivElement>) {
    if (!editable) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-itemid]") || target.closest("[data-summaryid]"))
      return;
    const rowEl = target.closest<HTMLElement>("[data-rowid]");
    if (!rowEl) return;
    const rowId = rowEl.dataset.rowid!;
    const row = ctx.rows.find((r) => r.item.id === rowId);
    if (!row || row.isSummary) return;
    const info = ctx.nodeInfo(rowId);
    const startMs = snapPos(
      timeAtPointer(e.clientX, e.currentTarget),
      snapUnitMs(ctx.snap, minor),
      snapCalUnit(ctx.snap, minor),
    );
    const span = snapUnitMs(ctx.snap, minor) || MS.day;
    const composerTarget = {
      startMs,
      endMs: startMs + span,
      parentId: info?.parentId ?? null,
      index: (info?.index ?? 0) + 1,
      x: e.clientX,
      y: e.clientY,
    };
    if (ctx.quickCompose) {
      ctx.openComposer(composerTarget);
    } else {
      ctx.createItem(
        composerTarget.parentId,
        {
          name: "New task",
          startAt: iso(startMs),
          expireAt: iso(startMs + span),
          setAt: iso(startMs),
        },
        composerTarget.index,
        { openEditor: true },
      );
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
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      style={{ touchAction: disableGestures ? undefined : "pan-y" }}
      className={cn(
        "relative h-full grow overflow-x-hidden overflow-y-auto bg-background outline-none",
        !disableGestures &&
          !editDrag &&
          !(editable && ctx.drawMode) &&
          "cursor-grab active:cursor-grabbing",
        (editDrag?.kind === "create" || (editable && ctx.drawMode)) &&
          "cursor-crosshair",
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

          // A bad/unparseable date yields NaN geometry. Render no shape (the row
          // label still shows) so we never position a bar at NaN→origin or throw
          // on a later edit-commit. Summary rows use summarySpan, which is NaN-safe.
          const geoOk =
            Number.isFinite(geo.startMs) &&
            (geo.endMs == null || Number.isFinite(geo.endMs));

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
                  data-summaryid={item.id}
                  leftPx={left}
                  widthPx={w}
                  selected={selected}
                  groupMovable={editable && ctx.canGroupMove(item)}
                  aria-hidden
                  onClick={() => activate(item)}
                  onMouseEnter={() => enter(left)}
                  onMouseLeave={leave}
                />
              );
            }
          } else if (!geoOk) {
            // unparseable date — label-only row, no draggable bar (see geoOk note)
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
  } else if (drag.kind === "groupmove") {
    const s = drag.spanStart + drag.deltaMs;
    const e = drag.spanEnd + drag.deltaMs;
    left = x(viewport, s);
    width = Math.max(x(viewport, e) - left, 8);
    label = `${new Date(s).toLocaleDateString()} → ${new Date(e).toLocaleDateString()}`;
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
