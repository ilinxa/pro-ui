/**
 * Public + internal types for the gantt-timeline-01 pro-component.
 *
 * v0.1.0 surface — read-only, fully-navigable project timeline over the
 * canonical `TodoItem[]`. Bars from effective start→end, WBS summary rows from
 * `children`, milestone diamonds, continuous-zoom two-tier axis, pan/swipe/zoom
 * canvas, filled status/urgency bars (ramp imported from todo-rich-card).
 *
 * Architecture: shadcn-style compound (Root provider + flat parts + Tier-C
 * primitives + assembly). State model architected so v2 drag-to-reschedule
 * drops in additively. See docs/procomps/gantt-timeline-01-procomp/.
 */

import type { ReactNode, RefObject } from "react";
import type {
  TodoItem,
  TodoPerson,
  TodoStatusOption,
  TodoPriorityOption,
  TodoLabelOption,
  TodoColorRamp,
} from "../todo-rich-card";

// Re-export the consumed data language so a consumer importing the gantt gets
// the item + option types without a second import (same-category, rewriter-safe).
export type {
  TodoItem,
  TodoPerson,
  TodoStatusOption,
  TodoPriorityOption,
  TodoLabelOption,
  TodoColorRamp,
};

/* ───────── zoom + time ───────── */

export type GanttZoom = "hour" | "day" | "week" | "month" | "quarter";

export type GanttTimeUnit =
  | "hour"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year";

/** Linear map epoch-ms → x-pixels: `x(t) = (t - originMs) * pxPerMs`. */
export type GanttViewport = { originMs: number; pxPerMs: number };

export type GanttStatusTone = "active" | "done" | "blocked";

/* ───────── derived row + geometry ───────── */

/** A flattened, currently-visible row (respects collapse). */
export type GanttRow = {
  item: TodoItem;
  /** 0 = top-level. */
  depth: number;
  parentId: string | null;
  hasChildren: boolean;
  /** A parent renders a summary bar. */
  isSummary: boolean;
  collapsed: boolean;
};

/** Resolved bar geometry for one item. `endMs === null` ⇒ milestone. */
export type GanttBarGeometry = {
  startMs: number;
  endMs: number | null;
  isMilestone: boolean;
  isOverdue: boolean;
};

/** Resolved fill for a bar. */
export type GanttBarColor = {
  fill: string;
  tone: GanttStatusTone;
  isOverdue: boolean;
};

export type GanttColorResolver = (item: TodoItem) => GanttBarColor;

export type GanttTooltipRenderer = (item: TodoItem) => ReactNode;

/* ───────── component props ───────── */

export type GanttTimelineProps = {
  /** The tasks to lay out. The canonical `TodoItem[]` the card/tree render. */
  data: TodoItem[];

  // Color + label language (shared with todo-rich-card)
  statusOptions?: TodoStatusOption[];
  priorityOptions?: TodoPriorityOption[];
  labelOptions?: TodoLabelOption[];
  /** Same urgency ramp the card uses; default `"default"`. */
  colorRamp?: TodoColorRamp;
  /** ms; default 60_000; 0 disables the refresh tick. */
  colorRefreshIntervalMs?: number;

  // Time axis (continuous zoom; named levels are header-scale buckets)
  zoom?: GanttZoom; // controlled (nearest named level)
  defaultZoom?: GanttZoom; // uncontrolled (default "week")
  onZoomChange?: (zoom: GanttZoom) => void;
  /** Clamp the continuous zoom; default span hour…quarter. */
  minZoom?: GanttZoom;
  maxZoom?: GanttZoom;
  /** Fires (rAF-throttled) when the viewport pans/zooms. */
  onViewportChange?: (window: { from: string; to: string }) => void;
  /** Opt out of gesture nav; +/−/fit buttons + keyboard still work. */
  disableGestures?: boolean;
  /** Initial visible window; defaults to fit-all-bars + padding. */
  range?: { from: string; to: string };
  /** Frozen clock for SSR/testing; drives the "now" line + urgency. */
  now?: Date | (() => Date);

  // Layout
  rowHeight?: number; // px; default 36
  gutterWidth?: number; // px; default 280
  showWeekendShading?: boolean; // default false
  showToolbar?: boolean; // assembly toggle; default true

  // Collapse (UI-only)
  defaultCollapsedIds?: string[];
  collapsedIds?: string[]; // controlled
  onCollapsedChange?: (ids: string[]) => void;

  // Read-only interactions
  selectedId?: string | null;
  onSelect?: (itemId: string | null) => void;
  onTaskClick?: (item: TodoItem) => void;
  /** Override the hover tooltip; default = lightweight summary. */
  renderTooltip?: GanttTooltipRenderer;

  /** @reserved v2 — fires when a bar is dragged/resized to a new window. NOT wired in v1. */
  onTaskReschedule?: (next: {
    itemId: string;
    startAt: string;
    expireAt?: string;
  }) => void;

  className?: string;
  "aria-label"?: string;
};

