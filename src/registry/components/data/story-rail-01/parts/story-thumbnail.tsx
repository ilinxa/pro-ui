"use client";

import { memo, type ElementType } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { StoryRail01Labels, StoryRailItem } from "../types";

export interface StoryThumbnailProps {
  item: StoryRailItem;
  index: number;
  baseId: string;
  onItemClick?: (item: StoryRailItem, index: number) => void;
  getHref?: (item: StoryRailItem) => string;
  linkComponent?: ElementType;
  labels: Required<Omit<StoryRail01Labels, "thumbnailAriaLabel">> & {
    thumbnailAriaLabel?: (item: StoryRailItem) => string;
  };
  className?: string;
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") || "?"
  );
}

function defaultAriaLabel(item: StoryRailItem): string {
  return `${item.username}, ${item.hasUnread ? "unread story" : "viewed"}`;
}

function StoryThumbnailInner({
  item,
  index,
  baseId,
  onItemClick,
  getHref,
  linkComponent,
  labels,
  className,
}: StoryThumbnailProps) {
  const isUnread = !!item.hasUnread;
  const ariaLabel = (labels.thumbnailAriaLabel ?? defaultAriaLabel)(item);
  const hasLink = !!getHref;
  const href = hasLink ? getHref!(item) : undefined;
  const handleClick = () => onItemClick?.(item, index);

  const inner = (
    <>
      <div
        className={cn(
          "rounded-2xl p-0.5 transition-all",
          isUnread
            ? "bg-linear-to-br from-accent via-warning to-destructive"
            : "bg-muted",
        )}
      >
        <div className="h-28 w-20 overflow-hidden rounded-[14px] border-2 border-card bg-card">
          <img
            src={item.previewImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Avatar className="h-5 w-5 border border-card">
          {item.avatar ? <AvatarImage src={item.avatar} alt="" /> : null}
          <AvatarFallback className="text-[8px]">
            {initials(item.username)}
          </AvatarFallback>
        </Avatar>
        <span
          id={`${baseId}-name`}
          className="max-w-14 truncate text-center text-xs font-medium"
        >
          {item.username}
        </span>
      </div>
    </>
  );

  if (hasLink && href) {
    const LinkComponent = linkComponent ?? "a";
    return (
      <LinkComponent
        href={href}
        onClick={onItemClick ? handleClick : undefined}
        aria-label={ariaLabel}
        className={cn(
          "group flex shrink-0 flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl",
          className,
        )}
      >
        {inner}
      </LinkComponent>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(
        "group flex shrink-0 flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl",
        className,
      )}
    >
      {inner}
    </button>
  );
}

export const StoryThumbnail = memo(StoryThumbnailInner);
StoryThumbnail.displayName = "StoryThumbnail";
