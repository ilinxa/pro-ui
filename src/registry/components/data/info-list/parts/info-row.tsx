"use client";

import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import type { InfoListVariant, InfoListItem } from "../types";

interface InfoRowProps {
  item: InfoListItem;
  variant: InfoListVariant;
  separated: boolean;
  linkComponent: ElementType;
  wrap: boolean;
  itemClassName?: string;
}

export function InfoRow({
  item,
  variant,
  separated,
  linkComponent: LinkComponent,
  wrap,
  itemClassName,
}: InfoRowProps) {
  const IconComponent = item.icon;
  const isLinked = item.href != null && item.href.length > 0;

  if (variant === "compact") {
    // Truncated rows carry the full value as a native tooltip; wrapped rows show it all already.
    const fullValue = wrap
      ? undefined
      : (item.title ??
        (typeof item.primary === "string" || typeof item.primary === "number"
          ? String(item.primary)
          : undefined));
    const valueClass = wrap ? "wrap-break-word" : "truncate";
    return (
      <li
        className={cn(
          wrap ? "flex items-start gap-3" : "flex items-center gap-3",
          separated && "pt-3 border-t border-border/50",
          itemClassName,
        )}
      >
        <IconComponent
          aria-hidden="true"
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0",
            wrap && "mt-0.5",
          )}
        />
        {isLinked ? (
          <LinkComponent
            href={item.href}
            title={fullValue}
            className={cn("text-sm text-primary hover:underline min-w-0", valueClass)}
          >
            {item.primary}
          </LinkComponent>
        ) : (
          <span
            title={fullValue}
            className={cn("text-sm text-foreground min-w-0", valueClass)}
          >
            {item.primary}
          </span>
        )}
      </li>
    );
  }

  // comfortable
  return (
    <li
      className={cn(
        "flex gap-3 items-start",
        separated && "pt-4 border-t border-border/50",
        itemClassName,
      )}
    >
      <IconComponent
        aria-hidden="true"
        className="w-5 h-5 text-primary shrink-0 mt-0.5"
      />
      <div className="min-w-0 flex-1">
        {isLinked ? (
          <LinkComponent
            href={item.href}
            className="font-medium text-foreground hover:text-primary transition-colors block"
          >
            {item.primary}
          </LinkComponent>
        ) : (
          <p className="font-medium text-foreground">{item.primary}</p>
        )}
        {item.secondary && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {item.secondary}
          </p>
        )}
        {item.action && <div className="mt-1">{item.action}</div>}
      </div>
    </li>
  );
}
