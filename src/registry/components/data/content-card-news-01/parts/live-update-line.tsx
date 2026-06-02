import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { defaultRelativeTime } from "../hooks/use-relative-time";
import { toDate } from "../lib/format-default";
import type { ContentCardItem, ContentCardNewsLabels } from "../types";

interface LiveUpdateLineProps {
  item: ContentCardItem;
  labels: Required<ContentCardNewsLabels>;
  /** Optional custom relative-time formatter (root passes its resolved one). */
  formatRelativeTime?: (date: Date, now?: Date) => string;
  className?: string;
}

/**
 * Live-update sub-line — rendered below the date when `isLive === true` AND
 * `lastLiveUpdateAt` is set. Renders "Updated 3m ago · 14 updates" using the
 * `liveUpdatedTemplate` label (placeholders `{time}` + `{count}`).
 *
 * Visual: small pulsing dot prefix for the live signal. `motion-reduce`
 * removes the pulse.
 *
 * RSC-compatible.
 */
export function LiveUpdateLine({
  item,
  labels,
  formatRelativeTime,
  className,
}: LiveUpdateLineProps) {
  if (!item.isLive || !item.lastLiveUpdateAt) return null;

  const date = toDate(item.lastLiveUpdateAt);
  if (!date) return null;

  const time = (formatRelativeTime ?? defaultRelativeTime)(date);
  const count = item.liveUpdateCount ?? 0;
  const text = labels.liveUpdatedTemplate
    .replace("{time}", time)
    .replace("{count}", String(count));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground",
        className,
      )}
    >
      <span
        className="relative inline-flex size-2 rounded-full bg-red-500 motion-safe:animate-pulse"
        aria-hidden
      />
      <Radio className="size-3" aria-hidden />
      {text}
    </span>
  );
}
