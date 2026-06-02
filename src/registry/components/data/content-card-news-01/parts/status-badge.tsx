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
          tone: "bg-muted text-muted-foreground border-muted-foreground/20",
        };
      case "scheduled":
        return {
          label: labels.statusScheduled,
          Icon: CalendarClock,
          tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
        };
      case "archived":
        return {
          label: labels.statusArchived,
          Icon: Archive,
          tone: "bg-secondary text-secondary-foreground border-secondary",
        };
    }
  })();

  if (!config) return null;
  const { label, Icon, tone } = config;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        tone,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}
