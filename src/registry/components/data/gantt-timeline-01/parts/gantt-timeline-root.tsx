"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type {
  GanttColorResolver,
  GanttContextValue,
  GanttTimelineHandle,
  GanttTimelineRootProps,
  TodoItem,
} from "../types";
import {
  dataExtent as computeExtent,
  effStartMs,
  geometryFor as computeGeometry,
  summarySpan,
} from "../lib/geometry";
import { ancestorsOf, flatten, indexById, parentIds } from "../lib/flatten";
import { barFill, resolveRamp, toneFor } from "../lib/color";
import { useColorTick } from "../hooks/use-color-tick";
import { useGanttViewport } from "../hooks/use-gantt-viewport";
import { useGanttVirtual } from "../hooks/use-gantt-virtual";
import { useGanttEdit } from "../hooks/use-gantt-edit";
import { GanttContext } from "../hooks/use-gantt-context";
import { GanttEditPopover } from "./gantt-edit-popover";
import { GanttQuickComposer } from "./gantt-quick-composer";
import {
  readTasksFromClipboardEvent,
  writeTasksToClipboardEvent,
} from "../../todo-rich-card/lib/clipboard";

export const GanttTimelineRoot = forwardRef<
  GanttTimelineHandle,
  GanttTimelineRootProps
