import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ThumbListItem } from "../types";

interface ThumbRowProps {
  item: ThumbListItem;
  linkComponent: ElementType;
  renderMeta?: (item: ThumbListItem) => ReactNode;
  itemClassName?: string;
  imageClassName?: string;
  titleClassName?: string;
  metaClassName?: string;
}

export function ThumbRow({
  item,
  linkComponent: LinkEl,
  renderMeta,
  itemClassName,
  imageClassName,
  titleClassName,
  metaClassName,
}: ThumbRowProps) {
  const meta = renderMeta
    ? renderMeta(item)
    : item.meta
      ? (
        <p className={cn("text-xs text-muted-foreground mt-1", metaClassName)}>
          {item.meta}
        </p>
      )
      : null;

  const inner = (
    <>
      <img
        src={item.imageSrc}
        alt={item.imageAlt ?? item.title}
        loading="lazy"
        className={cn(
          "w-20 h-16 rounded-lg object-cover shrink-0",
          imageClassName
        )}
      />
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-medium text-foreground line-clamp-2",
            "group-hover:text-primary group-focus-visible:text-primary transition-colors",
            titleClassName
          )}
        >
          {item.title}
        </p>
        {meta}
      </div>
    </>
  );

  return (
    <li className={cn("group", itemClassName)}>
      {item.href ? (
        <LinkEl
          href={item.href}
          className="flex gap-3 items-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {inner}
        </LinkEl>
      ) : (
        <div className="flex gap-3 items-start">{inner}</div>
      )}
    </li>
  );
}
