import type { ElementType, MouseEvent, ReactNode } from "react";

export type ContentCardNewsVariant =
  | "featured"
  | "large"
  | "medium"
  | "small"
  | "list";

export interface ContentCardItem {
  /** Stable identifier. Used for React keys and the default ariaLabel. */
  id: string;
  /** Headline. Rendered in the H-tag appropriate for the variant. */
  title: string;
  /** Image URL. */
  image: string;
  /** Short summary or lead paragraph. Variants gracefully omit when absent. */
  excerpt?: string;
  /** Category / tag string. Used as a key into `categoryStyles`. */
  category?: string;
  /** Author / byline. */
  author?: string;
  /** Publish date. ISO-8601 string or Date. */
  date?: string | Date;
  /** Estimated read time in minutes. */
  readTime?: number;
  /** View count for engagement chip. Only `medium` renders this. */
  views?: number;
}

export interface ContentCardNewsLabels {
  /** Featured-variant CTA label. Default: 'Read More'. */
  readMore?: string;
  /** Compact "min" suffix for `large` variant. Default: 'min'. */
  minutesShort?: string;
  /** Long "min read" suffix for `featured` variant. Default: 'min read'. */
  minutesRead?: string;
  /** Visually-hidden label prefix on the link. Default: 'Read article:'. */
  readArticlePrefix?: string;
  /** aria-label suffix on the views chip. Default: 'views'. */
  viewsLabel?: string;
}

export const DEFAULT_LABELS: Required<ContentCardNewsLabels> = {
  readMore: "Read More",
  minutesShort: "min",
  minutesRead: "min read",
  readArticlePrefix: "Read article:",
  viewsLabel: "views",
};

export interface ContentCardNewsProps {
  /** The item to render. */
  item: ContentCardItem;

  /** Visual variant. Default: 'medium'. */
  variant?: ContentCardNewsVariant;

  /** URL the card links to. */
  href?: string;
  /** Click handler, fired before navigation if href is also set. */
  onClick?: (item: ContentCardItem, event: MouseEvent) => void;
  /** Element used for the link. Default: 'a'. Pass NextLink / RemixLink / etc. */
  linkComponent?: ElementType;

  /** Custom relative-time formatter. Default: English. */
  formatRelativeTime?: (date: Date, now?: Date) => string;
  /** Custom absolute-date formatter. Default: browser locale long format. */
  formatDate?: (date: Date) => string;
  /** Localized labels. Defaults are English. */
  labels?: ContentCardNewsLabels;

  /** Map of category → Tailwind class string. Falls back to `bg-muted` when absent. */
  categoryStyles?: Record<string, string>;
  /** Override classes for the title. */
  titleClassName?: string;
  /** Override classes for the image. */
  imageClassName?: string;
  /** Override classes for the root <article>. */
  className?: string;

  /** Override the link's accessible name. Default: '<readArticlePrefix> <title>'. */
  ariaLabel?: string;

  /** Optional cluster of buttons/links sitting ABOVE the link overlay (z-10). */
  actions?: ReactNode;

  /** Image loading strategy. Default: 'lazy' ('eager' for `featured`). */
  loading?: "lazy" | "eager";
}

/**
 * Internal shape passed from the root to each `parts/<variant>.tsx`.
 * All defaults resolved; all formatting pre-computed.
 */
export interface ResolvedPartProps {
  item: ContentCardItem;
  formattedDate: string | undefined;
  formattedRelativeTime: string | undefined;
  categoryStyle: string;
  labels: Required<ContentCardNewsLabels>;
  LinkComponent: ElementType;
  href: string | undefined;
  onClick: ((event: MouseEvent) => void) | undefined;
  ariaLabel: string;
  titleId: string;
  titleClassName: string | undefined;
  imageClassName: string | undefined;
  className: string | undefined;
  actions: ReactNode;
  loading: "lazy" | "eager";
}