>(function GanttTimelineRoot(props, ref) {
  const {
    data,
    statusOptions,
    priorityOptions,
    labelOptions,
    colorRamp,
    colorRefreshIntervalMs = 60_000,
    zoom,
    defaultZoom = "week",
    onZoomChange,
    minZoom = "hour",
    maxZoom = "quarter",
    onViewportChange,
    disableGestures = false,
    range,
    now,
    rowHeight = 36,
    gutterWidth = 280,
    showWeekendShading = false,
    defaultCollapsedIds,
    collapsedIds,
    onCollapsedChange,
    selectedId,
    onSelect,
    onTaskClick,
    renderTooltip,
    // editing (v0.2.0)
    editable = false,
    onChange,
    snap = "minor",
    quickCompose = true,
    renderQuickComposer,
    onTaskReschedule,
    onItemAdded,
    onItemRemoved,
    onItemMoved,
    onFieldEdited,
    onStatusChanged,
    permissions,
    canMoveItem,
    canResizeItem,
    canDeleteItem,
    canCreateChild,
    canEditItem,
    onPermissionDenied,
    className,
    children,
  } = props;
  const ariaLabel = props["aria-label"];

  /* ── now (SSR-safe) ── */
  const tick = useColorTick(colorRefreshIntervalMs);
  const [clientNow, setClientNow] = useState<number | null>(null);
  useEffect(() => {
    if (now == null) setClientNow(Date.now());
  }, [now, tick]);
  const resolvedNow = now != null ? (typeof now === "function" ? now() : now) : null;

  const extent = useMemo(() => computeExtent(data), [data]);
  const nowMs =
    resolvedNow != null ? resolvedNow.getTime() : clientNow ?? extent.startMs;
  const showTodayLine = resolvedNow != null || clientNow != null;

  /* ── collapse (controlled / uncontrolled) ── */
  const collapseControlled = collapsedIds != null;
  const [internalCollapsed, setInternalCollapsed] = useState<Set<string>>(
    () => new Set(defaultCollapsedIds ?? []),
  );
  const collapsedSet = useMemo(
    () => (collapseControlled ? new Set(collapsedIds) : internalCollapsed),
    [collapseControlled, collapsedIds, internalCollapsed],
  );
  const setCollapsed = useCallback(
    (next: Set<string>) => {
      if (!collapseControlled) setInternalCollapsed(next);
      onCollapsedChange?.([...next]);
    },
    [collapseControlled, onCollapsedChange],
  );
  const isCollapsed = useCallback((id: string) => collapsedSet.has(id), [collapsedSet]);
  const toggleCollapse = useCallback(
    (id: string) => {
      const next = new Set(collapsedSet);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setCollapsed(next);
    },
    [collapsedSet, setCollapsed],
  );

  /* ── selection (controlled / uncontrolled) ── */
  const selControlled = selectedId !== undefined;
  const [internalSel, setInternalSel] = useState<string | null>(null);
  const selectedVal = selControlled ? selectedId ?? null : internalSel;
  const select = useCallback(
    (id: string | null) => {
      if (!selControlled) setInternalSel(id);
      onSelect?.(id);
    },
    [selControlled, onSelect],
  );

  const [focusedId, setFocusedId] = useState<string | null>(null);

  /* ── draw mode (v0.4.0) — empty-row drag draws vs pans; toolbar-toggled ── */
  const [drawMode, setDrawMode] = useState(false);

  /* ── rows + virtualization ── */
  const rows = useMemo(() => flatten(data, (id) => collapsedSet.has(id)), [data, collapsedSet]);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const itemIndex = useMemo(() => indexById(data), [data]);

  const bodyScrollRef = useRef<HTMLDivElement | null>(null);
  const gutterTrackRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { renderItems, totalSize } = useGanttVirtual({
    count: rows.length,
    scrollRef: bodyScrollRef,
    rowHeight,
  });

  const [bodyWidth, setBodyWidth] = useState(0);

  /* ── viewport ── */
  const vp = useGanttViewport({
    dataExtent: extent,
    bodyWidth,
    defaultZoom,
    controlledZoom: zoom,
    onZoomChange,
    minZoom,
    maxZoom,
    onViewportChange,
    range,
    nowMs,
  });

  /* ── color + geometry closures ── */
  const ramp = useMemo(() => resolveRamp(colorRamp), [colorRamp]);
  const geometryFor = useCallback(
    (item: TodoItem) => computeGeometry(item, nowMs, toneFor(item, statusOptions)),
    [nowMs, statusOptions],
  );
  const resolveColor = useCallback<GanttColorResolver>(
    (item) => {
      const { fill, tone } = barFill(item, nowMs, ramp, statusOptions);
      return { fill, tone, isOverdue: geometryFor(item).isOverdue };
    },
    [nowMs, ramp, statusOptions, geometryFor],
  );
  const summarySpanFor = useCallback(
    (item: TodoItem) => summarySpan(item),
    [],
  );

  /* ── editing (v0.2.0) — controlled-echo dispatchers + edit-UI targets ── */
  const edit = useGanttEdit({
    data,
    editable,
    snap,
    statusOptions,
    onChange,
    onTaskReschedule,
    onItemAdded,
    onItemRemoved,
    onItemMoved,
    onFieldEdited,
    onStatusChanged,
    permissions,
    canMoveItem,
    canResizeItem,
    canDeleteItem,
    canCreateChild,
    canEditItem,
    onPermissionDenied,
  });

  // Stable locals for the clipboard-effect deps (`edit` is a fresh object each
  // render; its state fields + useCallback dispatchers are the real dependencies).
  const {
    editingId: editEditingId,
    renamingId: editRenamingId,
    composerTarget: editComposerTarget,
    deleteItem: editDeleteItem,
    nodeInfo: editNodeInfo,
    pasteTasks: editPasteTasks,
  } = edit;

  /* ── cross-surface clipboard (v0.5.0) — copy/cut/paste TodoItems through the OS
        clipboard (shared ilinxa/task envelope; foreign text ignored). Document-level
        so it fires regardless of the focused element; gated on the gantt containing
        focus, skipped over text inputs + while an editor/rename/composer is up. ── */
  useEffect(() => {
    if (!editable) return;
    const owns = () => {
      const active = document.activeElement;
      return !!rootRef.current && !!active && rootRef.current.contains(active);
    };
    const overText = () => {
      const el = document.activeElement as HTMLElement | null;
      return (
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.isContentEditable === true
      );
    };
    const busy = () =>
      editEditingId != null ||
      editRenamingId != null ||
      editComposerTarget != null;
    const targetId = (): string | null => selectedVal ?? focusedId;
    const onCopy = (e: ClipboardEvent) => {
      if (!owns() || overText() || busy()) return;
      const id = targetId();
      const item = id ? itemIndex.get(id) : undefined;
      if (!item) return;
      writeTasksToClipboardEvent(e, [item], "gantt-timeline-01");
      e.preventDefault();
    };
    const onCut = (e: ClipboardEvent) => {
      if (!owns() || overText() || busy()) return;
      const id = targetId();
      const item = id ? itemIndex.get(id) : undefined;
      if (!item) return;
      writeTasksToClipboardEvent(e, [item], "gantt-timeline-01");
      editDeleteItem(item.id);
      e.preventDefault();
    };
    const onPaste = (e: ClipboardEvent) => {
      if (!owns() || overText() || busy()) return;
      const items = readTasksFromClipboardEvent(e);
      if (!items) return;
      // Paste as a sibling of the target (root if none); dates preserved.
      const id = targetId();
      const info = id ? editNodeInfo(id) : undefined;
      editPasteTasks(
        items,
        info?.parentId ?? null,
        info ? info.index + 1 : undefined,
      );
      e.preventDefault();
    };
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
    };
  }, [
    editable,
    editEditingId,
    editRenamingId,
    editComposerTarget,
    editDeleteItem,
    editNodeInfo,
    editPasteTasks,
    selectedVal,
    focusedId,
    itemIndex,
  ]);

  /* ── vertical scroll sync (body drives, gutter mirrors) ── */
  const onBodyScroll = useCallback((scrollTop: number) => {
    if (gutterTrackRef.current) {
      gutterTrackRef.current.style.transform = `translateY(${-scrollTop}px)`;
    }
  }, []);

  /* ── scroll-to-item (expand ancestors, then center) ── */
  const scrollToItemId = useCallback(
    (id: string) => {
      const anc = ancestorsOf(data, id);
      if (anc.length) {
        const next = new Set(collapsedSet);
        anc.forEach((a) => next.delete(a));
        setCollapsed(next);
      }
      const item = itemIndex.get(id);
      if (item) vp.scrollToMs(effStartMs(item));
      requestAnimationFrame(() => {
        const idx = rowsRef.current.findIndex((r) => r.item.id === id);
        const el = bodyScrollRef.current;
        if (idx >= 0 && el) {
          el.scrollTop = Math.max(
            0,
            idx * rowHeight - el.clientHeight / 2 + rowHeight / 2,
          );
        }
      });
    },
    [data, collapsedSet, setCollapsed, itemIndex, vp, rowHeight],
  );

  /* ── imperative handle ── */
  useImperativeHandle(
    ref,
    () => ({
      scrollToDate: (d) => vp.scrollToMs(Date.parse(d)),
      scrollToItem: (id) => scrollToItemId(id),
      scrollToToday: () => vp.scrollToToday(),
      expandAll: () => setCollapsed(new Set()),
      collapseAll: () => setCollapsed(new Set(parentIds(data))),
      setZoom: (z) => vp.setZoomLevel(z),
      zoomBy: (f) => vp.zoomBy(f),
      zoomToFit: () => vp.zoomToFit(),
      addTask: (parentId, item) => edit.createItem(parentId, item),
      deleteTask: (id) => edit.deleteItem(id),
      editTask: (id) => edit.openEditor(id),
      beginRename: (id) => edit.beginRename(id),
      shiftTaskGroup: (id, deltaMs) => edit.moveSubtree(id, deltaMs),
    }),
    [vp, scrollToItemId, setCollapsed, data, edit],
  );

  const ctx: GanttContextValue = {
    rows,
    renderItems,
    totalSize,
    rowHeight,
    gutterWidth,
    bodyScrollRef,
    gutterTrackRef,
    onBodyScroll,
    measureRows: () => {},
    viewport: vp.viewport,
    bodyWidth,
    setBodyWidth,
    dataExtent: extent,
    disableGestures,
    onPan: vp.onPan,
    onZoomAt: vp.onZoomAt,
    beginPan: vp.beginPan,
    endPanWithVelocity: vp.endPanWithVelocity,
    namedZoom: vp.namedZoom,
    setZoomLevel: vp.setZoomLevel,
    zoomBy: vp.zoomBy,
    zoomToFit: vp.zoomToFit,
    scrollToToday: vp.scrollToToday,
    scrollToItemId,
    pageBy: vp.pageBy,
    nowMs,
    showTodayLine,
    resolveColor,
    geometryFor,
    summarySpanFor,
    statusOptions,
    priorityOptions,
    labelOptions,
    showWeekendShading,
    isCollapsed,
    toggleCollapse,
    selectedId: selectedVal,
    select,
    onTaskClick,
    renderTooltip,
    focusedId,
    setFocusedId,

    // editing (v0.2.0)
    editable,
    snap,
    drawMode,
    setDrawMode,
    permissions,
    getItem: (id: string) => itemIndex.get(id),
    can: edit.can,
    canGroupMove: edit.canGroupMove,
    nodeInfo: edit.nodeInfo,
    rescheduleItem: edit.rescheduleItem,
    createItem: edit.createItem,
    deleteItem: edit.deleteItem,
    renameItemAction: edit.renameItemAction,
    moveItemAction: edit.moveItemAction,
    moveSubtree: edit.moveSubtree,
    changeStatus: edit.changeStatus,
    changePriority: edit.changePriority,
    editingId: edit.editingId,
    openEditor: edit.openEditor,
    closeEditor: edit.closeEditor,
    applyEditedSubtree: edit.applyEditedSubtree,
    renamingId: edit.renamingId,
    beginRename: edit.beginRename,
    endRename: edit.endRename,
    // quick-create composer (v0.5.0)
    quickCompose,
    renderQuickComposer,
    composerTarget: edit.composerTarget,
    openComposer: edit.openComposer,
    closeComposer: edit.closeComposer,
    // cross-surface clipboard (v0.5.0)
    copyItem: edit.copyItem,
    cutItem: edit.cutItem,
    pasteTasks: edit.pasteTasks,
  };

  return (
    <GanttContext.Provider value={ctx}>
      <div
        ref={rootRef}
        role="group"
        aria-label={ariaLabel ?? "Gantt timeline"}
        className={cn("text-foreground", className)}
      >
        {children}
      </div>
      {editable ? <GanttEditPopover /> : null}
      {editable ? <GanttQuickComposer /> : null}
    </GanttContext.Provider>
  );
});
