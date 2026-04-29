import type { PropertiesFormField } from "./types";

export interface TaskValues extends Record<string, unknown> {
  title: string;
  description: string;
  status: string;
  priority: string;
  estimatedHours: number;
  assignee: string;
  dueDate: string;
  completed: boolean;
}

export const TASK_BASELINE: TaskValues = {
  title: "Migrate auth middleware to v2 API",
  description:
    "Compatible with both providers; needs review by the security team before rollout.\n\nFollow the migration checklist in the runbook.",
  status: "in-progress",
  priority: "high",
  estimatedHours: 6,
  assignee: "rina@ilinxa.dev",
  dueDate: "2026-05-12",
  completed: false,
};

export const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
] as const;

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

export const TASK_SCHEMA: ReadonlyArray<PropertiesFormField> = [
  {
    key: "title",
    type: "string",
    label: "Title",
    description: "Short description visible in lists.",
    required: true,
    placeholder: "Migrate the…",
  },
  {
    key: "status",
    type: "select",
    label: "Status",
    options: STATUS_OPTIONS,
    required: true,
  },
  {
    key: "priority",
    type: "select",
    label: "Priority",
    options: PRIORITY_OPTIONS,
  },
  {
    key: "assignee",
    type: "string",
    label: "Assignee",
    placeholder: "user@team.dev",
  },
  {
    key: "estimatedHours",
    type: "number",
    label: "Estimated hours",
    placeholder: "0",
  },
  {
    key: "dueDate",
    type: "date",
    label: "Due date",
  },
  {
    key: "completed",
    type: "boolean",
    label: "Completed",
    description: "Marks the task closed once done.",
  },
  {
    key: "description",
    type: "textarea",
    label: "Description",
    placeholder: "Add context, links, anything else…",
  },
];

export const TASK_SCHEMA_VALIDATED: ReadonlyArray<PropertiesFormField> =
  TASK_SCHEMA.map((f) => {
    if (f.key === "title") {
      return {
        ...f,
        validate: (v) => {
          if (typeof v !== "string") return undefined;
          if (v.trim().length < 6) return "At least 6 characters.";
          if (v.length > 120) return "120 characters or fewer.";
          return undefined;
        },
      };
    }
    if (f.key === "estimatedHours") {
      return {
        ...f,
        validate: (v) => {
          if (v === undefined || v === null || v === "") return undefined;
          if (typeof v !== "number" || Number.isNaN(v)) return "Must be a number.";
          if (v < 0) return "Must be non-negative.";
          if (v > 80) return "Sanity-check: more than 80h?";
          return undefined;
        },
      };
    }
    if (f.key === "assignee") {
      return {
        ...f,
        validate: (v) => {
          if (typeof v !== "string" || v.length === 0) return undefined;
          if (!v.includes("@")) return "Use an email-shaped handle.";
          return undefined;
        },
      };
    }
    return f;
  });

export const TASK_SCHEMA_MIXED: ReadonlyArray<PropertiesFormField> =
  TASK_SCHEMA.map((f) => {
    if (f.key === "status") {
      return {
        ...f,
        permission: "read-only",
        permissionReason:
          "Status is owned by the workflow engine. Use the Status menu to transition.",
      };
    }
    if (f.key === "assignee") {
      return {
        ...f,
        permission: "read-only",
        permissionReason: "Set by the team's auto-rotation rule.",
      };
    }
    if (f.key === "completed") {
      return { ...f, permission: "hidden" };
    }
    return f;
  });
