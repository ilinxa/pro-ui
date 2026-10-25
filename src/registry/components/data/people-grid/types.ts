import type { ElementType, ReactNode } from "react";

export type PeopleGridColumns = 2 | 3 | 4 | 5;
export type PeopleGridAvatarSize = "sm" | "md" | "lg";
export type PeopleGridAlignment = "center" | "start";

export interface PeopleGridItem {
  /** Stable identifier. Used for React keys + accessible-name composition. */
  id: string;
  /** Person's display name. Required — drives the initials fallback. */
  name: string;
  /** Role / title (muted, smaller, below name). Optional. */
  title?: string;
  /** Avatar image URL. Optional — falls back to initials circle. */
  image?: string;
  /** Image alt text. Optional — default `""` (decorative: the name is the heading right beside the avatar). */
  imageAlt?: string;
  /** Intrinsic width of `image` in px — passed to `<img width>` (reserves space, avoids layout shift). */
  imageWidth?: number;
  /** Intrinsic height of `image` in px — passed to `<img height>`. */
  imageHeight?: number;
  /** `srcset` for `image` — passed to `<img srcset>`. */
  imageSrcSet?: string;
  /** `sizes` for `imageSrcSet` — passed to `<img sizes>`. */
  imageSizes?: string;
  /** Optional URL — when supplied + `linkComponent` provided, the entire card becomes clickable. */
  href?: string;
}

export interface PeopleGridLabels {
  /** Default: "No people to display." Used when `items` is empty AND `emptyState` not provided. */
  emptyText?: string;
}

export interface PeopleGridProps {
  /** Items to render in display order. */
  items: PeopleGridItem[];

  /** Optional section heading text. */
  heading?: string;
  /** Heading semantic level. Default: 'h2' (people grids are typically top-level page sections). */
  headingAs?: "h2" | "h3" | "h4";
  /**
   * Heading level of each card's name. Default: one level below `headingAs` (h2 -> h3, h3 -> h4, h4 -> h5).
   * `cardHeadingAs="h4"` reproduces the 0.2.0 output.
   */
  cardHeadingAs?: "h3" | "h4" | "h5" | "h6";
  /** BCP 47 locale for the default card's initials casing (`"tr"`: ilker -> İ). */
  locale?: string;

  /** Number of columns at the largest breakpoint. Default: 3. All grids start at 1 col on mobile. */
  columns?: PeopleGridColumns;
  /** Avatar size. Default: 'lg' (w-24 h-24). 'md' = w-16, 'sm' = w-12. */
  avatarSize?: PeopleGridAvatarSize;
  /** Card alignment within each grid cell. Default: 'center'. */
  alignment?: PeopleGridAlignment;

  /** Element used when `item.href` is supplied. Default: 'a'. */
  linkComponent?: ElementType;

  /** Custom per-item renderer — bypasses the default card layout entirely. */
  renderItem?: (item: PeopleGridItem) => ReactNode;
  /**
   * Per-card action slot on the default card (a "Follow" button …). Rendered in a raised wrapper
   * (`relative z-10`), so the card link never swallows its clicks. Tab order: badge, actions, then the card link.
   */
  renderActions?: (item: PeopleGridItem) => ReactNode;
  /** Per-card badge slot on the default card (verified mark …), rendered beside the name in a raised wrapper. */
  renderBadge?: (item: PeopleGridItem) => ReactNode;

  /** Localized labels. An `undefined` key keeps its default. */
  labels?: PeopleGridLabels;

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
export const defaultPeopleGridLabels: Required<PeopleGridLabels> = {
  emptyText: "No people to display.",
};

/** @deprecated Use `defaultPeopleGridLabels`. */
export const DEFAULT_PEOPLE_GRID_LABELS = defaultPeopleGridLabels;
