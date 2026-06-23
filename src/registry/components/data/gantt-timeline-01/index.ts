// Assembly (Tier A)
export { GanttTimeline01 } from "./gantt-timeline-01";

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

// Public types (+ the consumed todo-rich-card data language, re-exported)
export type {
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
  TodoItem,
  TodoPerson,
  TodoStatusOption,
  TodoPriorityOption,
  TodoLabelOption,
  TodoColorRamp,
  TodoPermissions,
  TodoPermissionRule,
  TodoItemAddedEvent,
  TodoItemRemovedEvent,
  TodoItemMovedEvent,
  TodoFieldEditedEvent,
  TodoStatusChangedEvent,
} from "./types";
