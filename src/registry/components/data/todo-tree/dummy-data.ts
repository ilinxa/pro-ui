import type { TodoItem, TodoStatusOption } from "../todo-rich-card/types";

/**
 * Default status enum used by todo-tree demos.
 * Consumers pass their own via `statusOptions` prop.
 */
export const TODO_TREE_DEMO_STATUS_OPTIONS: TodoStatusOption[] = [
  { value: "todo", label: "To do", variant: "outline" },
  { value: "in-progress", label: "In progress", variant: "secondary" },
  { value: "done", label: "Done", variant: "default" },
  { value: "blocked", label: "Blocked", variant: "destructive" },
];

/**
 * Frozen "now" for deterministic demos — pin via `now={TODO_TREE_DEMO_NOW}`
 * in any composed TodoRichCard to keep snapshots stable.
 */
export const TODO_TREE_DEMO_NOW = new Date("2026-05-20T12:00:00Z");

/**
 * 3-level fixture exercising: top-level + children + grandchildren,
 * mixed active/inactive, mixed status, person assignments, and
 * description text long enough to truncate.
 */
export const TODO_TREE_DEMO_ITEMS: TodoItem[] = [
  {
    id: "tt-q3-ship",
    name: "Ship Q3 plan",
    status: "in-progress",
    active: true,
    setAt: "2026-05-18T09:00:00Z",
    expireAt: "2026-05-24T17:00:00Z",
    description:
      "Outline goals, OKRs, and risks for the team review. Coordinate with PM + design for the kickoff slot.",
    targetPerson: { id: "u-ada", name: "Ada" },
    children: [
      {
        id: "tt-q3-outline",
        name: "Draft outline",
        status: "done",
        active: true,
        setAt: "2026-05-18T09:00:00Z",
        description: "Document the 4 themes and the ask for each team.",
        targetPerson: { id: "u-ada", name: "Ada" },
      },
      {
        id: "tt-q3-review",
        name: "Review with leads",
        status: "todo",
        active: true,
        setAt: "2026-05-18T09:00:00Z",
        description:
          "Schedule 30-min syncs with each lead; collect feedback by Friday.",
        targetPerson: { id: "u-bo", name: "Bo" },
        children: [
          {
            id: "tt-q3-review-eng",
            name: "Engineering sync",
            status: "in-progress",
            active: true,
            setAt: "2026-05-19T09:00:00Z",
            description: "Cover platform + product engineering ROCEs.",
            targetPerson: { id: "u-bo", name: "Bo" },
          },
          {
            id: "tt-q3-review-design",
            name: "Design sync",
            status: "todo",
            active: false,
            setAt: "2026-05-19T09:00:00Z",
            description: "Postponed until the brand refresh lands.",
            targetPerson: { id: "u-co", name: "Co" },
          },
        ],
      },
    ],
  },
  {
    id: "tt-bug-triage",
    name: "Triage bug backlog",
    status: "todo",
    active: true,
    setAt: "2026-05-15T09:00:00Z",
    expireAt: "2026-05-22T17:00:00Z",
    description:
      "Audit the inbound bug queue (47 open); merge dupes; assign owners; promote 3 to P1.",
    targetPerson: { id: "u-dee", name: "Dee" },
  },
  {
    id: "tt-perf-investigation",
    name: "Perf investigation — list render",
    status: "blocked",
    active: false,
    setAt: "2026-05-10T09:00:00Z",
    description:
      "Blocked on profiling access; ticket #482 escalated to platform team.",
    targetPerson: { id: "u-ada", name: "Ada" },
  },
];
