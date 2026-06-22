import { addDays, startOfDay } from "date-fns";
import type {
  TodoItem,
  TodoLabelOption,
  TodoPriorityOption,
  TodoStatusOption,
} from "./types";

/* ───────── shared color/label language (reused by the demo) ───────── */

export const CALENDAR_STATUS_OPTIONS: TodoStatusOption[] = [
  { value: "todo", label: "To do", tone: "active", variant: "outline" },
  {
    value: "in-progress",
    label: "In progress",
    tone: "active",
    variant: "secondary",
  },
  {
    value: "blocked",
    label: "Blocked",
    tone: "blocked",
    variant: "destructive",
    icon: "⛔",
  },
  { value: "done", label: "Done", tone: "done", variant: "secondary", icon: "✓" },
];

export const CALENDAR_PRIORITY_OPTIONS: TodoPriorityOption[] = [
  { value: "low", label: "Low", color: "var(--muted-foreground)" },
  { value: "high", label: "High", color: "var(--destructive)" },
];

export const CALENDAR_LABEL_OPTIONS: TodoLabelOption[] = [
  { value: "design", label: "Design", color: "#0ea5e9" },
  { value: "eng", label: "Engineering", color: "#10b981" },
  { value: "ops", label: "Ops", color: "#f59e0b" },
];

/* ───────── date helpers (local, no offset → parsed as floating-local) ───────── */

const pad = (n: number) => String(n).padStart(2, "0");

/** A local timestamp string with no offset (Date.parse reads it as local). */
function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:00`;
}

/** A bare calendar date → an all-day event (the Google-style mechanism). */
function dateOnly(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function at(base: Date, dayOffset: number, hour: number, minute = 0): Date {
  const d = startOfDay(addDays(base, dayOffset));
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * Builds a varied TodoItem[] anchored to `base` — exercises every visual state:
 * timed + overlapping (lane-pack), multi-day spanning bar, single all-day
 * (date-only), milestone (no end), overdue, inactive, a dense day (overflow),
 * and a nested parent (flattened). Pure / deterministic given `base`.
 */
export function buildCalendarDummyData(base: Date): TodoItem[] {
  return [
    {
      id: "1",
      name: "Design review",
      status: "in-progress",
      active: true,
      setAt: iso(at(base, 0, 10, 0)),
      expireAt: iso(at(base, 0, 11, 30)),
      labels: ["design"],
      targetPerson: { id: "p1", name: "Ada Lovelace" },
    },
    {
      id: "2",
      name: "Sprint planning",
      status: "todo",
      active: true,
      setAt: iso(at(base, 0, 10, 30)), // overlaps #1 → lane-pack
      expireAt: iso(at(base, 0, 12, 0)),
    },
    {
      id: "3",
      name: "Launch week",
      status: "in-progress",
      active: true,
      setAt: dateOnly(addDays(base, 2)), // multi-day all-day spanning bar
      expireAt: dateOnly(addDays(base, 6)),
      borderColor: "#8b5cf6",
    },
    {
      id: "4",
      name: "Spec deadline",
      status: "blocked",
      active: true,
      setAt: iso(at(base, 4, 17, 0)), // milestone (no end / duration)
      labels: ["eng"],
    },
    {
      id: "5",
      name: "Company holiday",
      status: "done",
      active: true,
      setAt: dateOnly(addDays(base, 8)), // single all-day (date-only, no end)
    },
    {
      id: "6",
      name: "Send invoices",
      status: "todo",
      active: true,
      setAt: iso(at(base, -3, 9, 0)), // overdue (in the past, not done)
      expireAt: iso(at(base, -3, 10, 0)),
      labels: ["ops"],
    },
    {
      id: "7",
      name: "Archived task",
      status: "done",
      active: false, // inactive → dimmed
      setAt: iso(at(base, 1, 14, 0)),
      expireAt: iso(at(base, 1, 15, 0)),
    },
    // dense day (base + 3) — overflow + lane-pack stress
    {
      id: "8",
      name: "Standup",
      status: "todo",
      active: true,
      setAt: iso(at(base, 3, 9, 0)),
      expireAt: iso(at(base, 3, 9, 15)),
    },
    {
      id: "9",
      name: "1:1 with Ada",
      status: "in-progress",
      active: true,
      setAt: iso(at(base, 3, 9, 30)),
      expireAt: iso(at(base, 3, 10, 30)),
    },
    {
      id: "10",
      name: "Design crit",
      status: "todo",
      active: true,
      setAt: iso(at(base, 3, 10, 0)), // overlaps #9
      expireAt: iso(at(base, 3, 11, 0)),
    },
    {
      id: "11",
      name: "Lunch & learn",
      status: "todo",
      active: true,
      setAt: iso(at(base, 3, 12, 0)),
      expireAt: iso(at(base, 3, 13, 0)),
    },
    {
      id: "12",
      name: "Retro",
      status: "todo",
      active: true,
      setAt: iso(at(base, 3, 15, 0)),
      expireAt: iso(at(base, 3, 16, 0)),
    },
    // nested parent (children flattened — no rollup)
    {
      id: "13",
      name: "Q3 Roadmap",
      status: "in-progress",
      active: true,
      setAt: dateOnly(addDays(base, 10)),
      expireAt: dateOnly(addDays(base, 14)),
      children: [
        {
          id: "13a",
          name: "Research",
          status: "done",
          active: true,
          setAt: iso(at(base, 10, 9, 0)),
          expireAt: iso(at(base, 10, 12, 0)),
        },
        {
          id: "13b",
          name: "Draft",
          status: "in-progress",
          active: true,
          setAt: iso(at(base, 12, 9, 0)),
          expireAt: iso(at(base, 12, 17, 0)),
        },
      ],
    },
  ];
}

/** Static dataset (fixed anchor) for the shipped fixtures + SSR-stable use. */
export const CALENDAR_DUMMY: TodoItem[] = buildCalendarDummyData(
  new Date(2026, 5, 15),
);
