import type { ComponentType, ElementType, ReactNode } from "react";

export interface ThumbnailListItem {
  id: string;
  title: string;
  imageSrc: string;
  imageAlt?: string;
  meta?: string;
  href?: string;
}

export interface ThumbnailListLabels {
  heading?: string;
  emptyText?: string;
}

export interface ThumbnailListProps {
  items: ReadonlyArray<ThumbnailListItem>;
  framed?: boolean;
  headingAs?: "h2" | "h3" | "h4";
  headerIcon?: ComponentType<{ className?: string }> | null;
  linkComponent?: ElementType;
  renderMeta?: (item: ThumbnailListItem) => ReactNode;
  emptyState?: ReactNode;
  labels?: ThumbnailListLabels;
  className?: string;
  headerClassName?: string;
  itemClassName?: string;
  imageClassName?: string;
  titleClassName?: string;
  metaClassName?: string;
}

export const THUMBNAIL_LIST_DEFAULT_LABELS: Required<ThumbnailListLabels> = {
  heading: "Related",
  emptyText: "Nothing here yet.",
};
