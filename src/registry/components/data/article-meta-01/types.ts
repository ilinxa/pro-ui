import type { ComponentType, ElementType, ReactNode } from "react";

export interface ArticleMetaItem {
  id: string;
  icon?: ComponentType<{ className?: string }>;
  value: ReactNode;
  href?: string;
  ariaLabel?: string;
}

export interface ArticleMeta01Props {
  items: ReadonlyArray<ArticleMetaItem>;
  linkComponent?: ElementType;
  divider?: boolean;
  align?: "start" | "center" | "end";
  gapClass?: string;
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
}
