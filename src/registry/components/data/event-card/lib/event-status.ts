import { AlertCircle, CheckCircle, Timer, XCircle } from "lucide-react";
import type { ComponentType } from "react";
import type { EventCardItem } from "../types";

export type EventStatus =
  | "expired"
  | "ongoing"
  | "upcoming"
  | "open"
  | "full"
  | "lastSpots";

export interface EventStatusConfigEntry {
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  className: string;
  cardClassName?: string;
}

export const EVENT_STATUS_CONFIG: Record<EventStatus, EventStatusConfigEntry> = {
  expired: {
    label: "Ended",
    icon: XCircle,
    className: "bg-muted text-muted-foreground",
    cardClassName: "opacity-60 grayscale-30",
  },
  ongoing: {
    label: "Live now",
    icon: Timer,
    className: "bg-accent text-accent-foreground motion-safe:animate-pulse",
  },
  upcoming: {
    label: "Soon",
    icon: AlertCircle,
    className: "bg-warning text-warning-foreground",
  },
  open: {
    label: "Registration open",
    icon: CheckCircle,
    className: "bg-primary text-primary-foreground",
  },
  full: {
    label: "Sold out",
    icon: XCircle,
    className: "bg-destructive text-destructive-foreground",
  },
  lastSpots: {
    label: "Last spots",
    icon: AlertCircle,
    className: "bg-warning text-warning-foreground",
  },
};

export function getEventStatus(
  event: EventCardItem,
  now: Date = new Date(),
): EventStatus {
  const eventDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : new Date(event.date);
  eventDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  if (now > endDate) return "expired";
  if (now >= eventDate && now <= endDate) return "ongoing";

  if (event.capacity != null && event.registered != null) {
    const spotsLeft = event.capacity - event.registered;
    const percentFull =
      event.capacity === 0 ? 100 : (event.registered / event.capacity) * 100;
    if (spotsLeft <= 0) return "full";
    if (percentFull >= 80) return "lastSpots";
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysUntil <= 7) return "upcoming";

  return "open";
}
