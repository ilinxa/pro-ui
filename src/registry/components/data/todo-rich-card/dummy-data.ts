/**
 * Demo fixtures — four items per plan §4:
 *   1. Fresh task (early ramp) — green border
 *   2. Urgent task (late ramp) — orange-red border
 *   3. Overdue task (past expireAt) — pinned full red
 *   4. Nested family (3 levels) — exercises recursion + mixed-color
 */

import type {
  TodoItem,
  TodoLabelOption,
  TodoPriorityOption,
  TodoStatusOption,
} from "./types";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// Anchor "now" to a stable timestamp so the demo is deterministic across
// reloads. Consumers will pass their own (or omit) for real-time behavior.
const NOW = new Date("2026-05-20T12:00:00Z");

export const DEMO_NOW = NOW;

export const DEMO_STATUS_OPTIONS: TodoStatusOption[] = [
  { value: "todo", label: "To do", variant: "outline" },
  { value: "in-progress", label: "In progress", variant: "default" },
  { value: "blocked", label: "Blocked", variant: "destructive" },
  { value: "done", label: "Done", variant: "secondary" },
];

/**
 * v0.3 — same statuses with `tone` so done/blocked become terminal (gray
 * border + dimmed overlay + auto-collapse). Kept separate from
 * DEMO_STATUS_OPTIONS so the other demos keep their time-driven borders.
 */
export const DEMO_STATUS_OPTIONS_TONED: TodoStatusOption[] = [
  { value: "todo", label: "To do", variant: "outline" },
  { value: "in-progress", label: "In progress", variant: "default" },
  { value: "blocked", label: "Blocked", variant: "destructive", tone: "blocked", icon: "🚫" },
  { value: "done", label: "Done", variant: "secondary", tone: "done", icon: "✅" },
];

/** v0.3 — priority bucket display metadata; colors paint border + text only. */
export const DEMO_PRIORITY_OPTIONS: TodoPriorityOption[] = [
  { value: "urgent", label: "Urgent", color: "oklch(0.62 0.21 25)" },
  { value: "high", label: "High", color: "oklch(0.70 0.17 60)" },
  { value: "normal", label: "Normal" },
];

/** v0.3 — label/tag display metadata. */
export const DEMO_LABEL_OPTIONS: TodoLabelOption[] = [
  { value: "frontend", label: "Frontend", color: "oklch(0.65 0.16 250)" },
  { value: "security", label: "Security", color: "oklch(0.62 0.21 25)" },
  { value: "q3", label: "Q3" },
];

export const FRESH_TASK: TodoItem = {
  id: "task-fresh",
  name: "Draft the OKR for Q3",
  description: "Outline goals, key results, and timelines for the next quarter.",
  status: "in-progress",
  active: true,
  setAt: new Date(NOW.getTime() - 2 * HOUR).toISOString(),
  expireAt: new Date(NOW.getTime() + 5 * DAY).toISOString(),
  targetPerson: {
    id: "hessam",
    name: "Hessam",
    avatar: "https://i.pravatar.cc/64?u=hessam",
  },
  creatorPerson: {
    id: "leadership",
    name: "Leadership team",
  },
  links: [
    { url: "https://docs.example.com/okr-template", label: "OKR template" },
  ],
};

export const URGENT_TASK: TodoItem = {
  id: "task-urgent",
  name: "Review pull request #482",
  description: "Auth middleware rewrite — flagged by legal compliance.",
  status: "in-progress",
  active: true,
  setAt: new Date(NOW.getTime() - 36 * HOUR).toISOString(),
  expireAt: new Date(NOW.getTime() + 4 * HOUR).toISOString(),
  targetPerson: {
    id: "hessam",
    name: "Hessam",
    avatar: "https://i.pravatar.cc/64?u=hessam",
  },
  creatorPerson: {
    id: "legal-bot",
    name: "Legal Compliance Bot",
  },
  links: [
    { url: "https://github.com/example/repo/pull/482", label: "PR #482" },
    { url: "https://compliance.example.com/finding-2026-04-12" },
  ],
};

