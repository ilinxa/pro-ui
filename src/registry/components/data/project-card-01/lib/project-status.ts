export type ProjectStatus = "completed" | "ongoing" | "planned";

export interface ProjectStatusConfigEntry {
  /** English default label. Overridable via the `labels` prop on the card. */
  label: string;
  /** Tailwind class string for the status pill background + foreground. */
  className: string;
}

/**
 * Public status kernel. Pure data — no React imports, no DOM access.
 * Tree-shakeable + server-component-importable. Consumers can read the same
 * label / className map for status legends, filter rows, count summaries —
 * without rendering the card.
 *
 * Status is editorial — set on the data object by an editor, NOT derived from
 * a clock. There is intentionally NO `getProjectStatus(project, now)` helper.
 */
export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, ProjectStatusConfigEntry> = {
  completed: {
    label: "Completed",
    className: "bg-primary text-primary-foreground",
  },
  ongoing: {
    // chart-3 (teal) instead of `bg-accent` — pro-ui's `--accent` is a near-white
    // surface token (NOT a brand color), which renders status pills invisibly.
    // Teal sits between completed (lime) and planned (grey) and reads as "active".
    label: "In progress",
    className: "bg-chart-3 text-white",
  },
  planned: {
    label: "Planned",
    className: "bg-muted text-muted-foreground border border-border",
  },
};
