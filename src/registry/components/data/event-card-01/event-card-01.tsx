"use client";

import { memo, useId, useMemo } from "react";
import {
  DEFAULT_EVENT_CARD_LABELS,
  type EventCard01Props,
  type EventCard01Labels,
} from "./types";
import { getEventStatus } from "./lib/event-status";
import { getDaysUntilEvent, formatEventDate } from "./lib/format-default";
import { EventCardGrid } from "./parts/grid";
import { EventCardFeed } from "./parts/feed";
import { EventCardList } from "./parts/list";
import { EventCardCompact } from "./parts/compact";

function EventCard01Inner({
  event,
  variant,
  href,
  getHref,
  onClick,
  linkComponent = "a",
  formatDate,
  now,
  statusOverride,
  labels: labelsProp,
  typeStyles,
  titleClassName,
  imageClassName,
  className,
  ariaLabel,
  actions,
  loading = "lazy",
}: EventCard01Props) {
  const titleId = useId();

  const labels = useMemo<Required<EventCard01Labels>>(
    () => ({ ...DEFAULT_EVENT_CARD_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const status = useMemo(
    () => statusOverride ?? getEventStatus(event, now),
    [event, now, statusOverride],
  );

  const daysUntil = useMemo(
    () => getDaysUntilEvent(event.date, now),
    [event.date, now],
  );

  const formattedDate = useMemo(
    () => (formatDate ? formatDate(event.date) : formatEventDate(event.date)),
    [event.date, formatDate],
  );

  const resolvedHref =
    href ?? (getHref ? getHref(event) : undefined) ?? "#";

  const typeStyle = typeStyles?.[event.type];
  const featured = event.featured === true;

  const sharedProps = {
    event,
    status,
    daysUntil,
    formattedDate,
    featured,
    labels,
    href: resolvedHref,
    linkComponent,
    onClick,
    ariaLabel,
    titleId,
    titleClassName,
    imageClassName,
    className,
    actions,
    loading,
  };

  if (variant === "feed") {
    return <EventCardFeed {...sharedProps} />;
  }

  if (variant === "list") {
    return <EventCardList {...sharedProps} typeStyle={typeStyle} />;
  }

  if (variant === "compact") {
    return <EventCardCompact {...sharedProps} typeStyle={typeStyle} />;
  }

  return <EventCardGrid {...sharedProps} typeStyle={typeStyle} />;
}

export const EventCard01 = memo(EventCard01Inner);
EventCard01.displayName = "EventCard01";

export default EventCard01;
