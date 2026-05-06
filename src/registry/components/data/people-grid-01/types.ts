import type { ElementType, ReactNode } from "react";

export type PeopleGrid01Columns = 2 | 3 | 4 | 5;
export type PeopleGrid01AvatarSize = "sm" | "md" | "lg";
export type PeopleGrid01Alignment = "center" | "start";

export interface PeopleGridItem {
  /** Stable identifier. Used for React keys + accessible-name composition. */
  id: string;
  /** Person's display name. Required — drives the initials fallback. */
  name: string;
  /** Role / title (muted, smaller, below name). Optional. */
  title?: string;
  /** Avatar image URL. Optional — falls back to initials circle. */
  image?: string;
  /** Image alt text. Optional — falls back to `name`. */
  imageAlt?: string;
  /** Optional URL — when supplied + `linkComponent` provided, the entire card becomes clickable. */
  href?: string;
}

export interface PeopleGrid01Labels {
  /** Default: "No people to display." Used when `items` is empty AND `emptyState` not provided. */
  emptyText?: string;
}

export interface PeopleGrid01Props {
  /** Items to render in display order. */
  items: PeopleGridItem[];

  /** Optional section heading text. */
  heading?: string;
  /** Heading semantic level. Default: 'h2' (people grids are typically top-level page sections). */
  headingAs?: "h2" | "h3" | "h4";

  /** Number of columns at the largest breakpoint. Default: 3. All grids start at 1 col on mobile. */
  columns?: PeopleGrid01Columns;
  /** Avatar size. Default: 'lg' (w-24 h-24). 'md' = w-16, 'sm' = w-12. */
  avatarSize?: PeopleGrid01AvatarSize;
  /** Card alignment within each grid cell. Default: 'center'. */
  alignment?: PeopleGrid01Alignment;

  /** Element used when `item.href` is supplied. Default: 'a'. */
  linkComponent?: ElementType;

  /** Custom per-item renderer — bypasses the default card layout entirely. */
  renderItem?: (item: PeopleGridItem) => ReactNode;

  /** Localized labels. */
  labels?: PeopleGrid01Labels;

  /** Empty-state slot. Wins over `labels.emptyText`. */
  emptyState?: ReactNode;

  /** Override classes for the root <section>. */
  className?: string;
  /** Override classes for the heading. */
  headingClassName?: string;
  /** Override classes for the grid container. */
  gridClassName?: string;
  /** Override classes per item (the <li>). */
  itemClassName?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_PEOPLE_GRID_LABELS: Required<PeopleGrid01Labels> = {
  emptyText: "No people to display.",
};
