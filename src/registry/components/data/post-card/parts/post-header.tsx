"use client";

import { Fragment, memo, useRef, type ElementType, type ReactNode } from "react";
import { MapPin, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// F-S1 lock: cross-procomp import via relative + specific-file path.
import type { CommentMenuItem } from "../../comment-thread/types";
import { VerifiedBadge } from "./verified-badge";
import { PinnedBadge } from "./pinned-badge";
import { VisibilityBadge } from "./visibility-badge";
import { EditedSuffix } from "./edited-suffix";
import { toDate } from "../../comment-thread/lib/format-time";
import { useDirection } from "../hooks/use-direction";
import type { Post, PostCardLabels, PostLocation } from "../types";

export interface PostKebabProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  items: CommentMenuItem[];
  /** Accessible name of the trigger. */
  ariaLabel: string;
}

/**
 * The post's actions menu. Items with `hidden` are left out; a menu with nothing left renders
 * nothing. Built once by the card and handed to the header (and to `renderHeader`).
 */
export function PostKebab({ open, onOpenChange, items: allItems, ariaLabel }: PostKebabProps) {
  // The menu is portaled out of the card, so a `dir="rtl"` wrapper does not reach it: resolve the
  // direction from the trigger and put it on the content as a plain attribute (both backends).
  // Markup does not depend on it before mount (the content only exists once opened).
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dir = useDirection(triggerRef);
  const items = allItems.filter((item) => !item.hidden);
  if (items.length === 0) return null;
  // F-cross-13: drop `asChild` (shadcn CLI rewrites it to `render={…}` at install-time -
  // Base UI idiom - which breaks consumers who installed the Radix dropdown-menu primitive).
  // Render the trigger as the button directly with `buttonVariants(…)` for styling.
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        ref={triggerRef}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative z-10 h-11 w-11 shrink-0",
        )}
        aria-label={ariaLabel}
      >
        <MoreHorizontal className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        // `align` stays "end": with `dir` on the content, the positioner (floating-ui) treats the menu as
        // RTL and mirrors the alignment itself — flipping it here too undid that (browser re-verify).
        align="end"
        // `dir` is a plain DOM attribute on the portaled content (Radix types leave it out; Base UI takes it).
        {...({ dir } as Record<string, unknown>)}
        className="z-20"
      >
        {items.map((item, i) => {
          // Honor the explicit `separatorBefore` flag (the moderator section) and the implicit
          // destructive-boundary divider. Both can fire but only one separator renders.
          const showSeparatorBefore =
            i > 0 &&
            (item.separatorBefore ||
              (item.destructive && !items[i - 1]?.destructive));
          return (
            <Fragment key={`${item.label}-${i}`}>
              {showSeparatorBefore ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                  item.destructive && "text-destructive focus:text-destructive",
                )}
              >
                {item.icon ? <span className="me-2">{item.icon}</span> : null}
                {item.label}
              </DropdownMenuItem>
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface PostHeaderProps {
  post: Post;
  /** The default actions menu (see {@link PostKebab}), or `null` when it has no items. */
  kebab: ReactNode;
  headingAs: "h2" | "h3" | "h4";
  /**
   * The relative time, or `null` before the card knows "now" (the server and the first client
   * render): the `<time>` then renders empty.
   */
  formattedTime: string | null;
  authorId: string;
  locale: string;
  timeZone?: string;
  /** Where the avatar and the name link to, when the host provides it. */
  authorHref?: string;
  /** Polymorphic link element (the card's `linkComponent`). Default "a". */
  LinkComponent?: ElementType;
  /** Line under the name. */
  subtitle?: ReactNode;
  labels: Required<
    Pick<
      PostCardLabels,
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

function initials(name: string, locale: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0]?.toLocaleUpperCase(locale) ?? "")
      .slice(0, 2)
      .join("") || "?"
  );
}

function isoOf(value: Post["createdAt"]): string | undefined {
  const date = toDate(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function PostHeaderInner({
  post,
  kebab,
  headingAs: Heading,
  formattedTime,
  authorId,
  locale,
  timeZone,
  authorHref,
  LinkComponent = "a",
  subtitle,
  labels,
  onLocationClick,
  onMentionClick,
  compact = false,
  className,
}: PostHeaderProps) {
  // §2.1-B step rules: non-compact `h-9 w-9 → h-10 w-10` at sm; compact
  // `h-7 w-7 → h-8 w-8` at sm. Avatar is decorative (not a touch target).
  const avatarSize = compact
    ? "h-7 w-7 sm:h-8 sm:w-8"
    : "h-9 w-9 sm:h-10 sm:w-10";
  const nameSize = compact ? "text-sm" : "text-sm";

  // Per description §1.3 render-surface table:
  //   - replyTo: feed / detail only — hidden on compact / list
  //   - location: feed / detail / compact / list — all render; compact/list truncate
  // (compact=true is passed by both compact AND list variants — they share the trimmed header.)
  const showReplyTo = !compact && post.replyTo !== undefined;
  const showLocation = post.location !== undefined;

  const avatarNode = (
    <Avatar className={cn(avatarSize, "shrink-0")}>
      {post.author.avatar ? (
        <AvatarImage src={post.author.avatar} alt="" />
      ) : null}
      <AvatarFallback>{initials(post.author.name, locale)}</AvatarFallback>
    </Avatar>
  );

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
          {authorHref ? (
            // The name link is the accessible one; this one is a bigger hit area for the
            // pointer, so it stays out of the tab order and the accessibility tree. `z-10`
            // keeps both links above the card's overlay link.
            <LinkComponent
              href={authorHref}
              aria-hidden="true"
              tabIndex={-1}
              className="relative z-10 shrink-0 rounded-full"
            >
              {avatarNode}
            </LinkComponent>
          ) : (
            avatarNode
          )}
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
                {authorHref ? (
                  <LinkComponent
                    href={authorHref}
                    className="relative z-10 hover:underline focus-visible:underline focus-visible:outline-none"
                  >
                    {post.author.name}
                  </LinkComponent>
                ) : (
                  post.author.name
                )}
              </Heading>
              {post.author.isVerified ? (
                <span className="shrink-0">
                  <VerifiedBadge ariaLabel={labels.verifiedBadgeLabel} />
                </span>
              ) : null}
            </div>

            {subtitle ? (
              <div className="min-w-0 truncate text-xs text-muted-foreground">
                {subtitle}
              </div>
            ) : null}

            {/* Sub-line — username · time + new v0.2.0 zone (edited / visibility / location). */}
            <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <span className="min-w-0 truncate">
                {post.author.username ? `@${post.author.username}` : null}
                {post.author.username && formattedTime ? (
                  <span aria-hidden="true"> · </span>
                ) : null}
                <time dateTime={isoOf(post.createdAt)}>{formattedTime}</time>
              </span>
              {post.editedAt ? (
                <EditedSuffix
                  label={labels.editedSuffix}
                  editedAt={post.editedAt}
                  locale={locale}
                  timeZone={timeZone}
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
        {kebab}
      </div>
    </div>
  );
}

export const PostHeader = memo(PostHeaderInner);
PostHeader.displayName = "PostHeader";
