import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PinnedBadgeProps {
  /** Localized label text. Default in DEFAULT_POST_CARD_LABELS is "Pinned". */
  label: string;
  className?: string;
}

/**
 * Sealed RSC-compatible pinned-state pill rendered above the post header
 * when `post.isPinned` is true. Decorative chip; no interactivity.
 */
export function PinnedBadge({ label, className }: PinnedBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center gap-1 self-start rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
      role="status"
      aria-label={label}
    >
      <Pin className="h-3 w-3" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

PinnedBadge.displayName = "PinnedBadge";
