import type { TodoStatusOption } from "../../todo-rich-card/types";

/**
 * Fallback status enum when the consumer passes no `statusOptions` prop.
 * Mirrors the demo set in dummy-data.ts so out-of-the-box rendering is
 * predictable for both demos and ad-hoc usage.
 */
export const DEFAULT_STATUS_OPTIONS: ReadonlyArray<TodoStatusOption> = [
  { value: "todo", label: "To do", variant: "outline" },
  { value: "in-progress", label: "In progress", variant: "secondary" },
  { value: "done", label: "Done", variant: "default" },
  { value: "blocked", label: "Blocked", variant: "destructive" },
];
