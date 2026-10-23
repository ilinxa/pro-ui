"use client";

import { Inbox, ShieldOff, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSidebarContextOrNull } from "../contexts/sidebar-nav-context";
import { DEFAULT_APP_SIDEBAR_LABELS } from "../lib/labels";
import type { AppSidebarEmptyReason } from "../types";

interface SidebarEmptyStateProps {
  reason: AppSidebarEmptyReason;
  className?: string;
}

// v0.5.0 (C2) - icons only; the copy lives in `labels.emptyState`.
const REASON_ICON: Record<
  AppSidebarEmptyReason,
  React.ComponentType<{ className?: string }>
> = {
  "no-items": Inbox,
  "all-filtered-by-permission": ShieldOff,
  "all-hidden": EyeOff,
  "all-filtered-by-loading": Inbox,
};

/**
 * Default empty-state renderer — per L48 reason branching.
 *
 * Override via `renderEmptyState` slot (L13 priority).
 * Each reason gets a distinct icon + title + body for diagnostic clarity.
 */
export function SidebarEmptyState({ reason, className }: SidebarEmptyStateProps) {
  const ctx = useAppSidebarContextOrNull();
  const labels = ctx?.labels ?? DEFAULT_APP_SIDEBAR_LABELS;
  const IconComp = REASON_ICON[reason];
  const { title, body } = labels.emptyState[reason];
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
      {body ? <p className="text-xs text-muted-foreground">{body}</p> : null}
    </div>
  );
}
