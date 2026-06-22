import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "gantt-timeline-01",
  name: "Gantt Timeline 01",
  category: "data",

  description:
    "Editable project timeline (Gantt) over the canonical TodoItem[] — one bar per task from effective start→end, collapsible WBS summary rows from children, milestone diamonds, a continuous-zoom two-tier axis (hour→quarter), today line, filled status/urgency bars (ramp imported from todo-rich-card), and a pan/swipe/zoom canvas with momentum + pinch. v0.2 adds drag-to-reschedule, edge-resize, draw-to-create, delete, inline rename, gutter reparent (DnD), detail editing via the embedded todo-rich-card, and the shared permission matrix — all opt-in behind `editable` (default off = byte-identical v1 read-only). v0.3 adds group-move: drag a WBS summary bracket to rigidly shift its whole subtree. v0.4 adds an explicit Draw-mode toggle: a deferred-classify gesture model where a press picks its gesture on the first move (click selects, vertical drag scrolls), so empty-row drag pans by default and draws a new task only when Draw is on — resolving the draw-vs-pan conflict; the right-click menu's portaled events no longer leak back into the canvas. Ships as a shadcn-style compound.",
  context:
    "Gantt Timeline is the time-axis sibling of todo-rich-card (cards) and kanban-board-01 (columns): it consumes the SAME canonical TodoItem type and lays it on a horizontal time axis, so a 'Timeline' tab is literally the same task data the List + Board tabs show, on a third surface. v0.2 makes it editable: opt in with `editable` and edits fire todo-rich-card-shaped events + onChange(TodoItem[]) for the controlled consumer to echo (no internal data state). The permission matrix (TodoPermissions) + per-action predicates are reused from todo-rich-card — the gantt is the third consumer after the card and todo-tree. Use it for sprint/cycle planning, delivery roadmaps (collapse to epics), content embargo→sunset schedules, and agent/pipeline run windows. Compound structure: GanttTimelineRoot (headless provider) + flat parts (Toolbar/Axis/Gutter/Body) + Tier-C primitives (GanttBar/SummaryBar/MilestoneDiamond/TodayLine/GutterRow/AxisHeader/BarTooltip/GanttContextMenu) + the GanttTimeline01 assembly. The full-card tooltip and the edit editor lazy-load todo-rich-card, so the default read-only path keeps it out of the bundle.",
  features: [
    "One bar per TodoItem: effectiveStart = startAt ?? setAt; effectiveEnd = expireAt ?? (start + duration); no end ⇒ milestone diamond",
    "Collapsible WBS summary rows from children; summary bar spans min(child start) → max(child end)",
    "Continuous zoom (pixels-per-time) with five named header buckets (hour · day · week · month · quarter) auto-selected with hysteresis; default week",
    "Pan/swipe/zoom canvas: drag-pan with dominant-direction lock + flick momentum + boundary resistance; pinch + ⌘/ctrl-wheel focal-point zoom; +/−/fit toolbar; disableGestures opt-out",
    "Filled bars colored by status tone: done=gray, blocked=red, active=time-urgency ramp (green→red) imported from todo-rich-card; per-item borderColor override; overdue red end-cap",
    "Today 'now' line; SSR-safe first paint (now prop seeds; otherwise deferred to post-mount); colorRefreshIntervalMs tick",
    "Frozen gutter tree: caret + assignee avatar + name + label dots + status badge; row virtualization via @tanstack/react-virtual (gutter mirrors the body scroll)",
    "Read-only interactions: lightweight hover tooltip (renderTooltip override; GanttFullCardTooltip lazy-embeds the full card), click select + onTaskClick, collapse/expand, onViewportChange",
    "WAI-ARIA tree on the gutter: role=tree/treeitem + aria-level/expanded/selected; arrow nav + Home/End + Enter + Space (conflict-free with viewport pan)",
    "Imperative handle: scrollToDate / scrollToItem / scrollToToday / expandAll / collapseAll / setZoom / zoomBy / zoomToFit / addTask / deleteTask / editTask / beginRename",
    "States: empty / loading (GanttTimelineSkeleton) / single / deep-nest / all-milestones / dense; weekend shading (opt-in, day/week zoom)",
    "v0.2 editing (opt-in via `editable`, default off = byte-identical v1): drag-to-reschedule + edge-resize (snap to active unit, Alt = free) + milestone drag, with a live preview ghost",
    "v0.2 CRUD: draw-on-canvas + gutter ＋ create, delete (affordance / Delete key / context-menu), inline rename (double-click / F2), gutter reparent+reorder via @dnd-kit three-zone drops",
    "v0.2 detail editing: right-click context-menu (Edit / Add / Status / Delete) + embedded <TodoRichCard editable> in a lazy overlay; edits fire onItemAdded/Removed/Moved/onFieldEdited/onStatusChanged + onChange(TodoItem[])",
    "v0.2 permissions: reuses todo-rich-card's TodoPermissions matrix (default/byLevel/byItem/inherit) + canMove/Resize/Delete/CreateChild/EditItem predicates + onPermissionDenied; item.locked blocks all; summary bars non-manipulable for single-edit (group-move added in v0.3)",
    "v0.3 group-move: drag a WBS summary bracket → rigidly shift the whole subtree by one snapped delta (Alt = free); atomic permission (summary + every descendant leaf movable, else the drag pans); fires per-leaf onFieldEdited/onTaskReschedule + one onChange; imperative shiftTaskGroup(id, deltaMs)",
    "v0.4 Draw mode: a toolbar Draw toggle (editable only) gates draw-to-create — empty-row drag pans by default (off) and draws a new task only when on, ending the draw-vs-pan conflict; the whole gesture pipeline defers intent to the first move (a press classifies what's under it, then click→select, vertical→scroll, horizontal→resize/move/group-move/draw/pan); right-click menu fix — its portaled pointer/key events no longer bubble back into the canvas and swallow menu-item clicks",
  ],
  tags: [
    "gantt-timeline-01",
    "gantt",
    "timeline",
    "schedule",
    "roadmap",
    "project",
    "wbs",
    "todo",
  ],

  version: "0.4.0",
  status: "alpha",
  createdAt: "2026-06-20",
  updatedAt: "2026-06-22",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [
      "avatar",
      "badge",
      "button",
      "context-menu",
      "input",
      "separator",
      "skeleton",
    ],
    npm: {
      "lucide-react": "^1.11.0",
      "@tanstack/react-virtual": "^3.13.24",
      "@dnd-kit/core": "^6.3.1",
    },
    internal: ["todo-rich-card"],
  },

  related: ["todo-rich-card", "todo-tree", "kanban-board-01"],
};