/** Headless provider props = assembly props minus the assembly-only toggle. */
export type GanttTimelineRootProps = Omit<GanttTimelineProps, "showToolbar"> & {
  children: ReactNode;
};

/* ───────── imperative handle ───────── */

export type GanttTimelineHandle = {
  scrollToDate(date: string): void;
  scrollToItem(itemId: string): void;
  scrollToToday(): void;
  expandAll(): void;
  collapseAll(): void;
  setZoom(zoom: GanttZoom): void;
  /** Multiply the continuous zoom (focal = viewport center). */
  zoomBy(factor: number): void;
  /** Frame all bars + padding. */
  zoomToFit(): void;
};

/* ───────── context (internal; constructed in the Root) ───────── */

/** One render slot — either a virtualizer item or a plain row offset. */
export type GanttRenderItem = { index: number; start: number };

export type GanttContextValue = {
  // data + rows
  rows: GanttRow[];
  renderItems: GanttRenderItem[];
  totalSize: number;
  rowHeight: number;
  gutterWidth: number;

  // scroll refs / vertical sync
  bodyScrollRef: RefObject<HTMLDivElement | null>;
  gutterTrackRef: RefObject<HTMLDivElement | null>;
  onBodyScroll: (scrollTop: number) => void;
  measureRows: () => void;

  // viewport + scale
  viewport: GanttViewport;
  bodyWidth: number;
  setBodyWidth: (w: number) => void;
  dataExtent: { startMs: number; endMs: number };

  // gestures
  disableGestures: boolean;
  onPan: (deltaPx: number) => void;
  onZoomAt: (factor: number, focalPx: number) => void;
  beginPan: () => void;
  endPanWithVelocity: (velocityPxPerMs: number) => void;

  // zoom helpers / named
  namedZoom: GanttZoom;
  setZoomLevel: (z: GanttZoom) => void;
  zoomBy: (factor: number) => void;
  zoomToFit: () => void;
  scrollToToday: () => void;
  scrollToItemId: (id: string) => void;
  pageBy: (dir: -1 | 1) => void;

  // color + time + geometry
  nowMs: number;
  showTodayLine: boolean;
  resolveColor: GanttColorResolver;
  geometryFor: (item: TodoItem) => GanttBarGeometry;
  summarySpanFor: (item: TodoItem) => { startMs: number; endMs: number } | null;

  // display config
  statusOptions?: TodoStatusOption[];
  priorityOptions?: TodoPriorityOption[];
  labelOptions?: TodoLabelOption[];
  showWeekendShading: boolean;

  // collapse + selection + focus
  isCollapsed: (id: string) => boolean;
  toggleCollapse: (id: string) => void;
  selectedId: string | null;
  select: (id: string | null) => void;
  onTaskClick?: (item: TodoItem) => void;
  renderTooltip?: GanttTooltipRenderer;
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
};
