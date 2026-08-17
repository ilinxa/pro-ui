// Assembly (Tier A)
export { GanttTimeline } from "./gantt-timeline";

// Headless provider + context parts (Tier B) — flat exports, never a namespace
export { GanttTimelineRoot } from "./parts/gantt-timeline-root";
export { GanttTimelineToolbar } from "./parts/gantt-timeline-toolbar";
export { GanttTimelineAxis } from "./parts/gantt-timeline-axis";
export { GanttTimelineGutter } from "./parts/gantt-timeline-gutter";
export { GanttTimelineBody } from "./parts/gantt-timeline-body";

// Standalone primitives (Tier C)
export {
  GanttBar,
  SummaryBar,
  MilestoneDiamond,
  TodayLine,
  BarTooltip,
} from "./parts/gantt-bars";
export { AxisHeader } from "./parts/gantt-timeline-axis";
export { GutterRow } from "./parts/gantt-timeline-gutter";
export { GanttTimelineSkeleton } from "./parts/gantt-timeline-skeleton";
export { GanttFullCardTooltip } from "./parts/bar-tooltip-full";

// Editing (v0.2.0)
export { GanttContextMenu } from "./parts/gantt-context-menu";
export { GanttEditPopover } from "./parts/gantt-edit-popover";
// Quick-create composer (v0.5.0)
export { GanttQuickComposer } from "./parts/gantt-quick-composer";

// Hook
export { useGanttTimeline } from "./hooks/use-gantt-context";

// Public types (+ the consumed task-card data language, re-exported)
export type {
  // `useGanttTimeline()` is exported above and returns GanttContextValue;
  // GanttRenderItem is the element type of its `renderItems`. Both were
  // unreachable from this barrel (validate:barrel-exports, 2026-08-17) —
  // "internal" in types.ts means "constructed by the Root", not "private".
  GanttContextValue,
  GanttRenderItem,
  GanttTimelineProps,
  GanttTimelineRootProps,
  GanttTimelineHandle,
  GanttZoom,
  GanttTimeUnit,
  GanttViewport,
  GanttRow,
  GanttBarGeometry,
  GanttBarColor,
  GanttColorResolver,
  GanttTooltipRenderer,
  GanttStatusTone,
  GanttSnap,
  GanttEditAction,
  GanttComposerTarget,
  GanttQuickComposerRenderer,
  TaskItem,
  TaskPerson,
  TaskStatusOption,
  TaskPriorityOption,
  TaskLabelOption,
  TaskColorRamp,
  TaskPermissions,
  TaskPermissionRule,
  TaskItemAddedEvent,
  TaskItemRemovedEvent,
  TaskItemMovedEvent,
  TaskFieldEditedEvent,
  TaskStatusChangedEvent,
} from "./types";
