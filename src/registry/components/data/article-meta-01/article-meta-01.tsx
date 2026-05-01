import { memo } from "react";
import { cn } from "@/lib/utils";
import { MetaItem } from "./parts/meta-item";
import type { ArticleMeta01Props } from "./types";

const ALIGN_CLASS = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
} as const;

function ArticleMeta01Inner(props: ArticleMeta01Props) {
  const {
    items,
    linkComponent = "a",
    divider = false,
    align = "start",
    gapClass = "gap-6",
    className,
    itemClassName,
    iconClassName,
  } = props;

  return (
    <ul
      role="list"
      className={cn(
        "flex flex-wrap items-center text-muted-foreground list-none",
        gapClass,
        ALIGN_CLASS[align],
        divider && "pb-8 border-b border-border",
        className
      )}
    >
      {items.map((item) => (
        <MetaItem
          key={item.id}
          item={item}
          linkComponent={linkComponent}
          itemClassName={itemClassName}
          iconClassName={iconClassName}
        />
      ))}
    </ul>
  );
}

export const ArticleMeta01 = memo(ArticleMeta01Inner);
ArticleMeta01.displayName = "ArticleMeta01";
