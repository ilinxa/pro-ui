"use client";

import { Fragment, memo } from "react";
import { MoreHorizontal } from "lucide-react";
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
import type { Post, PostCard01Labels } from "../types";

export interface PostHeaderProps {
  post: Post;
  kebabOpen: boolean;
  onKebabOpenChange: (next: boolean) => void;
  kebabItems: CommentMenuItem[];
  headingAs: "h2" | "h3" | "h4";
  formattedTime: string;
  authorId: string;
  labels: Required<
    Pick<PostCard01Labels, "verifiedBadgeLabel">
  >;
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
  compact = false,
  className,
}: PostHeaderProps) {
  const avatarSize = compact ? "h-8 w-8" : "h-10 w-10";
  const nameSize = compact ? "text-sm" : "text-sm";
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className={cn(avatarSize, "shrink-0")}>
          {post.author.avatar ? (
            <AvatarImage src={post.author.avatar} alt="" />
          ) : null}
          <AvatarFallback>{initials(post.author.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <Heading
              id={authorId}
              className={cn("font-semibold truncate", nameSize)}
            >
              {post.author.name}
            </Heading>
            {post.author.isVerified ? (
              <VerifiedBadge ariaLabel={labels.verifiedBadgeLabel} />
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">
            {post.author.username ? `@${post.author.username} · ` : ""}
            {formattedTime}
          </span>
        </div>
      </div>
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
  );
}

export const PostHeader = memo(PostHeaderInner);
PostHeader.displayName = "PostHeader";
