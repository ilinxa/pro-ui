"use client";

import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import type { InfoList01Variant, InfoListItem } from "../types";

interface InfoRowProps {
  item: InfoListItem;
  variant: InfoList01Variant;
  separated: boolean;
  linkComponent: ElementType;
  itemClassName?: string;
}

export function InfoRow({
  item,
  variant,
  separated,
  linkComponent: LinkComponent,
  itemClassName,
}: InfoRowProps) {
  const IconComponent = item.icon;
  const isLinked = item.href != null && item.href.length > 0;

  if (variant === "compact") {
    return (
      <li
        className={cn(
          "flex items-center gap-3",
          separated && "pt-3 border-t border-border/50",
          itemClassName,
        )}
      >
        <IconComponent
          aria-hidden="true"
          className="w-4 h-4 text-muted-foreground shrink-0"
        />
        {isLinked ? (
          <LinkComponent
            href={item.href}
            className="text-sm text-primary hover:underline min-w-0 truncate"
          >
            {item.primary}
          </LinkComponent>
        ) : (
          <span className="text-sm text-foreground min-w-0 truncate">
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
