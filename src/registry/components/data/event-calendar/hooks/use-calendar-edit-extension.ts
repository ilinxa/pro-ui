"use client";

/**
 * The editing injection seam (P3 feature-slicing, strategy-b). BASE owns this
 * file — the extension TYPE, the context, and the optional accessor — and
 * NEVER statically imports anything under `../features/editing/`. The editing
 * feature (`@ilinxa/event-calendar-editing`) supplies the `CalendarEditExtension`
 * value (a `Provider`) that a consumer passes via `CalendarProps.editing`;
 * `EventCalendarRoot` mounts that Provider (only when `editable` too) around
 * its children, which is what makes `CalendarEditContext` resolve non-null
 * for every base part below it. Base parts read the surface via
 * `useCalendarEditOptional()` and render `edit ? <editable-ui> : <read-only-ui>`
 * — so a base-only install (no `editing` prop, or the feature package absent)
 * compiles and renders fully read-only, byte-identical to v1.
 *
 * Dependency-light by design (react + local `../types` only) — this file ships
 * with the BASE artifact, so it must never pull `@dnd-kit/*` or any feature code.
 */

import { createContext, useContext } from "react";
import type {
  ComponentType,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from "react";
import type {
  CalendarComposerTarget,
  CalendarEditAction,
  CalendarOccurrence,
  CalendarQuickComposerRenderer,
  CalendarSnap,
  TaskFieldEditedEvent,
  TaskItem,
  TaskItemAddedEvent,
  TaskItemMovedEvent,
  TaskItemRemovedEvent,
  TaskLabelOption,
  TaskPermissionReason,
  TaskPermissionRule,
  TaskPermissions,
  TaskPriorityOption,
  TaskStatusChangedEvent,
  TaskStatusOption,
} from "../types";

/* ───────── component prop contracts (structural — the feature's real
   implementations must conform; base call sites typecheck against these) ───────── */

export type DraggableEventWrapProps = {
  occ: CalendarOccurrence;
  canDrag: boolean;
  resizable: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  cols: Date[];
  children: ReactNode;
};

export type DroppableDayCellProps = {
  day: Date;
  outside: boolean;
  today: boolean;
  hidden: number;
  hiddenItems: CalendarOccurrence[];
  onShowMore?: (d: Date, items: TaskItem[]) => void;
};

export type EventEditorPanelProps = {
  item: TaskItem;
  statusOptions?: TaskStatusOption[];
  priorityOptions?: TaskPriorityOption[];
  labelOptions?: TaskLabelOption[];
  permissions?: TaskPermissions;
  onChange: (next: TaskItem) => void;
  onDone: () => void;
  className?: string;
};

/** Native-pointer time-grid gestures, pre-parameterized by the Provider (snap +
 *  the live dispatchers are closed over) — base call sites pass only the
 *  per-invocation event + refs. */
export type CalendarGestures = {
  /** Pointer-down on a timed block → drag-move (continuous time grid). */
  startTimedMove: (
    e: ReactPointerEvent,
    occ: CalendarOccurrence,
    gridRef: RefObject<HTMLDivElement | null>,
    columns: Date[],
    suppressClick: RefObject<boolean>,
    gestureCleanup: RefObject<(() => void) | null>,
  ) => void;
  /** Pointer-down on a timed block's edge grip → resize. */
  startTimedResize: (
    e: ReactPointerEvent,
    occ: CalendarOccurrence,
    edge: "start" | "end",
    colRef: RefObject<HTMLDivElement | null>,
    dayStartMs: number,
    gestureCleanup: RefObject<(() => void) | null>,
  ) => void;
  /** Pointer-down + drag across empty time-grid space → create-by-drag. */
  startDraw: (
    e: ReactPointerEvent,
    colRef: RefObject<HTMLDivElement | null>,
    dayStartMs: number,
    gestureCleanup: RefObject<(() => void) | null>,
  ) => void;
  /** Double-click empty time-grid space → create a default 1h event. */
  createAtDoubleClick: (
    e: ReactMouseEvent,
    colRef: RefObject<HTMLDivElement | null>,
    dayStartMs: number,
  ) => void;
};

/* ───────── the full edit-surface context value (feature-supplied) ───────── */

export type CalendarEditContextValue = {
  editable: boolean;
  snap: CalendarSnap;
  quickCompose: boolean;
  permissions?: TaskPermissions;

  getItem: (id: string) => TaskItem | undefined;
  can: (action: CalendarEditAction, item: TaskItem) => boolean;

  // dispatchers (mirror the pre-split `use-calendar-edit` surface)
  rescheduleItem: (
    id: string,
    patch: { startMs?: number; endMs?: number; allDay: boolean },
    kind: "move" | "resize",
  ) => void;
  createItem: (
    parentId: string | null,
    seed: Partial<TaskItem> | undefined,
    window: { startMs: number; endMs?: number; allDay: boolean },
    opts?: { openEditor?: boolean },
  ) => void;
  deleteItem: (id: string) => void;
  renameItemAction: (id: string, name: string) => void;
  changeStatus: (id: string, status: string) => void;
  changePriority: (id: string, priority: string) => void;
  applyEditedSubtree: (next: TaskItem) => void;

  // transient edit UI
  editingId: string | null;
  openEditor: (id: string) => void;
  closeEditor: () => void;
  renamingId: string | null;
  beginRename: (id: string) => void;
  endRename: () => void;
  composerTarget: CalendarComposerTarget | null;
  openComposer: (target: CalendarComposerTarget) => void;
  closeComposer: () => void;

  /** Live drag/resize preview geometry (mid-gesture); commit happens on release. */
  resizePreview: { id: string; startMs: number; endMs: number } | null;
  setResizePreview: (
    p: { id: string; startMs: number; endMs: number } | null,
  ) => void;

  // external drop-in + composer override (pass-through props)
  onExternalDrop?: (date: Date, allDay: boolean, data: DataTransfer) => void;
  renderQuickComposer?: CalendarQuickComposerRenderer;

  /** Component refs base parts render through instead of static imports. */
  components: {
    DraggableEventWrap: ComponentType<DraggableEventWrapProps>;
    DroppableDayCell: ComponentType<DroppableDayCellProps>;
    BandDropCell: ComponentType<{ day: Date }>;
    EventContextMenu: ComponentType<{ item: TaskItem; children: ReactNode }>;
    EditOverlays: ComponentType<Record<string, never>>;
    RenameField: ComponentType<Record<string, never>>;
    QuickComposer: ComponentType<Record<string, never>>;
    EventEditorPanel: ComponentType<EventEditorPanelProps>;
  };

  /** Pre-parameterized native-pointer time-grid gestures. */
  gestures: CalendarGestures;

  /** Event-focused keyboard editing (arrows move/resize, Enter edit, F2
   *  rename, Delete). Returns true when it consumed the key. */
  handleEventKey: (e: KeyboardEvent<HTMLDivElement>, id: string) => boolean;
  /** Enter on a focused, empty day cell → open the quick-composer there. */
  handleDayEnterKey: (dayMs: number) => void;

  /** The `CalendarHandle` editing methods (imperative ref surface). */
  handleMethods: {
    addTask: (date: Date, item?: Partial<TaskItem>) => void;
    deleteTask: (itemId: string) => void;
    editTask: (itemId: string) => void;
    beginRename: (itemId: string) => void;
    openQuickComposer: (date: Date, allDay?: boolean) => void;
  };
};

/** The edit-prop subset `EventCalendarRoot` collects from `CalendarProps` and
 *  hands to the extension's `Provider` — plus the shared root DOM ref (the
 *  clipboard + focus-restore effects need to know when focus is inside the
 *  calendar). `data` travels here too: the base context only exposes derived
 *  `occurrences`, never the raw forest the edit mutations operate on. */
export type CalendarEditProps = {
  data: TaskItem[];
  editable: boolean;
  onChange?: (data: TaskItem[]) => void;
  onTaskReschedule?: (next: {
    itemId: string;
    startAt: string;
    expireAt?: string;
  }) => void;
  onItemAdded?: (event: TaskItemAddedEvent) => void;
  onItemRemoved?: (event: TaskItemRemovedEvent) => void;
  onItemMoved?: (event: TaskItemMovedEvent) => void;
  onFieldEdited?: (event: TaskFieldEditedEvent) => void;
  onStatusChanged?: (event: TaskStatusChangedEvent) => void;
  permissions?: TaskPermissions;
  canMoveItem?: (id: string) => boolean;
  canResizeItem?: (id: string) => boolean;
  canDeleteItem?: (id: string) => boolean;
  canCreateChild?: (id: string) => boolean;
  canEditItem?: (id: string) => boolean;
  onPermissionDenied?: (
    action: keyof TaskPermissionRule,
    itemId: string,
    reason: TaskPermissionReason,
  ) => void;
  snap: CalendarSnap;
  quickCompose: boolean;
  onExternalDrop?: (date: Date, allDay: boolean, data: DataTransfer) => void;
  renderQuickComposer?: CalendarQuickComposerRenderer;
  /** The calendar's root DOM node (clipboard-owns / focus-restore target). */
  rootRef: RefObject<HTMLDivElement | null>;
};

/** The injection surface itself — what a consumer passes as `CalendarProps.editing`. */
export type CalendarEditExtension = {
  Provider: ComponentType<{ editProps: CalendarEditProps; children: ReactNode }>;
};

/* ───────── context + accessors ───────── */

export const CalendarEditContext =
  createContext<CalendarEditContextValue | null>(null);

/** Read the edit surface, or `null` when no editing extension is wired (base-
 *  only install, or `editable` is false). Base parts branch on this — never
 *  throw, so a base-only bundle renders fully read-only. */
export function useCalendarEditOptional(): CalendarEditContextValue | null {
  return useContext(CalendarEditContext);
}

/** Required variant for editing-feature-internal files — they only ever
 *  render inside the extension's own `Provider`, so a null context here is a
 *  wiring bug, not a valid read-only state. */
export function useCalendarEditContext(): CalendarEditContextValue {
  const ctx = useContext(CalendarEditContext);
  if (!ctx) {
    throw new Error(
      "useCalendarEditContext must be used within the event-calendar editing extension's <Provider>",
    );
  }
  return ctx;
}
