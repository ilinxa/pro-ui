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

interface FeedPartProps {
  event: EventCardItem;
  status: EventStatus;
  daysUntil: number;
  formattedDate: string;
  featured: boolean;
  labels: Required<EventCard01Labels>;
  formatDaysUntilSuffix: (count: number) => string;
  formatSpotsLeftSuffix: (count: number) => string;
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

export function EventCardFeed({
  event,
  status,
  daysUntil,
  formattedDate,
  featured,
  labels,
  formatDaysUntilSuffix,
  formatSpotsLeftSuffix,
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
}: FeedPartProps) {
  const statusEntry = EVENT_STATUS_CONFIG[status];
  const StatusIcon = statusEntry.icon;
  const showCapacity = event.capacity != null && event.registered != null;
  const spotsLeft = showCapacity
    ? (event.capacity ?? 0) - (event.registered ?? 0)
    : null;
  const cta = resolveCta(status, labels);
  const hasActions = actions != null;

  const handleClick = onClick
    ? (e: MouseEvent<HTMLAnchorElement>) => onClick(event, e)
    : undefined;

  return (
    <article
      className={cn(
        "relative group h-64 md:h-72 overflow-hidden lg:rounded-xl shadow-[inset_0_80px_60px_-40px_rgba(0,0,0,0.4)]",
        statusEntry.cardClassName,
        featured && "ring-2 ring-primary ring-inset",
        className,
      )}
    >
      {/* Background image */}
      {event.image ? (
        <img
          src={event.image}
          alt={event.imageAlt ?? event.title}
          loading={loading}
          className={cn(
            "absolute inset-0 w-full h-full object-cover motion-safe:group-hover:scale-105 transition-transform duration-700",
            imageClassName,
          )}
        />
      ) : (
        <ImageFallback className={cn("absolute inset-0", imageClassName)} />
      )}

      {/* Two layered gradients for depth + legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 shadow-[inset_0_60px_80px_-20px_rgba(0,0,0,0.6)]"
      />

      {/* Link overlay — covers whole card */}
      <LinkComponent
        href={href}
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
        onClick={handleClick}
        className="absolute inset-0 z-0 lg:rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-6">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium",
                statusEntry.className,
              )}
            >
              <StatusIcon aria-hidden="true" className="w-3.5 h-3.5" />
              {labels[status]}
            </span>
            <span className="bg-white/10 text-white border border-white/20 backdrop-blur-sm rounded-md text-xs px-2.5 py-0.5">
              {event.type}
            </span>
          </div>

          {hasActions ? (
            <div className="z-10 flex gap-1.5">{actions}</div>
          ) : status === "ongoing" ? (
            <div className="bg-accent/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-accent-foreground inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-current motion-safe:animate-pulse"
              />
              <span className="text-xs font-medium">
                {labels.ongoingIndicator}
              </span>
            </div>
          ) : status !== "expired" ? (
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 text-center">
              <div className="text-2xl font-bold text-white leading-none">
                {daysUntil}
              </div>
              <div className="text-xs text-white/70">
                {formatDaysUntilSuffix(daysUntil)}
              </div>
            </div>
          ) : null}
        </div>

        {/* Bottom block */}
        <div>
          <h3
            id={titleId}
            className={cn(
              "text-xl md:text-2xl font-bold text-white mb-3 line-clamp-2 motion-safe:group-hover:text-accent transition-colors",
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

          {/* Inline meta row */}
          <ul
            role="list"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/80 mb-4"
          >
            <li className="flex items-center gap-1.5">
              <Calendar aria-hidden="true" className="w-4 h-4" />
              <span>{formattedDate}</span>
            </li>
            {event.time && (
              <li className="flex items-center gap-1.5">
                <Clock aria-hidden="true" className="w-4 h-4" />
                <span>{event.time}</span>
              </li>
            )}
            {event.location && (
              <li className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{event.location}</span>
              </li>
            )}
            {showCapacity && (
              <li className="flex items-center gap-1.5">
                <Users aria-hidden="true" className="w-4 h-4" />
                <span>
                  {spotsLeft != null && spotsLeft > 0
                    ? `${spotsLeft} ${formatSpotsLeftSuffix(spotsLeft)}`
                    : labels.spotsLeftFull}
                </span>
              </li>
            )}
          </ul>

          {/* CTA + chevron */}
          <div className="flex items-center justify-between">
            <div
              aria-hidden="true"
              className={cn(
                buttonVariants({ variant: cta.variant, size: "sm" }),
                "pointer-events-none",
                status === "expired" &&
                  "bg-white/10 border-white/20 text-white hover:bg-white/10",
              )}
            >
              {cta.label}
            </div>
            <span className="flex items-center gap-1 text-white/60 text-sm motion-safe:group-hover:text-accent transition-colors">
              <ArrowRight
                aria-hidden="true"
                className="w-4 h-4 motion-safe:group-hover:translate-x-1 transition-transform rtl:rotate-180"
              />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
