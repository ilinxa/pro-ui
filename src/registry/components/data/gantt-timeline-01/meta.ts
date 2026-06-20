import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "gantt-timeline-01",
  name: "Gantt Timeline 01",
  category: "data",

  description:
    "Read-only project timeline (Gantt) over the canonical TodoItem[] — one bar per task from effective start→end, collapsible WBS summary rows from children, milestone diamonds, a continuous-zoom two-tier axis (hour→quarter), today line, filled status/urgency bars (ramp imported from todo-rich-card), and a pan/swipe/zoom canvas with momentum + pinch. Ships as a shadcn-style compound.",
  context:
    "Gantt Timeline is the time-axis sibling of todo-rich-card (cards) and kanban-board-01 (columns): it consumes the SAME canonical TodoItem type and lays it on a horizontal time axis, so a 'Timeline' tab is literally the same task data the List + Board tabs show, on a third surface. v1 is read-only display + navigation (no drag-to-reschedule — that's v2; the state model is architected so it drops in additively). Use it for sprint/cycle planning, delivery roadmaps (collapse to epics), content embargo→sunset schedules, and agent/pipeline run windows. Compound structure: GanttTimelineRoot (headless provider) + flat parts (Toolbar/Axis/Gutter/Body) + Tier-C primitives (GanttBar/SummaryBar/MilestoneDiamond/TodayLine/GutterRow/AxisHeader/BarTooltip) + the GanttTimeline01 assembly. The full-card tooltip path (GanttFullCardTooltip) lazy-loads todo-rich-card, so the default lightweight tooltip keeps it out of the bundle.",
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
    "Imperative handle: scrollToDate / scrollToItem / scrollToToday / expandAll / collapseAll / setZoom / zoomBy / zoomToFit",
    "States: empty / loading (GanttTimelineSkeleton) / single / deep-nest / all-milestones / dense; weekend shading (opt-in, day/week zoom)",
    "v2-ready: onTaskReschedule typed-but-dormant + controlled data so drag-to-reschedule is additive",
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

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-06-20",
  updatedAt: "2026-06-20",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["avatar", "badge", "button", "separator", "skeleton"],
    npm: {
      "lucide-react": "^1.11.0",
      "@tanstack/react-virtual": "^3.13.24",
    },
    internal: ["todo-rich-card"],
  },

  related: ["todo-rich-card", "todo-tree", "kanban-board-01"],
};
