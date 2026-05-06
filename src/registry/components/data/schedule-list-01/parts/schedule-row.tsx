"use client";

import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ScheduleListItem } from "../types";

interface ScheduleRowProps {
  item: ScheduleListItem;
  framed: boolean;
  timeSeparator: string;
  renderTime?: (item: ScheduleListItem) => ReactNode;
  linkComponent: ElementType;
  itemClassName?: string;
}

export function ScheduleRow({
  item,
  framed,
  timeSeparator,
  renderTime,
  linkComponent: LinkComponent,
  itemClassName,
}: ScheduleRowProps) {
  const IconComponent = item.icon;
  const isLinked = item.href != null && item.href.length > 0;

  const timeContent = renderTime ? (
    renderTime(item)
  ) : (
    <span className="text-lg font-bold text-primary">
      {item.time}
      {item.endTime ? `${timeSeparator}${item.endTime}` : null}
    </span>
  );

  return (
    <li
      className={cn(
        "relative group flex items-start gap-4",
        framed &&
          "p-4 bg-card rounded-xl border border-border/50 motion-safe:hover:border-border transition-colors",
        itemClassName,
      )}
    >
      {IconComponent && (
        <div className="shrink-0 mt-1">
          <IconComponent
            aria-hidden="true"
            className="w-5 h-5 text-primary"
          />
        </div>
      )}

      <div className="w-20 shrink-0">{timeContent}</div>

      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-foreground motion-safe:group-hover:text-primary transition-colors">
          {item.title}
        </h4>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {item.description}
          </p>
        )}
      </div>

      {isLinked && (
        <LinkComponent
          href={item.href}
          aria-label={item.title}
          className={cn(
            "absolute inset-0 z-0 outline-none",
            framed
              ? "rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              : "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          )}
        />
      )}
    </li>
  );
}
