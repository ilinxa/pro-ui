"use client";

import { HardDrive } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DEFAULT_MEDIA_LIBRARY_LABELS } from "../types";
import { fillTemplate, formatBytes } from "../lib/format";
import { useMediaLibrary } from "../hooks/use-media-library";

export interface QuotaBarProps {
  used: number;
  total: number;
  /** Full caption override; defaults to the filled `quotaUsed` template. */
  label?: string;
  className?: string;
}

/** Tier C — standalone storage-quota bar (no context). */
export function QuotaBar({ used, total, label, className }: QuotaBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const caption =
    label ??
    fillTemplate(DEFAULT_MEDIA_LIBRARY_LABELS.quotaUsed, {
      used: formatBytes(used),
      total: formatBytes(total),
    });

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm",
        className,
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <HardDrive className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm text-foreground">{caption}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {pct}%
          </span>
        </div>
        <Progress value={pct} className="mt-2 h-1.5" />
      </div>
    </div>
  );
}

/** Tier B — context-connected quota bar. Renders nothing if `storage` is unset. */
export function MediaLibraryQuotaBar({ className }: { className?: string }) {
  const { storage, labels } = useMediaLibrary();
  if (!storage) return null;
  const caption = fillTemplate(labels.quotaUsed, {
    used: formatBytes(storage.used),
    total: formatBytes(storage.total),
  });
  return (
    <QuotaBar
      used={storage.used}
      total={storage.total}
      label={caption}
      className={className}
    />
  );
}
