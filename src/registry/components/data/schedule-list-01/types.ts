import type { ComponentType, ElementType, ReactNode } from "react";

export interface ScheduleListItem {
  /** Stable identifier. Used for React keys + accessible-name composition. */
  id: string;
  /** Time string ("09:00", "14:30", "9pm"). Required — schedules ARE time-anchored. */
  time: string;
  /** Optional end time for a time range. Renders as `${time}{separator}${endTime}` (e.g. "09:00 - 10:30"). */
  endTime?: string;
  /** Item title (bold). Required. */
  title: string;
  /** Item description (muted, smaller). Optional. */
  description?: string;
  /** Optional Lucide-style icon shown left of the time column (e.g. Coffee, Users for break / networking). */
  icon?: ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
  /** Optional URL — when supplied + `linkComponent` provided, item becomes clickable. */
  href?: string;
}

export interface ScheduleList01Labels {
  /** Default: " - " (with surrounding spaces) — separator between time + endTime. */
  timeRangeSeparator?: string;
  /** Default: "No items scheduled." Used when `items` is empty AND `emptyState` not provided. */
  emptyText?: string;
}

export interface ScheduleList01Props {
  /** Schedule items in display order (chronological). */
  items: ScheduleListItem[];

  /** Optional section heading text. Omit to render without heading (consumer wraps externally). */
  heading?: string;
  /** Heading semantic level. Default: 'h2'. */
  headingAs?: "h2" | "h3" | "h4";

  /** Render per-row card chrome (`bg-card rounded-xl border ...`). Default: true. */
  framed?: boolean;

  /** Element used for clickable items. Default: 'a'. Pass NextLink / RemixLink / etc. */
  linkComponent?: ElementType;

  /** Localized labels. Defaults are English. */
  labels?: ScheduleList01Labels;

  /** Custom per-item renderer — receives the item, returns the row content (replaces the default time + title + description layout). */
  renderItem?: (item: ScheduleListItem) => ReactNode;

  /** Custom time-string renderer — returns ReactNode (e.g. "09:00" → "9:00 AM"). Default: time + optional endTime joined by separator. */
  renderTime?: (item: ScheduleListItem) => ReactNode;

  /** Empty-state slot. Wins over `labels.emptyText` when provided. */
  emptyState?: ReactNode;

  /** Override classes for the root <section>. */
  className?: string;
  /** Override classes for the heading. */
  headingClassName?: string;
  /** Override classes per row. */
  itemClassName?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_SCHEDULE_LIST_LABELS: Required<ScheduleList01Labels> = {
  timeRangeSeparator: " - ",
  emptyText: "No items scheduled.",
};
