"use client";

import type { ElementType, MouseEvent, ReactNode } from "react";
import { Calendar, Clock, MapPin, Star, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
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

interface GridPartProps {
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

function resolveCta(
  status: EventStatus,
  labels: Required<EventCard01Labels>,
): { label: string; variant: "default" | "secondary" | "outline" } {
  switch (status) {
    case "ongoing":
      return { label: labels.ctaJoin, variant: "default" };
    case "full":
      return { label: labels.ctaSoldOut, variant: "secondary" };
    case "expired":
      return { label: labels.ctaViewDetails, variant: "outline" };
    case "open":
    case "upcoming":
    case "lastSpots":
    default:
      return { label: labels.ctaRegister, variant: "default" };
  }
}

export function EventCardGrid({
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
}: GridPartProps) {
  const statusEntry = EVENT_STATUS_CONFIG[status];
  const StatusIcon = statusEntry.icon;
  const showCapacity = event.capacity != null && event.registered != null;
  const spotsLeft = showCapacity
    ? (event.capacity ?? 0) - (event.registered ?? 0)
    : 0;
  const percentFull = showCapacity
    ? event.capacity === 0
      ? 100
      : ((event.registered ?? 0) / (event.capacity ?? 1)) * 100
    : 0;
  const cta = resolveCta(status, labels);
  const hasActions = actions != null;

  const handleClick = onClick
    ? (e: MouseEvent<HTMLAnchorElement>) => onClick(event, e)
    : undefined;

  return (
    <article
      className={cn(
        "relative group bg-card rounded-2xl overflow-hidden shadow-sm motion-safe:hover:shadow-xl transition-all duration-500 border border-border/50 h-full flex flex-col",
        statusEntry.cardClassName,
        featured && "border-t-4 border-t-primary",
        className,
      )}
    >
      {/* Image area */}
      <div className="relative h-48 overflow-hidden">
        {event.image ? (
          <img
            src={event.image}
            alt={event.imageAlt ?? event.title}
            loading={loading}
            className={cn(
              "w-full h-full object-cover motion-safe:group-hover:scale-110 transition-transform duration-700",
              imageClassName,
            )}
          />
        ) : (
          <ImageFallback className={imageClassName} />
        )}

        {/* Gradient overlay for legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"
        />

        {/* Status badge — top-left */}
        <span
          className={cn(
            "absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium",
            statusEntry.className,
          )}
        >
          <StatusIcon aria-hidden="true" className="w-3.5 h-3.5" />
          {labels[status]}
        </span>

        {/* Type badge — top-right OR bottom-right when actions yields top */}
        <span
          className={cn(
            "absolute backdrop-blur-sm border rounded-md text-xs px-2.5 py-0.5",
            hasActions ? "bottom-4 right-4" : "top-4 right-4",
            typeStyle?.className ?? "bg-muted text-muted-foreground border-border",
          )}
        >
          {event.type}
        </span>

        {/* Actions slot — top-right, above link overlay */}
        {hasActions && (
          <div className="absolute top-4 right-4 z-10 flex gap-1.5">
            {actions}
          </div>
        )}

        {/* Days-until OR ongoing pill — bottom-left */}
        {status !== "expired" && status !== "ongoing" && (
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
            <div className="text-2xl font-bold leading-none">{daysUntil}</div>
            <div className="text-xs text-white/70">{labels.daysUntilSuffix}</div>
          </div>
        )}
        {status === "ongoing" && (
          <div className="absolute bottom-4 left-4 bg-accent/90 backdrop-blur-sm rounded-lg px-3 py-2 text-accent-foreground inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="w-2 h-2 rounded-full bg-current motion-safe:animate-pulse"
            />
            <span className="text-sm font-medium">{labels.ongoingIndicator}</span>
          </div>
        )}
      </div>

      {/* Link overlay — covers whole article, transparent, on top of content */}
      <LinkComponent
        href={href}
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
        onClick={handleClick}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
      />

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        <h3
          id={titleId}
          className={cn(
            "text-xl font-bold text-foreground mb-2 motion-safe:group-hover:text-primary transition-colors line-clamp-2",
            titleClassName,
          )}
        >
          {featured && (
            <Star
              aria-hidden="true"
              className="inline w-4 h-4 fill-primary text-primary mr-1.5 align-baseline"
            />
          )}
          {event.title}
          {featured && (
            <span className="sr-only"> ({labels.featuredAriaLabel})</span>
          )}
        </h3>

        {event.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Meta lines */}
        <ul role="list" className="space-y-2 mb-4">
          <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar
              aria-hidden="true"
              className="w-4 h-4 text-primary shrink-0"
            />
            <span>{formattedDate}</span>
          </li>
          {event.time && (
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock
                aria-hidden="true"
                className="w-4 h-4 text-primary shrink-0"
              />
              <span>{event.time}</span>
            </li>
          )}
          {event.location && (
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin
                aria-hidden="true"
                className="w-4 h-4 text-primary shrink-0"
              />
              <span className="truncate">{event.location}</span>
            </li>
          )}
        </ul>

        {/* Capacity bar */}
        {showCapacity && (
          <div className="mt-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users aria-hidden="true" className="w-4 h-4" />
                {event.registered} / {event.capacity}
              </span>
              {status !== "expired" && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    spotsLeft <= 5 && spotsLeft > 0
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {spotsLeft > 0
                    ? `${spotsLeft} ${labels.spotsLeftSuffix}`
                    : labels.spotsLeftFull}
                </span>
              )}
            </div>
            <Progress
              value={percentFull}
              className={cn("h-2", status === "expired" && "opacity-50")}
              aria-label={`${labels.capacityAriaPrefix}: ${event.registered} ${labels.capacityAriaSeparator} ${event.capacity}`}
            />
          </div>
        )}

        {/* Decorative CTA — visual only; click passes through to link overlay */}
        <div
          aria-hidden="true"
          className={cn(
            buttonVariants({ variant: cta.variant }),
            "w-full mt-4 pointer-events-none",
            !showCapacity && "mt-auto",
          )}
        >
          {cta.label}
        </div>
      </div>
    </article>
  );
}
