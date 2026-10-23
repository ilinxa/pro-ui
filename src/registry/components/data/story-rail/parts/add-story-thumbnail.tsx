"use client";

import { memo, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_STORY_RAIL_LABELS } from "../types";
import { useStoryRailLabels } from "./story-rail-context";

export interface AddStoryThumbnailProps {
  /** Avatar shown at 50% opacity inside the dashed-border placeholder. */
  userAvatar?: string;
  onClick?: () => void;
  /**
   * Visible label below. Default: the enclosing rail's `labels.addStoryLabel`
   * (when rendered in `<StoryRail leading>`), else "Add story".
   */
  label?: string;
  /**
   * aria-label on the button. Default: the enclosing rail's
   * `labels.addStoryAriaLabel`, else "Add story".
   */
  ariaLabel?: string;
  className?: string;
}

function AddStoryThumbnailInner({
  userAvatar,
  onClick,
  label,
  ariaLabel,
  className,
}: AddStoryThumbnailProps) {
  const railLabels = useStoryRailLabels() ?? DEFAULT_STORY_RAIL_LABELS;
  const [avatarFailed, setAvatarFailed] = useState<string | null>(null);
  const showAvatar = !!userAvatar && avatarFailed !== userAvatar;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? railLabels.addStoryAriaLabel}
      className={cn(
        "group flex shrink-0 flex-col items-center gap-2 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <div className="relative">
        <div className="h-28 w-20 overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 motion-safe:transition-colors group-hover:border-primary/50">
          {showAvatar ? (
            <img
              src={userAvatar}
              alt=""
              width={80}
              height={112}
              decoding="async"
              onError={() => setAvatarFailed(userAvatar ?? null)}
              className="h-full w-full object-cover opacity-50"
            />
          ) : (
            <div
              className="h-full w-full bg-muted"
              aria-hidden="true"
            />
          )}
        </div>
        <span
          aria-hidden="true"
          className="absolute end-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md"
        >
          <Plus className="h-3.5 w-3.5" />
        </span>
      </div>
      <span className="w-20 truncate text-center text-xs font-medium text-muted-foreground">
        {label ?? railLabels.addStoryLabel}
      </span>
    </button>
  );
}

export const AddStoryThumbnail = memo(AddStoryThumbnailInner);
AddStoryThumbnail.displayName = "AddStoryThumbnail";
