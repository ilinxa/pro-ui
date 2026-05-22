"use client";

import { Inbox, ShieldOff, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RichSidebarEmptyReason } from "../types";

interface SidebarEmptyStateProps {
  reason: RichSidebarEmptyReason;
  className?: string;
}

const REASON_COPY: Record<
  RichSidebarEmptyReason,
  { icon: React.ComponentType<{ className?: string }>; title: string; body: string }
> = {
  "no-items": {
    icon: Inbox,
    title: "No items",
    body: "Configure `items` prop to populate the navigation.",
  },
  "all-filtered-by-permission": {
    icon: ShieldOff,
    title: "Nothing visible",
    body: "All items filtered by current permissions.",
  },
  "all-hidden": {
    icon: EyeOff,
    title: "All items hidden",
    body: "Every item has `hidden: true`.",
  },
  "all-filtered-by-loading": {
    icon: Inbox,
    title: "No items",
    body: "Loading completed with no items.",
  },
};

/**
 * Default empty-state renderer — per L48 reason branching.
 *
 * Override via `renderEmptyState` slot (L13 priority).
 * Each reason gets a distinct icon + title + body for diagnostic clarity.
 */
export function SidebarEmptyState({ reason, className }: SidebarEmptyStateProps) {
  const { icon: IconComp, title, body } = REASON_COPY[reason];
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center",
        className,
      )}
    >
      <IconComp className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
