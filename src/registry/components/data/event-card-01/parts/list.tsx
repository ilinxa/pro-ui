"use client";

import type { ElementType, MouseEvent, ReactNode } from "react";
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EventCard01Labels,
  EventCardItem,
} from "../types";
import {
  EVENT_STATUS_CONFIG,
  type EventStatus,
} from "../lib/event-status";
import { ImageFallback } from "../lib/image-fallback";

interface ListPartProps {
  event: EventCardItem;
  status: EventStatus;
  daysUntil: number;
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
  imageClassName?: string;
  className?: string;
  actions?: ReactNode;
  loading: "lazy" | "eager";
}

export function EventCardList({
  event,
  status,
  daysUntil,
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
  imageClassName,
  className,
  actions,
  loading,
}: ListPartProps) {
  const statusEntry = EVENT_STATUS_CONFIG[status];
  const StatusIcon = statusEntry.icon;
  const showCapacity = event.capacity != null && event.registered != null;
  const spotsLeft = showCapacity
    ? (event.capacity ?? 0) - (event.registered ?? 0)
    : null;
  const hasActions = actions != null;

  const handleClick = onClick
    ? (e: MouseEvent<HTMLAnchorElement>) => onClick(event, e)
    : undefined;

  return (
    <article
      className={cn(
        "relative group grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 py-3 px-3 border-b border-border/50 last:border-0 motion-safe:hover:bg-muted/30 transition-colors rounded-lg items-center",
        statusEntry.cardClassName,
        featured && "border-l-4 border-l-primary",
        className,
      )}
    >
      {/* Thumbnail left — square */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0">
        {event.image ? (
          <img
            src={event.image}
            alt={event.imageAlt ?? event.title}
            loading={loading}
            className={cn(
              "w-full h-full object-cover",
              imageClassName,
            )}
          />
        ) : (
          <ImageFallback className={imageClassName} />
        )}
      </div>

      {/* Content middle */}
      <div className="flex flex-col justify-center min-w-0">
        {/* Top row: status + type badges */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium",
              statusEntry.className,
            )}
          >
            <StatusIcon aria-hidden="true" className="w-3 h-3" />
            {labels[status]}
          </span>
          <span
            className={cn(
              "border rounded text-[10px] px-1.5 py-0.5 truncate max-w-[120px]",
              typeStyle?.className ??
                "bg-muted text-muted-foreground border-border",
            )}
          >
            {event.type}
          </span>
        </div>

        {/* Title */}
        <h4
          id={titleId}
          className={cn(
            "text-sm font-semibold line-clamp-1 mb-1 motion-safe:group-hover:text-primary transition-colors",
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

        {/* Inline event-specific meta row — date / time / location / spots */}
        <ul
          role="list"
          className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground"
        >
          <li className="flex items-center gap-1">
            <Calendar
              aria-hidden="true"
              className="w-3 h-3 text-primary shrink-0"
            />
            <span>{formattedDate}</span>
          </li>
          {event.time && (
            <li className="flex items-center gap-1">
              <Clock
                aria-hidden="true"
                className="w-3 h-3 text-primary shrink-0"
              />
              <span>{event.time}</span>
            </li>
          )}
          {event.location && (
            <li className="flex items-center gap-1 min-w-0">
              <MapPin
                aria-hidden="true"
                className="w-3 h-3 text-primary shrink-0"
              />
              <span className="truncate max-w-[140px]">{event.location}</span>
            </li>
          )}
          {showCapacity && (
            <li
              className={cn(
                "flex items-center gap-1 font-medium",
                spotsLeft != null && spotsLeft <= 5 && spotsLeft > 0
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              <Users aria-hidden="true" className="w-3 h-3 shrink-0" />
              <span>
                {spotsLeft != null && spotsLeft > 0
                  ? `${spotsLeft} ${labels.spotsLeftSuffix}`
                  : labels.spotsLeftFull}
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* Right slot — actions OR status-aware indicator OR days-until OR chevron */}
      <div className="flex items-center justify-end self-center shrink-0">
        {hasActions ? (
          <div className="z-10 flex gap-1.5">{actions}</div>
        ) : status === "ongoing" ? (
          <span className="bg-accent/20 text-accent-foreground rounded-full px-2.5 py-1 text-[10px] font-semibold inline-flex items-center gap-1">
            <span
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full bg-accent-foreground motion-safe:animate-pulse"
            />
            {labels.ongoingIndicator}
          </span>
        ) : status === "expired" ? (
          <ArrowRight
            aria-hidden="true"
            className="w-4 h-4 text-muted-foreground motion-safe:group-hover:text-primary motion-safe:group-hover:translate-x-1 transition-all rtl:rotate-180"
          />
        ) : (
          <div className="text-center px-2 min-w-12">
            <div className="text-base font-bold leading-none text-foreground">
              {daysUntil}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {labels.daysUntilSuffix}
            </div>
          </div>
        )}
      </div>

      {/* Link overlay covers whole row */}
      <LinkComponent
        href={href}
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
        onClick={handleClick}
        className="absolute inset-0 z-0 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
      />
    </article>
  );
}
