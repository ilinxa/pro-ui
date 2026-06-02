import { FileEdit, CalendarClock, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentStatus, ContentCardNewsLabels } from "../types";

interface StatusBadgeProps {
  status: ContentStatus | undefined;
  labels: Required<ContentCardNewsLabels>;
  className?: string;
}

/**
 * Status badge — editor-mode-only. Renders nothing for `"published"` (the
 * implicit baseline) or when `status` is undefined.
 *
 * RSC-compatible (no `"use client"`); pure presentation.
 */
export function StatusBadge({ status, labels, className }: StatusBadgeProps) {
  if (!status || status === "published") return null;

  const config = (() => {
    switch (status) {
      case "draft":
        return {
          label: labels.statusDraft,
          Icon: FileEdit,
          tone: "bg-muted text-muted-foreground ring-border",
        };
      case "scheduled":
        return {
          label: labels.statusScheduled,
          Icon: CalendarClock,
          tone: "bg-amber-500 text-amber-950 ring-amber-700/40",
        };
      case "archived":
        return {
          label: labels.statusArchived,
          Icon: Archive,
          tone: "bg-secondary text-secondary-foreground ring-border",
        };
    }
  })();

  if (!config) return null;
  const { label, Icon, tone } = config;

  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded px-1.5 text-[10px] font-semibold uppercase tracking-wide leading-none ring-1",
        tone,
        className,
      )}
    >
      <Icon className="size-2.5" aria-hidden />
      {label}
    </span>
  );
}
