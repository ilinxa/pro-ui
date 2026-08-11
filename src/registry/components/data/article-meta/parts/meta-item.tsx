import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import type { ArticleMetaItem } from "../types";

interface MetaItemProps {
  item: ArticleMetaItem;
  linkComponent: ElementType;
  itemClassName?: string;
  iconClassName?: string;
}

export function MetaItem({
  item,
  linkComponent: LinkEl,
  itemClassName,
  iconClassName,
}: MetaItemProps) {
  const Icon = item.icon;

  const inner = (
    <>
      {Icon ? (
        <Icon className={cn("w-4 h-4", iconClassName)} aria-hidden="true" />
      ) : null}
      <span>{item.value}</span>
    </>
  );

  return (
    <li className={cn("flex items-center gap-2", itemClassName)}>
      {item.href ? (
        <LinkEl
          href={item.href}
          aria-label={item.ariaLabel}
          className="inline-flex items-center gap-2 hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {inner}
        </LinkEl>
      ) : item.ariaLabel ? (
        <span aria-label={item.ariaLabel} className="inline-flex items-center gap-2">
          {inner}
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">{inner}</span>
      )}
    </li>
  );
}