export const OVERDUE_TASK: TodoItem = {
  id: "task-overdue",
  name: "Publish Q1 retrospective",
  description: "Past expireAt — engine pins the border to full red.",
  status: "blocked",
  active: true,
  setAt: new Date(NOW.getTime() - 14 * DAY).toISOString(),
  expireAt: new Date(NOW.getTime() - 2 * DAY).toISOString(),
  targetPerson: {
    id: "amir",
    name: "Amir",
    avatar: "https://i.pravatar.cc/64?u=amir",
  },
  links: [{ url: "https://docs.example.com/q1-retro-draft", label: "Draft" }],
  images: [
    {
      src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400",
      alt: "Brainstorming wall",
      caption: "Wall of stickies from offsite",
    },
    {
      src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400",
      alt: "Notebook with diagrams",
      caption: "Hand-drawn flow",
    },
  ],
};

export const NESTED_FAMILY: TodoItem = {
  id: "task-nested-root",
  name: "Ship the new design system",
  description: "Three-level nested example. Each child has its own dates.",
  status: "in-progress",
  active: true,
  setAt: new Date(NOW.getTime() - 7 * DAY).toISOString(),
  expireAt: new Date(NOW.getTime() + 10 * DAY).toISOString(),
  targetPerson: {
    id: "hessam",
    name: "Hessam",
    avatar: "https://i.pravatar.cc/64?u=hessam",
  },
  children: [
    {
      id: "task-nested-1",
      name: "Color tokens",
      status: "done",
      active: true,
      setAt: new Date(NOW.getTime() - 7 * DAY).toISOString(),
      expireAt: new Date(NOW.getTime() - 1 * DAY).toISOString(),
      borderColor: "oklch(0.45 0.02 250)",
    },
    {
      id: "task-nested-2",
      name: "Typography",
      status: "in-progress",
      active: true,
      setAt: new Date(NOW.getTime() - 3 * DAY).toISOString(),
      expireAt: new Date(NOW.getTime() + 3 * DAY).toISOString(),
      children: [
        {
          id: "task-nested-2-1",
          name: "Pick body font",
          status: "todo",
          active: true,
          setAt: new Date(NOW.getTime() - 1 * DAY).toISOString(),
          duration: 2 * HOUR,
        },
        {
          id: "task-nested-2-2",
          name: "Lock heading scale",
          status: "todo",
          active: true,
          setAt: new Date(NOW.getTime() - 1 * DAY).toISOString(),
          expireAt: new Date(NOW.getTime() + 2 * DAY).toISOString(),
          locked: true,
        },
      ],
    },
    {
      id: "task-nested-3",
      name: "Component playground",
      status: "todo",
      active: false,
      setAt: new Date(NOW.getTime() - 1 * DAY).toISOString(),
      expireAt: new Date(NOW.getTime() + 8 * DAY).toISOString(),
    },
  ],
};

/* ───────── v0.3 fixtures — priority/labels meta row + status tones ───────── */

export const PRIORITIZED_TASK: TodoItem = {
  id: "task-prioritized",
  name: "Migrate auth to the new session service",
  description: "Priority + labels surface in the header meta row.",
  status: "in-progress",
  active: true,
  setAt: new Date(NOW.getTime() - 6 * HOUR).toISOString(),
  expireAt: new Date(NOW.getTime() + 2 * DAY).toISOString(),
  priority: "high",
  labels: ["frontend", "security", "q3"],
  targetPerson: { id: "hessam", name: "Hessam", avatar: "https://i.pravatar.cc/64?u=hessam" },
};

export const DONE_TASK: TodoItem = {
  id: "task-done",
  name: "Wire up the analytics dashboard",
  description: "Terminal `done` tone — gray border, dimmed overlay, auto-collapsed.",
  status: "done",
  active: true,
  setAt: new Date(NOW.getTime() - 3 * DAY).toISOString(),
  expireAt: new Date(NOW.getTime() - 1 * DAY).toISOString(),
  priority: "normal",
};

export const BLOCKED_TASK: TodoItem = {
  id: "task-blocked",
  name: "Deploy to the EU region",
  description: "Terminal `blocked` tone — reddish overlay; change status to clear it.",
  status: "blocked",
  active: true,
  setAt: new Date(NOW.getTime() - 1 * DAY).toISOString(),
  expireAt: new Date(NOW.getTime() + 1 * DAY).toISOString(),
  priority: "urgent",
  labels: ["security"],
};

export const DEMO_ITEMS = [FRESH_TASK, URGENT_TASK, OVERDUE_TASK, NESTED_FAMILY];
