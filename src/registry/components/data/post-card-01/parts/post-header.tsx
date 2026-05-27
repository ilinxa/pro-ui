"use client";

import { Fragment, memo } from "react";
import { MapPin, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CommentMenuItem } from "@/registry/components/data/comment-thread-01";
import { VerifiedBadge } from "./verified-badge";
import { PinnedBadge } from "./pinned-badge";
import { VisibilityBadge } from "./visibility-badge";
import { EditedSuffix } from "./edited-suffix";
import type { Post, PostCard01Labels, PostLocation } from "../types";

export interface PostHeaderProps {
  post: Post;
  kebabOpen: boolean;
  onKebabOpenChange: (next: boolean) => void;
  kebabItems: CommentMenuItem[];
  headingAs: "h2" | "h3" | "h4";
  formattedTime: string;
  authorId: string;
  labels: Required<
    Pick<
      PostCard01Labels,
      | "verifiedBadgeLabel"
      | "pinnedBadgeLabel"
      | "editedSuffix"
      | "replyingTo"
      | "visibilityPublic"
      | "visibilityFollowers"
      | "visibilityFriends"
      | "visibilityCircle"
      | "visibilityOnlyMe"
      | "visibilityPrivate"
      | "visibilityCustom"
    >
  >;
  /** Fired when the location chip is tapped. */
  onLocationClick?: (location: PostLocation) => void;
  /** Fired when the mention in the "Replying to" sub-line is tapped. */
  onMentionClick?: (mentionId: string) => void;
  compact?: boolean;
  className?: string;
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") || "?"
  );
}

function PostHeaderInner({
  post,
  kebabOpen,
  onKebabOpenChange,
  kebabItems,
  headingAs: Heading,
  formattedTime,
  authorId,
  labels,
  onLocationClick,
  onMentionClick,
  compact = false,
  className,
}: PostHeaderProps) {
  const avatarSize = compact ? "h-8 w-8" : "h-10 w-10";
  const nameSize = compact ? "text-sm" : "text-sm";

  // Per description §1.3 render-surface table:
  //   - replyTo: feed / detail only — hidden on compact / list
  //   - location: feed / detail / compact / list — all render; compact/list truncate
  // (compact=true is passed by both compact AND list variants — they share the trimmed header.)
  const showReplyTo = !compact && post.replyTo !== undefined;
  const showLocation = post.location !== undefined;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {post.isPinned ? (
        <PinnedBadge label={labels.pinnedBadgeLabel} />
      ) : null}

      {showReplyTo && post.replyTo ? (
        <div
          className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground"
          // F-11 closure: truncation lives on the username span only; the
          // "Replying to" label stays full-width since it's short + localized.
        >
          <span className="shrink-0">{labels.replyingTo}</span>
          <button
            type="button"
            onClick={
              onMentionClick && post.replyTo
                ? () => onMentionClick(post.replyTo!.author.id)
                : undefined
            }
            className={cn(
              "min-w-0 truncate font-medium text-foreground",
              onMentionClick
                ? "hover:underline focus:underline focus:outline-none"
                : "cursor-default",
            )}
            disabled={!onMentionClick}
          >
            @{post.replyTo.author.username ?? post.replyTo.author.name}
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {/* Identity column — truncation discipline per F-11 closure. */}
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className={cn(avatarSize, "shrink-0")}>
            {post.author.avatar ? (
              <AvatarImage src={post.author.avatar} alt="" />
            ) : null}
            <AvatarFallback>{initials(post.author.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            {/* Name + verified badge row. min-w-0 on name span; verified stays shrink-0. */}
            <div className="flex min-w-0 items-center gap-1">
              <Heading
                id={authorId}
                className={cn(
                  "min-w-0 truncate font-semibold",
                  nameSize,
                )}
              >
                {post.author.name}
              </Heading>
              {post.author.isVerified ? (
                <span className="shrink-0">
                  <VerifiedBadge ariaLabel={labels.verifiedBadgeLabel} />
                </span>
              ) : null}
            </div>

            {/* Sub-line — username · time + new v0.2.0 zone (edited / visibility / location). */}
            <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <span className="min-w-0 truncate">
                {post.author.username ? `@${post.author.username} · ` : ""}
                {formattedTime}
              </span>
              {post.editedAt ? (
                <EditedSuffix
                  label={labels.editedSuffix}
                  editedAt={post.editedAt}
                />
              ) : null}
              {post.visibility ? (
                <VisibilityBadge
                  visibility={post.visibility}
                  labels={{
                    visibilityPublic: labels.visibilityPublic,
                    visibilityFollowers: labels.visibilityFollowers,
                    visibilityFriends: labels.visibilityFriends,
                    visibilityCircle: labels.visibilityCircle,
                    visibilityOnlyMe: labels.visibilityOnlyMe,
                    visibilityPrivate: labels.visibilityPrivate,
                    visibilityCustom: labels.visibilityCustom,
                  }}
                />
              ) : null}
              {showLocation && post.location ? (
                <button
                  type="button"
                  onClick={
                    onLocationClick && post.location
                      ? () => onLocationClick(post.location!)
                      : undefined
                  }
                  disabled={!onLocationClick}
                  className={cn(
                    "inline-flex min-w-0 shrink items-center gap-0.5 truncate",
                    onLocationClick
                      ? "hover:text-foreground focus:text-foreground focus:outline-none"
                      : "cursor-default",
                  )}
                >
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{post.location.name}</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Kebab — shrink-0 so it never gets pushed off-screen. */}
        {kebabItems.length > 0 ? (
          <DropdownMenu open={kebabOpen} onOpenChange={onKebabOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative z-10 h-8 w-8 shrink-0"
                aria-label="Post actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-20">
              {kebabItems.map((item, i) => {
                const showSeparatorBefore =
                  item.destructive &&
                  i > 0 &&
                  !kebabItems[i - 1]?.destructive;
                return (
                  <Fragment key={`${item.label}-${i}`}>
                    {showSeparatorBefore ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuItem
                      onClick={item.onClick}
                      disabled={item.disabled}
                      className={cn(
                        item.destructive &&
                          "text-destructive focus:text-destructive",
                      )}
                    >
                      {item.icon ? (
                        <span className="mr-2">{item.icon}</span>
                      ) : null}
                      {item.label}
                    </DropdownMenuItem>
                  </Fragment>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}

export const PostHeader = memo(PostHeaderInner);
PostHeader.displayName = "PostHeader";
