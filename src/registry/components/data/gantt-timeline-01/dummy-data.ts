import type {
  TodoItem,
  TodoLabelOption,
  TodoPriorityOption,
  TodoStatusOption,
} from "./types";

/* ───────── shared color/label language (reused by the demo) ───────── */

export const GANTT_STATUS_OPTIONS: TodoStatusOption[] = [
  { value: "todo", label: "To do", tone: "active", variant: "outline" },
  { value: "in-progress", label: "In progress", tone: "active", variant: "secondary" },
  { value: "blocked", label: "Blocked", tone: "blocked", variant: "destructive", icon: "⛔" },
  { value: "done", label: "Done", tone: "done", variant: "secondary", icon: "✓" },
];

export const GANTT_PRIORITY_OPTIONS: TodoPriorityOption[] = [
  { value: "low", label: "Low", color: "var(--muted-foreground)" },
  { value: "high", label: "High", color: "var(--destructive)" },
];

export const GANTT_LABEL_OPTIONS: TodoLabelOption[] = [
  { value: "design", label: "Design", color: "#0ea5e9" },
  { value: "frontend", label: "Frontend", color: "#10b981" },
  { value: "backend", label: "Backend", color: "#f59e0b" },
  { value: "qa", label: "QA", color: "#ef4444" },
];

/* ───────── a deep tree exercising every visual state ─────────
 * Dated around 2026-06; "now" lands mid-June so a blocked past-due bar is
 * overdue, an in-flight bar straddles today, and the launch is a future
 * milestone. Covers: summary roll-up, done/blocked/active tones, overdue,
 * milestone (no end), duration-based bar, inactive, locked, borderColor
 * override, priorities + labels. */

export const GANTT_DUMMY: TodoItem[] = [
  {
    id: "epic-1",
    name: "Q3 product launch",
    status: "in-progress",
    active: true,
    setAt: "2026-06-01T09:00:00.000Z",
    startAt: "2026-06-02T09:00:00.000Z",
    expireAt: "2026-07-10T17:00:00.000Z",
    targetPerson: { id: "u1", name: "Ava Stone" },
    priority: "high",
    labels: ["design"],
    children: [
      {
        id: "t-1",
        name: "Design system audit",
        status: "done",
        active: true,
        setAt: "2026-06-02T09:00:00.000Z",
        startAt: "2026-06-02T09:00:00.000Z",
        expireAt: "2026-06-09T17:00:00.000Z",
        targetPerson: { id: "u2", name: "Leo Park" },
        labels: ["design"],
      },
      {
        id: "t-2",
        name: "Build component library",
        status: "in-progress",
        active: true,
        setAt: "2026-06-08T09:00:00.000Z",
        startAt: "2026-06-08T09:00:00.000Z",
        expireAt: "2026-06-28T17:00:00.000Z",
        targetPerson: { id: "u2", name: "Leo Park" },
        priority: "high",
        labels: ["design", "frontend"],
        children: [
          {
            id: "t-2a",
            name: "Buttons + inputs",
            status: "done",
            active: true,
            setAt: "2026-06-08T09:00:00.000Z",
            expireAt: "2026-06-14T17:00:00.000Z",
          },
          {
            id: "t-2b",
            name: "Data table",
            status: "in-progress",
            active: true,
            setAt: "2026-06-15T09:00:00.000Z",
            expireAt: "2026-06-25T17:00:00.000Z",
            priority: "high",
          },
        ],
      },
      {
        id: "t-3",
        name: "API contract sign-off",
        status: "todo",
        active: true,
        setAt: "2026-06-26T09:00:00.000Z",
        labels: ["backend"],
      },
    ],
  },
  {
    id: "epic-2",
    name: "Infrastructure hardening",
    status: "in-progress",
    active: true,
    setAt: "2026-06-05T09:00:00.000Z",
    startAt: "2026-06-05T09:00:00.000Z",
    expireAt: "2026-07-01T17:00:00.000Z",
    targetPerson: { id: "u3", name: "Mei Chen" },
    children: [
      {
        id: "t-4",
        name: "Migrate to new cluster",
        status: "blocked",
        active: true,
        setAt: "2026-06-05T09:00:00.000Z",
        startAt: "2026-06-05T09:00:00.000Z",
        expireAt: "2026-06-15T17:00:00.000Z",
        priority: "high",
        labels: ["backend"],
      },
      {
        id: "t-5",
        name: "Load testing",
        status: "todo",
        active: true,
        setAt: "2026-06-20T09:00:00.000Z",
        duration: 5 * 86_400_000,
        labels: ["qa"],
      },
      {
        id: "t-6",
        name: "Decommission legacy stack",
        status: "todo",
        active: false,
        setAt: "2026-07-01T09:00:00.000Z",
        expireAt: "2026-07-05T17:00:00.000Z",
        locked: true,
      },
    ],
  },
  {
    id: "t-7",
    name: "Marketing site refresh",
    status: "in-progress",
    active: true,
    setAt: "2026-06-10T09:00:00.000Z",
    startAt: "2026-06-10T09:00:00.000Z",
    expireAt: "2026-06-30T17:00:00.000Z",
    borderColor: "#0ea5e9",
    targetPerson: { id: "u4", name: "Sam Reed" },
    labels: ["design"],
  },
  {
    id: "m-1",
    name: "Public launch",
    status: "todo",
    active: true,
    setAt: "2026-07-10T09:00:00.000Z",
  },
];
