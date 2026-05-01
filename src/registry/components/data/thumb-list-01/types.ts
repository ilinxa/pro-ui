import type { ComponentType, ElementType, ReactNode } from "react";

export interface ThumbListItem {
  id: string;
  title: string;
  imageSrc: string;
  imageAlt?: string;
  meta?: string;
  href?: string;
}

export interface ThumbList01Labels {
  heading?: string;
  emptyText?: string;
}

export interface ThumbList01Props {
  items: ReadonlyArray<ThumbListItem>;
  framed?: boolean;
  headingAs?: "h2" | "h3" | "h4";
  headerIcon?: ComponentType<{ className?: string }> | null;
  linkComponent?: ElementType;
  renderMeta?: (item: ThumbListItem) => ReactNode;
  emptyState?: ReactNode;
  labels?: ThumbList01Labels;
  className?: string;
  headerClassName?: string;
  itemClassName?: string;
  imageClassName?: string;
  titleClassName?: string;
  metaClassName?: string;
}

export const THUMB_LIST_DEFAULT_LABELS: Required<ThumbList01Labels> = {
  heading: "Related",
  emptyText: "Nothing here yet.",
};
