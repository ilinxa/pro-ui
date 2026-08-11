"use client";

import { memo } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  Comment,
  CommentMenuItem,
  CommentThreadCurrentUser,
  CommentThreadLabels,
} from "../types";

export interface CommentKebabProps {
  comment: Comment;
  currentUser?: CommentThreadCurrentUser;
  isOwn: boolean;
  depth: number;
  labels: Required<Omit<CommentThreadLabels, "formatRelativeTime">>;
  /** Default kebab onClick handlers — used when commentActions is not provided. */
  onDelete: () => void;
  onReport: () => void;
  /** True when host wired onReportComment — drives the default Report item visibility. */
  onReportPresent: boolean;
  /** Override the default kebab items entirely. Returning [] hides the kebab. */
  commentActions?: (
    comment: Comment,
    helpers: {
      currentUser?: CommentThreadCurrentUser;
      isOwn: boolean;
      depth: number;
    },
  ) => CommentMenuItem[];
  className?: string;
}

function CommentKebabInner({
  comment,
  currentUser,
  isOwn,
  depth,
  labels,
  onDelete,
  onReport,
  onReportPresent,
  commentActions,
  className,
}: CommentKebabProps) {
  const items: CommentMenuItem[] = commentActions
    ? commentActions(comment, { currentUser, isOwn, depth })
    : [
        ...(onReportPresent
          ? [{ label: labels.report, onClick: onReport }]
          : []),
        ...(isOwn
          ? [
              {
                label: labels.delete,
                destructive: true,
                onClick: onDelete,
              },
            ]
          : []),
      ];

  if (items.length === 0) return null;

  // F-cross-13: drop `asChild` + render the Radix/Base-UI primitive directly
  // as a <button>. The shadcn CLI rewrites `asChild` to `render={<Button …>}`
  // at install-time (Base UI idiom), which breaks consumers who installed the
  // Radix primitive. Inline button styling via `buttonVariants(…)` instead.
  const triggerClass = cn(
    buttonVariants({ variant: "ghost", size: "icon" }),
    "h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100",
    className,
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={triggerClass}
        aria-label={`Comment actions for ${comment.author.name}`}
      >
        <MoreHorizontal className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, i) => (
          <DropdownMenuItem
            key={`${item.label}-${i}`}
            onClick={item.onClick}
            disabled={item.disabled}
            className={cn(
              item.destructive &&
                "text-destructive focus:text-destructive",
            )}
          >
            {item.icon ? <span className="mr-2">{item.icon}</span> : null}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const CommentKebab = memo(CommentKebabInner);
CommentKebab.displayName = "CommentKebab";
