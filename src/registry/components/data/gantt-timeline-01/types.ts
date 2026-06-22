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
  TodoPermissions,
  TodoPermissionRule,
  TodoPermissionReason,
  TodoItemAddedEvent,
  TodoItemRemovedEvent,
  TodoItemMovedEvent,
  TodoFieldEditedEvent,
  TodoStatusChangedEvent,
} from "../todo-rich-card";

// Re-export the consumed data + editing language (v0.2.0) so a consumer importing
// the gantt gets the item, option, permission, and event types without a second
// import (same-category barrel import; rewriter-safe).
export type {
  TodoItem,
  TodoPerson,
  TodoStatusOption,
  TodoPriorityOption,
  TodoLabelOption,
  TodoColorRamp,
  TodoPermissions,
  TodoPermissionRule,
  TodoPermissionReason,
  TodoItemAddedEvent,
  TodoItemRemovedEvent,
  TodoItemMovedEvent,
  TodoFieldEditedEvent,
  TodoStatusChangedEvent,
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

/* ───────── editing (v0.2.0) ───────── */

/** Snap granularity for drag / resize / create; default `"minor"` (active axis unit). */
export type GanttSnap = "minor" | "hour" | "day" | "week" | "off" | number;

/** The edit actions the permission matrix gates. */
export type GanttEditAction =
  | "move"
  | "resize"
  | "delete"
  | "create"
  | "editDetails";

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
  /** 1-based position among same-parent siblings (for `aria-posinset`). */
  posInSet: number;
  /** Sibling count under the same parent (for `aria-setsize`). */
  setSize: number;
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

  // ── Editing (v0.2.0) — all opt-in; default surface is the v1 read-only Gantt ──
  /** Master switch. Default false → byte-identical v1 read-only behavior. */
  editable?: boolean;
  /** The full mutated forest after ANY edit; controlled consumer echoes into `data`. */
  onChange?: (data: TodoItem[]) => void;
  /** Snap granularity for drags/resizes/create; default "minor"; Alt = free-drag. */
  snap?: GanttSnap;

  /** Bar move/resize sugar — kept from v1; fires alongside onChange/onFieldEdited. */
  onTaskReschedule?: (next: {
    itemId: string;
    startAt: string;
    expireAt?: string;
  }) => void;

  // CRUD + field events (shapes reused from todo-rich-card)
  onItemAdded?: (event: TodoItemAddedEvent) => void;
  onItemRemoved?: (event: TodoItemRemovedEvent) => void;
  onItemMoved?: (event: TodoItemMovedEvent) => void;
  onFieldEdited?: (event: TodoFieldEditedEvent) => void;
  onStatusChanged?: (event: TodoStatusChangedEvent) => void;

  // Permissions (reused from todo-rich-card; mirrors todo-tree)
  permissions?: TodoPermissions;
  canMoveItem?: (id: string) => boolean;
  canResizeItem?: (id: string) => boolean;
  canDeleteItem?: (id: string) => boolean;
  canCreateChild?: (id: string) => boolean;
  canEditItem?: (id: string) => boolean;
  onPermissionDenied?: (
    action: keyof TodoPermissionRule,
    itemId: string,
    reason: TodoPermissionReason,
  ) => void;

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

  // Editing (v0.2.0) — no-ops when `editable` is false / permission denied.
  /** Create a task under `parentId` (null = root); a partial seeds the rest. */
  addTask(parentId: string | null, item?: Partial<TodoItem>): void;
  deleteTask(itemId: string): void;
  /** Open the detail editor (embedded card) for an item. */
  editTask(itemId: string): void;
  /** Start inline rename of a gutter row. */
  beginRename(itemId: string): void;
  /**
   * v0.3.0 — group-move a summary's whole subtree by `deltaMs` (signed epoch-ms).
   * No-op unless `editable` and the group is movable (summary + every leaf).
   */
  shiftTaskGroup(summaryId: string, deltaMs: number): void;
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

  // ── editing (v0.2.0) — always present; dispatchers are no-ops when !editable ──
  editable: boolean;
  snap: GanttSnap;
  /**
   * v0.4.0 — draw mode. When true, dragging a task row's empty area draws a new
   * bar; when false (default) that drag pans the dates. Toolbar-toggled; only
   * meaningful while `editable`.
   */
  drawMode: boolean;
  setDrawMode: (on: boolean) => void;
  /** The raw permission matrix (threaded into the embedded edit card). */
  permissions?: TodoPermissions;
  /** Look up any item in the forest by id (incl. collapsed). */
  getItem: (id: string) => TodoItem | undefined;
  /** Effective permission for an action on an item (matrix + can* predicate + locked). */
  can: (action: GanttEditAction, item: TodoItem) => boolean;
  /**
   * v0.3.0 — can this summary's whole subtree be group-moved? Atomic: the summary
   * must be movable AND every descendant leaf must pass `can("move")`. Drives both
   * the bracket-drag gate and the grab cursor.
   */
  canGroupMove: (item: TodoItem) => boolean;
  /** parentId / index / level lookup over the current forest. */
  nodeInfo: (
    id: string,
  ) => { parentId: string | null; index: number; level: number } | undefined;

  // mutation dispatchers — compute the next forest, fire the typed event + onChange
  rescheduleItem: (
    id: string,
    patch: { startAt?: string; expireAt?: string; duration?: number },
    kind: "move" | "resize",
  ) => void;
  createItem: (
    parentId: string | null,
    seed?: Partial<TodoItem>,
    index?: number,
  ) => void;
  deleteItem: (id: string) => void;
  renameItemAction: (id: string, name: string) => void;
  moveItemAction: (
    id: string,
    newParentId: string | null,
    newIndex: number,
  ) => void;
  /** v0.3.0 — group-move: shift a summary's whole subtree by `deltaMs` (atomic-gated). */
  moveSubtree: (id: string, deltaMs: number) => void;
  changeStatus: (id: string, status: string) => void;

  // detail editor (popover) target
  editingId: string | null;
  openEditor: (id: string) => void;
  closeEditor: () => void;
  /** Splice an edited subtree (same root id) back into the forest. */
  applyEditedSubtree: (next: TodoItem) => void;

  // inline rename (gutter) target
  renamingId: string | null;
  beginRename: (id: string) => void;
  endRename: () => void;
};
