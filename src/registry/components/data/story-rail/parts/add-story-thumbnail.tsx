"use client";

import { memo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AddStoryThumbnailProps {
  /** Avatar shown at 50% opacity inside the dashed-border placeholder. */
  userAvatar?: string;
  onClick?: () => void;
  /** Visible label below. Default "Add story". */
  label?: string;
  /** aria-label on the button. Default "Add a story". */
  ariaLabel?: string;
  className?: string;
}

function AddStoryThumbnailInner({
  userAvatar,
  onClick,
  label = "Add story",
  ariaLabel = "Add a story",
  className,
}: AddStoryThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "group flex shrink-0 flex-col items-center gap-2",
        className,
      )}
    >
      <div className="relative">
        <div className="h-28 w-20 overflow-hidden rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors group-hover:border-primary/50">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt=""
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
          className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md"
        >
          <Plus className="h-3.5 w-3.5" />
        </span>
      </div>
      <span className="w-20 truncate text-center text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </button>
  );
}

export const AddStoryThumbnail = memo(AddStoryThumbnailInner);
AddStoryThumbnail.displayName = "AddStoryThumbnail";
