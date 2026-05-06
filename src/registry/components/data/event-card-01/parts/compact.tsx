"use client";

import type { ElementType, MouseEvent, ReactNode } from "react";
import { Calendar, Clock, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EventCard01Labels,
  EventCardItem,
} from "../types";
import {
  EVENT_STATUS_CONFIG,
  type EventStatus,
} from "../lib/event-status";

interface CompactPartProps {
  event: EventCardItem;
  status: EventStatus;
  formattedDate: string;
  typeStyle: { className: string } | undefined;
  featured: boolean;
  labels: Required<EventCard01Labels>;
  href: string;
  linkComponent: ElementType;
  onClick?: (event: EventCardItem, mouseEvent: MouseEvent) => void;
  ariaLabel?: string;
  titleId: string;
  titleClassName?: string;
  className?: string;
  actions?: ReactNode;
}

export function EventCardCompact({
  event,
  status,
  formattedDate,
  typeStyle,
  featured,
  labels,
  href,
  linkComponent: LinkComponent,
  onClick,
  ariaLabel,
  titleId,
  titleClassName,
  className,
  actions,
}: CompactPartProps) {
  const statusEntry = EVENT_STATUS_CONFIG[status];
  const hasActions = actions != null;

  const handleClick = onClick
    ? (e: MouseEvent<HTMLAnchorElement>) => onClick(event, e)
    : undefined;

  return (
    <article
      className={cn(
        "relative group py-4 px-2 border-b border-border/50 last:border-0 motion-safe:hover:bg-muted/30 transition-colors rounded-md",
        statusEntry.cardClassName,
        className,
      )}
    >
      {/* Top row: title + type badge (or actions) */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4
          id={titleId}
          className={cn(
            "text-sm font-semibold line-clamp-2 motion-safe:group-hover:text-primary transition-colors flex-1 min-w-0",
            titleClassName,
          )}
        >
          {featured && (
            <Star
              aria-hidden="true"
              className="inline w-3.5 h-3.5 fill-primary text-primary mr-1 align-baseline"
            />
          )}
          {event.title}
          {featured && (
            <span className="sr-only"> ({labels.featuredAriaLabel})</span>
          )}
        </h4>

        {hasActions ? (
          <div className="z-10 flex gap-1 shrink-0">{actions}</div>
        ) : (
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded shrink-0",
              typeStyle?.className ??
                "bg-muted text-muted-foreground",
            )}
          >
            {event.type}
          </span>
        )}
      </div>

      {/* Inline meta — vertical stack */}
      <ul
        role="list"
        className="space-y-1 text-xs text-muted-foreground"
      >
        {hasActions && (
          <li className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block px-1.5 py-0.5 rounded text-[10px]",
                typeStyle?.className ??
                  "bg-muted text-muted-foreground",
              )}
            >
              {event.type}
            </span>
          </li>
        )}
        <li className="flex items-center gap-1.5">
          <Calendar aria-hidden="true" className="w-3 h-3 shrink-0" />
          <span>{formattedDate}</span>
        </li>
        {event.time && (
          <li className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="w-3 h-3 shrink-0" />
            <span>{event.time}</span>
          </li>
        )}
        {event.location && (
          <li className="flex items-center gap-1.5 min-w-0">
            <MapPin aria-hidden="true" className="w-3 h-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </li>
        )}
      </ul>

      {/* Link overlay covers whole row */}
      <LinkComponent
        href={href}
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
        onClick={handleClick}
        className="absolute inset-0 z-0 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
      />
    </article>
  );
}
